import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createWorker } from 'tesseract.js'
import { createTransaction, getTransaction, updateTransaction, uploadReceipt } from '../../../services/api'
import { useCategories } from '../../../hooks/useCategories'
import { useTemplates } from '../../../hooks/useTemplates'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import type { DropdownOption } from '../../../components/ui/Dropdown'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notify } from '../../../utils/notifications'
import { parseImageList } from '../../../utils/parseImageList'
import { compressImage } from '../../../utils/imageCompress'
import type { LocationResult } from '../../../types/map'

export const MAX_NOTE_LENGTH = 500
export const MAX_IMAGES = 5

export interface PendingImage {
  localUrl: string
  blob: Blob
}

export interface FormData {
  amount: string
  category: string
  type: 'expense' | 'income'
  date: string
  brand: string
  note: string
}

export function useTransactionForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editId = searchParams.get('edit')
  const isEditMode = !!editId

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: '',
    type: 'expense',
    date: todayStr,
    brand: '',
    note: '',
  })

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [savedImageUrls, setSavedImageUrls] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)

  // Queries
  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['transaction', editId],
    queryFn: () => getTransaction(Number(editId)),
    enabled: isEditMode,
  })

  const { data: categories = [] } = useCategories()
  const { data: templates = [] } = useTemplates()

  // Load edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        amount: String(editData.amount),
        category: editData.category,
        type: editData.type,
        date: editData.date,
        brand: editData.brand || '',
        note: editData.description || '',
      })
      if (editData.latitude && editData.longitude) {
        setLocation({
          locationName: editData.location_name || '',
          latitude: editData.latitude,
          longitude: editData.longitude,
          poiId: editData.poi_id || null,
        })
      }
      setSavedImageUrls(parseImageList(editData))
    }
  }, [editData])

  // Derived data
  const allImageUrls = useMemo(
    () => [...savedImageUrls, ...pendingImages.map((p) => p.localUrl)],
    [savedImageUrls, pendingImages],
  )

  const imageUrlsJson = useMemo(() => {
    if (savedImageUrls.length === 0) return undefined
    return JSON.stringify(savedImageUrls)
  }, [savedImageUrls])

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c: any) => c.type === formData.type)
      .map((c: any) => ({
        key: c.id,
        label: c.name,
        icon: renderCategoryIcon(c.icon, { size: 18 }),
      })) as DropdownOption[]
  }, [formData.type, categories])

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.note || undefined,
        brand: formData.brand || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_name: location?.locationName,
        poi_id: location?.poiId,
      }
      return createTransaction(payload)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.note || undefined,
        brand: formData.brand || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_name: location?.locationName,
        poi_id: location?.poiId,
        image_urls: imageUrlsJson,
      }
      return updateTransaction(Number(editId), payload)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: number; file: Blob }) => {
      return uploadReceipt(transactionId, file)
    },
  })

  // Submit handler
  const { run: handleSubmit, isRunning: submitInProgress } = useDebouncedAction(async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify({ type: 'error', message: '请输入有效金额' })
      return
    }
    if (!formData.category) {
      notify({ type: 'error', message: '请选择分类' })
      return
    }

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync()

        if (pendingImages.length > 0 && editId) {
          const newUrls: string[] = []
          for (const p of pendingImages) {
            const r = await uploadMutation.mutateAsync({ transactionId: Number(editId), file: p.blob })
            if (r?.image_url) newUrls.push(r.image_url)
          }
          if (newUrls.length > 0) {
            const merged = [...savedImageUrls, ...newUrls]
            await updateTransaction(Number(editId), { image_urls: JSON.stringify(merged) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        notify({ type: 'success', message: '交易已更新' })
      } else {
        const result = await createMutation.mutateAsync()
        const newTransactionId = result?.id

        if (pendingImages.length > 0 && newTransactionId) {
          const uploadedUrls: string[] = []
          for (const p of pendingImages) {
            const r = await uploadMutation.mutateAsync({ transactionId: newTransactionId, file: p.blob })
            if (r?.image_url) uploadedUrls.push(r.image_url)
          }
          if (uploadedUrls.length > 0) {
            await updateTransaction(newTransactionId, { image_urls: JSON.stringify(uploadedUrls) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        notify({ type: 'success', message: '交易已保存' })
      }
      navigate('/transactions')
    } catch {
      notify({ type: 'error', message: isEditMode ? '更新失败' : '保存失败' })
    }
  })

  // Template handler
  const handleTemplateConfirm = (template: any) => {
    setFormData((prev) => ({
      ...prev,
      type: (template.type as 'expense' | 'income') || prev.type,
      category: template.category_id || prev.category,
      amount: template.amount ? String(template.amount) : prev.amount,
      brand: template.brand || prev.brand,
      note: template.note ?? prev.note,
    }))
    if (template.latitude && template.longitude) {
      setLocation({
        locationName: template.location_name || '',
        latitude: template.latitude,
        longitude: template.longitude,
        poiId: template.poi_id || null,
      })
    }
    setShowTemplateSelector(false)
    notify({ type: 'success', message: `已应用模板：${template.name}` })
  }

  // Location handler
  const handleLocationConfirm = (loc: LocationResult) => {
    setLocation(loc)
    setShowLocationPicker(false)
  }

  // File select handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = MAX_IMAGES - allImageUrls.length
    if (remaining <= 0) {
      notify({ type: 'error', message: `最多只能上传 ${MAX_IMAGES} 张图片` })
      e.target.value = ''
      return
    }

    const toProcess = Array.from(files).slice(0, remaining)

    try {
      const newPending: PendingImage[] = []
      let firstOcrDone = false

      for (const file of toProcess) {
        const compressed = await compressImage(file, 1200, 0.7)
        const localUrl = URL.createObjectURL(compressed)
        newPending.push({ localUrl, blob: compressed })

        if (!firstOcrDone) {
          firstOcrDone = true
          setOcrProcessing(true)
          try {
            const ocrResult = await parseReceiptOCR(compressed)
            if (ocrResult) {
              setFormData((prev) => {
                let next = { ...prev }
                // 如果识别出类型且与当前不同，切换类型并清空分类（分类按类型过滤）
                if (ocrResult.type && ocrResult.type !== prev.type) {
                  next.type = ocrResult.type
                  next.category = ''
                }
                next.amount = ocrResult.amount || prev.amount
                next.category = ocrResult.category || next.category || prev.category
                next.note = ocrResult.note || prev.note
                next.date = ocrResult.date || prev.date
                return next
              })
              notify({ type: 'success', message: 'OCR 识别成功，已自动填充表单' })
            }
          } catch {
            // OCR 失败不影响上传
          } finally {
            setOcrProcessing(false)
          }
        }
      }

      setPendingImages((prev) => [...prev, ...newPending])
    } catch {
      notify({ type: 'error', message: '图片处理失败' })
    }
    e.target.value = ''
  }

  const parseReceiptOCR = async (
    blob: Blob,
  ): Promise<{ amount?: string; type?: 'expense' | 'income'; category?: string; note?: string; date?: string } | null> => {
    try {
      const worker = await createWorker('chi_sim+eng')
      const imageUrl = URL.createObjectURL(blob)
      const ret = await worker.recognize(imageUrl)
      await worker.terminate()
      URL.revokeObjectURL(imageUrl)

      const text = ret.data.text.trim()
      if (!text) return null

      const textLower = text.toLowerCase()

      // ── 1. 提取金额 ─────────────────────────────────
      // 优先级：合计 > 实付/支付 > 金额 > 任意 ¥ 后数字
      let amount: string | undefined

      // 1.1 带金额标签的数字（如 合计：¥128.50）
      const labelAmount = text.match(/(?:合计|总金额|实付|支付|应付|价格|票价|售价)\s*[：:]?\s*[¥￥]?\s*([\d,]+\.?\d{0,2})/i)
      if (labelAmount) {
        amount = String(labelAmount[1]).replace(/,/g, '').replace(/^0+/, '') || labelAmount[1]
      }

      // 1.2 没找到的话，找 ¥ 后面的数字
      if (!amount) {
        const currencyAmount = text.match(/[¥￥]\s*([\d,]+\.?\d{0,2})/)
        if (currencyAmount) {
          amount = String(currencyAmount[1]).replace(/,/g, '').replace(/^0+/, '') || currencyAmount[1]
        }
      }

      // 1.3 还是没找到，找任何含两位的金额数字
      if (!amount) {
        const genericAmount = text.match(/([\d,]+\.\d{2})/g)
        if (genericAmount) {
          // 取最大的（通常合计金额最大）
          const max = Math.max(...genericAmount.map((a) => parseFloat(a.replace(/,/g, ''))))
          amount = String(max)
        }
      }

      // 1.4 最后兜底：纯数字（可能不带小数）
      if (!amount) {
        const plainNum = text.match(/[\d,]+\.?\d{0,2}/g)
        if (plainNum) {
          const candidates = plainNum
            .map((s) => parseFloat(s.replace(/,/g, '')))
            .filter((n) => n > 0)
          if (candidates.length) {
            amount = String(Math.max(...candidates))
          }
        }
      }

      // ── 2. 提取日期 ─────────────────────────────────
      let date: string | undefined
      const dateMatch = text.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/) ||
        text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/) ||
        text.match(/(\d{4})(\d{2})(\d{2})/)
      if (dateMatch) {
        const [, y, m, d] = dateMatch
        date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }

      // ── 3. 判断类型（支出 vs 收入）──────────────────
      let type: 'expense' | 'income' | undefined
      const incomeKeywords = /工资|收入|退款|奖金|利息|理财|报销|补贴|津贴|退款|退货|返现|红包|转账收入|转帐收入/i
      const expenseKeywords = /消费|支出|支付|购买|付款|实付|应付|商品|购物|餐饮|交通|加油|停车|超市|药店|医院|电影票|门票|酒店|住宿/i

      if (incomeKeywords.test(text)) {
        type = 'income'
      } else if (expenseKeywords.test(text)) {
        type = 'expense'
      }

      // ── 4. 匹配分类 ─────────────────────────────────
      let category: string | undefined

      // 建立关键词映射：分类名 → 关键词列表
      const categoryKeywords: Record<string, string[]> = {
        '餐饮': ['餐饮', '餐厅', '饭店', '美食', '外卖', '咖啡', '奶茶', '奶茶', '火锅', '烧烤', '寿司', '肯德基', '麦当劳', '星巴克', '瑞幸', '必胜客', '面包', '蛋糕', '甜品'],
        '交通': ['交通', '打车', '滴滴', '地铁', '公交', '出租', '公交', '出行', '高德', '火车票', '机票', '高铁', '滴滴', '顺风车', '共享单车', '哈啰', '摩拜'],
        '购物': ['购物', '超市', '便利店', '商品', '购买', '京东', '淘宝', '天猫', '拼多多', '唯品会', '抖音', '快手', '小红书', 'Costco', '山姆', '盒马', '永辉', '沃尔玛', '大润发', '7-11', '全家', '罗森'],
        '水果': ['水果', '水果店', '百果园', '水果鲜', '果切', '草莓', '芒果', '苹果', '香蕉', '榴莲', '西瓜'],
        '日用': ['日用', '日用品', '洗护', '清洁', '纸巾', '洗衣液', '洗洁精', '牙膏', '牙刷', '沐浴露', '洗发水', '护发素', '化妆品', '护肤品', '面膜', '超市'],
        '服装': ['服装', '衣服', '鞋子', '鞋', '裤子', '外套', 'T恤', '连衣裙', '衬衫', '内衣', '优衣库', 'ZARA', 'H&M', 'UR', '太平鸟', '森马', '海澜之家', '波司登'],
        '美容': ['美容', '美发', '美甲', '护肤', 'SPA', '按摩', '洗脸', '美容', '医美', '整形', '光子', '水光', '超声刀', '热玛吉'],
        '医疗': ['医疗', '医院', '诊所', '药店', '药房', '药品', '挂号', '体检', '检查', 'CT', 'X光', '疫苗', '拔牙', '洗牙', '口腔', '眼科', '皮肤科', '内科'],
        '教育': ['教育', '学费', '培训', '课程', '学习', '考试', '教材', '辅导', '新东方', '学而思', '猿辅导', '作业帮', '有道', '网课', '学位', '学历', '学校', '学费', '幼儿园'],
        '住房': ['住房', '房租', '物业', '水电', '燃气', '宽带', '取暖', '装修', '家具', '家电', '冰箱', '空调', '洗衣机', '电视', '热水器', '燃气灶', '门锁', '物业费'],
        '通讯': ['通讯', '话费', '流量', '移动', '联通', '电信', '宽带', 'WiFi', '手机', '充话费', '套餐', '5G', '网络'],
        '娱乐': ['娱乐', '电影', '游戏', 'KTV', '酒吧', '桌游', '剧本杀', '密室', '演出', '话剧', '音乐会', '演唱会', '展览', '漫展', '台球', '麻将', '电竞', '游戏', 'Steam', 'Switch', 'PS5', 'Xbox'],
        '数码': ['数码', '手机', '电脑', '笔记本', '平板', 'iPad', '耳机', '音箱', '键盘', '鼠标', '显示器', '显卡', 'CPU', '内存', '硬盘', '苹果', 'Apple', '小米', '华为', 'OPPO', 'vivo', '荣耀'],
        '旅行': ['旅行', '旅游', '机票', '酒店', '民宿', '门票', '景区', '签证', '护照', '租车', '自驾游', '跟团', '度假村', '酒店', '机票', '火车票', '高铁', '机场'],
        '宠物': ['宠物', '猫', '狗', '猫粮', '狗粮', '疫苗', '宠物医院', '宠物店', '美容', '洗澡', '驱虫', '绝育', '宠物'],
        '礼品': ['礼品', '礼物', '礼盒', '鲜花', '花', '礼物', '礼品卡', '卡券', '红包', '礼金', '份子', '结婚', '生日', '节日'],
        '工资': ['工资', '薪资', '月薪', '年薪', '奖金', '年终奖', '绩效', '提成', '分红', '股票', '期权'],
        '理财': ['理财', '基金', '股票', '债券', '保险', '定期', '余额宝', '银行', '投资', '收益', '利息', ' dividends', '股息'],
        '奖金': ['奖金', '奖励', '激励', '表彰', '竞赛', '奖学金', '比赛', '获奖'],
        '退款': ['退款', '退货', '取消', '撤销', '退回', '返现', '反现', '红包', '退订'],
      }

      // 优先按关键词匹配
      for (const [catName, keywords] of Object.entries(categoryKeywords)) {
        const matched = categories.find((c: any) => {
          const cName = (c.name || '').trim()
          return cName === catName || cName.includes(catName) || catName.includes(cName)
        })
        if (matched && keywords.some((kw) => textLower.includes(kw.toLowerCase()))) {
          category = matched.id
          break
        }
      }

      // 如果没匹配到，尝试用分类名直接包含匹配
      if (!category) {
        for (const c of categories) {
          const cName = (c.name || '').trim()
          if (cName && textLower.includes(cName.toLowerCase())) {
            category = c.id
            break
          }
        }
      }

      // ── 5. 提取备注 ─────────────────────────────────
      let note: string | undefined

      // 清理文本：去掉金额行、日期行、标签行等
      const lines = text.split('\n').filter((line) => {
        const l = line.trim()
        if (!l) return false
        // 过滤掉纯金额行、日期行、单字行
        if (/^[¥￥]?\s*[\d,]+\.?\d{0,2}\s*$/.test(l)) return false
        if (/^(\d{4}[-\d\s:]|\d{2}:\d{2})/.test(l)) return false
        if (/^(合计|金额|总计|实付|支付|商品|数量|单价|收银员|订单|流水|电话|地址|网址|欢迎|光临|谢谢|您)/i.test(l)) return false
        if (l.length <= 2) return false
        return true
      })

      // 取最长的有意义行作为备注
      const bestLine = lines.sort((a, b) => b.trim().length - a.trim().length)[0]
      if (bestLine) {
        note = bestLine.trim().slice(0, 50)
      }

      return { amount, type, category, note, date }
    } catch (err) {
      console.error('OCR error:', err)
      return null
    }
  }

  // Image management
  const handleRemoveSavedImage = (idx: number) => {
    setSavedImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleRemovePendingImage = (idx: number) => {
    setPendingImages((prev) => {
      const removed = prev[idx]
      if (removed && removed.localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.localUrl)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleClearAllImages = () => {
    pendingImages.forEach((p) => {
      if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl)
    })
    setPendingImages([])
    setSavedImageUrls([])
  }

  const handleReset = () => {
    setFormData({ amount: '', category: '', type: 'expense', date: todayStr, brand: '', note: '' })
    setLocation(null)
    handleClearAllImages()
  }

  const isSubmitting = submitInProgress || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canAddMore = allImageUrls.length < MAX_IMAGES

  return {
    editId, isEditMode, editLoading,
    formData, setFormData,
    location, setLocation,
    showLocationPicker, setShowLocationPicker,
    savedImageUrls, pendingImages, allImageUrls,
    showTemplateSelector, setShowTemplateSelector,
    ocrProcessing, canAddMore,
    categories, templates, categoryOptions,
    isSubmitting, fileInputRef,
    handleSubmit, handleTemplateConfirm, handleLocationConfirm,
    handleFileSelect, handleRemoveSavedImage, handleRemovePendingImage, handleClearAllImages, handleReset,
  }
}
