import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createWorker, PSM } from 'tesseract.js'
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
import type { Template } from '../../../types/template'

export const MAX_NOTE_LENGTH = 500
export const MAX_IMAGES = 10

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
  // OCR 独立的文件输入：单选一张图，仅用于识别填充表单，不作为附件
  const ocrFileInputRef = useRef<HTMLInputElement>(null)

  const editIdRaw = searchParams.get('edit')
  const editIdNum = editIdRaw ? Number(editIdRaw) : NaN
  const isEditMode = !isNaN(editIdNum) && editIdNum > 0

  // todayStr 不缓存：保证用户跨午夜停留页面时日期会更新到当天（F-L6）
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })

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

  // 缓存 Tesseract worker，避免每次 OCR 都重新创建并加载语言包（F-H1）
  const workerRef = useRef<Tesseract.Worker | null>(null)
  const workerPromiseRef = useRef<Promise<Tesseract.Worker> | null>(null)
  // T-M7: 追踪所有待清理的 blob URL
  const pendingBlobUrlsRef = useRef<Set<string>>(new Set())
  const getWorker = useCallback(async (): Promise<Tesseract.Worker> => {
    if (workerRef.current) return workerRef.current
    if (workerPromiseRef.current) return workerPromiseRef.current
    workerPromiseRef.current = createWorker('chi_sim+eng', undefined, {
      logger: () => {},
      errorHandler: () => {},
      workerPath: '/tesseract-worker.min.js',
      workerBlobURL: false,
    }).then(async (w) => {
      // 配置 PSM 6：统一文本块，适合结构化文档（如微信/支付宝交易详情）
      // 限制字符白名单：中文、数字、常见符号，减少误识别
      await w.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: '',
      })
      workerRef.current = w
      workerPromiseRef.current = null
      return w
    })
    return workerPromiseRef.current
  }, [])

  // T-M7: 组件卸载时清理：终止 worker + 释放所有未提交的 blob URL
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => undefined)
        workerRef.current = null
      }
      // T-M7: 释放 ref 中追踪的所有 blob URL
      pendingBlobUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      pendingBlobUrlsRef.current.clear()
    }
  }, [])

  // Queries
  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['transaction', editIdNum],
    queryFn: () => getTransaction(editIdNum),
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

  // 从编辑模式切换到新建模式（或新建模式进入）时重置表单（F-M13）
  useEffect(() => {
    if (!isEditMode) {
      handleReset()
    }
    // 仅依赖 isEditMode，切换时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  // Derived data
  const allImageUrls = useMemo(
    () => [...savedImageUrls, ...pendingImages.map((p) => p.localUrl)],
    [savedImageUrls, pendingImages],
  )

  // 仅 updateMutation 使用 imageUrlsJson；新建时通过后续 updateTransaction 更新图片 URL（F-L7）
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
      return updateTransaction(editIdNum, payload)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: number; file: Blob }) => {
      return uploadReceipt(transactionId, file)
    },
  })

  // Submit handler
  const { run: handleSubmit, isRunning: submitInProgress } = useDebouncedAction(async () => {
    const amountNum = parseFloat(formData.amount)
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
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

        if (pendingImages.length > 0 && editIdNum) {
          // 并行上传多张图片（F-M12）
          const results = await Promise.all(
            pendingImages.map((p) => uploadMutation.mutateAsync({ transactionId: editIdNum, file: p.blob })),
          )
          const newUrls = results.map((r) => r?.image_url).filter((url): url is string => Boolean(url))
          if (newUrls.length > 0) {
            const merged = [...savedImageUrls, ...newUrls]
            await updateTransaction(editIdNum, { image_urls: JSON.stringify(merged) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
        notify({ type: 'success', message: '交易已更新' })
      } else {
        const result = await createMutation.mutateAsync()
        const newTransactionId = result?.id

        if (pendingImages.length > 0 && newTransactionId) {
          // 并行上传多张图片（F-M12）
          const results = await Promise.all(
            pendingImages.map((p) => uploadMutation.mutateAsync({ transactionId: newTransactionId, file: p.blob })),
          )
          const uploadedUrls = results.map((r) => r?.image_url).filter((url): url is string => Boolean(url))
          if (uploadedUrls.length > 0) {
            await updateTransaction(newTransactionId, { image_urls: JSON.stringify(uploadedUrls) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
        notify({ type: 'success', message: '交易已保存' })
      }
      handleReset()
      navigate('/transactions')
    } catch {
      notify({ type: 'error', message: isEditMode ? '更新失败' : '保存失败' })
    }
  })

  // Template handler
  const handleTemplateConfirm = (template: Template) => {
    setFormData((prev) => ({
      ...prev,
      type: (template.type as 'expense' | 'income') || prev.type,
      category: template.category_id || prev.category,
      amount: template.amount ? String(template.amount) : prev.amount,
      brand: template.merchant_name || prev.brand,
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

  // 附件上传：多选图片作为交易附件，不做 OCR（与 OCR 识别是独立的两件事）
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
      for (const file of toProcess) {
        const compressed = await compressImage(file, 1200, 0.7)
        const localUrl = URL.createObjectURL(compressed)
        // T-M7: 追踪 blob URL 以便卸载时清理
        pendingBlobUrlsRef.current.add(localUrl)
        newPending.push({ localUrl, blob: compressed })
      }
      setPendingImages((prev) => [...prev, ...newPending])
    } catch {
      notify({ type: 'error', message: '图片处理失败' })
    }
    e.target.value = ''
  }

  // OCR 识别：单选一张照片，识别金额/类型/分类/备注/日期并填充表单，不作为附件
  const handleOcrSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrProcessing(true)
    try {
      const compressed = await compressImage(file, 1200, 0.7)
      const ocrResult = await parseReceiptOCR(compressed)
      if (ocrResult) {
        setFormData((prev) => {
          let next = { ...prev }
          // 如果识别出类型且与当前不同，切换类型并清空分类（分类按类型过滤）
          if (ocrResult.type && ocrResult.type !== prev.type) {
            next.type = ocrResult.type
            next.category = ''
          }
          next.amount = ocrResult.amount !== undefined ? ocrResult.amount : prev.amount
          next.category = ocrResult.category || next.category || prev.category
          next.note = ocrResult.note || prev.note
          next.date = ocrResult.date || prev.date
          return next
        })
        notify({ type: 'success', message: 'OCR 识别成功，已自动填充表单' })
      } else {
        notify({ type: 'error', message: '未能识别票据内容，请重试或手动填写' })
      }
    } catch {
      notify({ type: 'error', message: 'OCR 识别失败' })
    } finally {
      setOcrProcessing(false)
      e.target.value = ''
    }
  }

  const parseReceiptOCR = async (
    blob: Blob,
  ): Promise<{ amount?: string; type?: 'expense' | 'income'; category?: string; note?: string; date?: string } | null> => {
    try {
      const worker = await getWorker()
      const imageUrl = URL.createObjectURL(blob)
      try {
        // 配置 Tesseract：统一文本块模式 + 限制字符集，提升速度和准确度
        const ret = await worker.recognize(imageUrl, undefined, {
          rectangle: undefined,
        } as any)
        const text = ret.data.text.trim()
        if (!text) return null

        const textLower = text.toLowerCase()

        // ── 1. 提取金额 ─────────────────────────────────
        // 微信/支付宝交易详情中金额格式：-2182.00、¥128.50、2182、2182.0
        // 关键规则：排除超长数字（交易单号 20+ 位），只匹配合理金额范围
        let amount: string | undefined
        let amountIsNegative = false

        // 辅助：从文本中提取所有可能的金额候选
        const extractAmountCandidates = (inputText: string): Array<{ raw: string; value: number; source: string }> => {
          const candidates: Array<{ raw: string; value: number; source: string }> = []

          // 模式 A：带明确金额标签（支付金额、实付金额、合计等）+ 可选 ¥/￥ + 数字
          // 支持：2182、2182.0、2182.00、2,182.00、-2182
          const labelPattern = /(?:支付金额|实付金额|总金额|合计|实付|支付|应付|价格|票价|售价|金额|支出|收入|转账|消费)\s*[：:]?\s*[¥￥]?\s*(-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?)/gi
          let m: RegExpExecArray | null
          while ((m = labelPattern.exec(inputText)) !== null) {
            const raw = m[1].replace(/,/g, '')
            const val = parseFloat(raw)
            if (!isNaN(val) && val !== 0 && Math.abs(val) < 100000000) {
              candidates.push({ raw, value: val, source: 'label' })
            }
          }

          // 模式 B：带 ¥/￥ 符号的金额
          const currencyPattern = /[¥￥]\s*(-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?)/g
          while ((m = currencyPattern.exec(inputText)) !== null) {
            const raw = m[1].replace(/,/g, '')
            const val = parseFloat(raw)
            if (!isNaN(val) && val !== 0 && Math.abs(val) < 100000000) {
              candidates.push({ raw, value: val, source: 'currency' })
            }
          }

          // 模式 C：独立数字（前后有空白或行首行尾），排除 20+ 位数字
          // 匹配：-2182.00、2182、2182.0、2,182
          const standalonePattern = /(?:^|\s)(-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?)(?:\s|$)/g
          while ((m = standalonePattern.exec(inputText)) !== null) {
            const raw = m[1].replace(/,/g, '')
            const val = parseFloat(raw)
            if (!isNaN(val) && val !== 0 && Math.abs(val) < 100000000) {
              candidates.push({ raw, value: val, source: 'standalone' })
            }
          }

          // 模式 D：兜底，找所有看起来像金额的数字（有小数点或千分位）
          const loosePattern = /-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?/g
          while ((m = loosePattern.exec(inputText)) !== null) {
            const raw = m[0].replace(/,/g, '')
            const val = parseFloat(raw)
            if (!isNaN(val) && val !== 0 && Math.abs(val) < 100000000) {
              // 检查是否已存在（避免重复）
              const exists = candidates.some((c) => c.raw === raw && Math.abs(c.value - val) < 0.01)
              if (!exists) {
                candidates.push({ raw, value: val, source: 'loose' })
              }
            }
          }

          return candidates
        }

        const candidates = extractAmountCandidates(text)

        if (candidates.length > 0) {
          // 优先策略：
          // 1. 先看有没有明确标签的金额（支付金额、合计等）
          // 2. 再看有没有带 ¥ 符号的
          // 3. 再看有没有负数（微信支出常带 -）
          // 4. 最后取绝对值最大的（交易金额通常比手续费等大）
          const labelCandidates = candidates.filter((c) => c.source === 'label')
          const currencyCandidates = candidates.filter((c) => c.source === 'currency')
          const negativeCandidates = candidates.filter((c) => c.value < 0)

          let chosen: typeof candidates[0] | undefined

          if (labelCandidates.length > 0) {
            // 有标签的金额中，取绝对值最大的（避免匹配到手续费、优惠等小额数字）
            chosen = labelCandidates.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
          } else if (currencyCandidates.length > 0) {
            chosen = currencyCandidates.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
          } else if (negativeCandidates.length > 0) {
            // 负数通常就是主金额（微信支出）
            chosen = negativeCandidates.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
          } else {
            // 兜底：取绝对值最大的，但要排除明显是时间（如 18:57 被误识别为 18.57）
            const filtered = candidates.filter((c) => {
              // 排除小于 0.01 和大于 1 亿的
              if (Math.abs(c.value) < 0.01 || Math.abs(c.value) >= 100000000) return false
              // 排除看起来像时间的：18.57、9.30 等（整数部分 1-23，小数部分 00-59）
              const absVal = Math.abs(c.value)
              const intPart = Math.floor(absVal)
              const decPart = Math.round((absVal - intPart) * 100)
              if (intPart >= 1 && intPart <= 23 && decPart >= 0 && decPart <= 59 && decPart % 10 === 0) {
                // 如果这个数字前后有冒号或"时"字，更可能是时间
                const surrounding = text.substring(
                  Math.max(0, text.indexOf(c.raw) - 3),
                  Math.min(text.length, text.indexOf(c.raw) + c.raw.length + 3),
                )
                if (/[:：时]/.test(surrounding)) return false
              }
              return true
            })
            if (filtered.length > 0) {
              chosen = filtered.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
            } else {
              chosen = candidates.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
            }
          }

          if (chosen) {
            amountIsNegative = chosen.value < 0
            amount = String(Math.abs(chosen.value))
          }
        }

        // ── 2. 提取日期 ─────────────────────────────────
        // 支持：2024-12-25、2024/12/25、2024.12.25、2024年12月25日、12月25日、20241225
        let date: string | undefined

        const datePatterns = [
          // 2024年12月25日 18:57:55
          /(\d{4})年(\d{1,2})月(\d{1,2})日/,
          // 2024-12-25 或 2024/12/25 或 2024.12.25
          /(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/,
          // 12月25日（当年）
          /(\d{1,2})月(\d{1,2})日/,
          // 20241225
          /(\d{4})(\d{2})(\d{2})/,
        ]

        for (const pattern of datePatterns) {
          const match = text.match(pattern)
          if (match) {
            let y: string, m: string, d: string
            if (match.length === 4) {
              y = match[1]
              m = match[2]
              d = match[3]
            } else {
              // 12月25日 格式：补当年年份
              const now = new Date()
              y = String(now.getFullYear())
              m = match[1]
              d = match[2]
            }
            const yi = parseInt(y, 10)
            const mi = parseInt(m, 10)
            const di = parseInt(d, 10)
            // 校验年份范围 2000-2099，月份 1-12，日期 1-31
            if (yi >= 2000 && yi <= 2099 && mi >= 1 && mi <= 12 && di >= 1 && di <= 31) {
              date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
              break
            }
          }
        }

        // ── 3. 判断类型（支出 vs 收入）──────────────────
        let type: 'expense' | 'income' | undefined

        // 微信/支付宝交易详情中，金额前带 - 号表示支出，+ 号表示收入
        if (amountIsNegative) {
          type = 'expense'
        } else {
          const incomeKeywords = /工资|收入|退款|奖金|利息|理财|报销|补贴|津贴|退货|返现|红包|转账收入|转帐收入|收款|到账|入账/i
          const expenseKeywords = /消费|支出|支付|购买|付款|实付|应付|商品|购物|餐饮|交通|加油|停车|超市|药店|医院|电影票|门票|酒店|住宿|美团|饿了么|滴滴|淘宝|京东/i

          if (incomeKeywords.test(text)) {
            type = 'income'
          } else if (expenseKeywords.test(text)) {
            type = 'expense'
          }
        }

        // ── 4. 匹配分类 ─────────────────────────────────
        let category: string | undefined

        const categoryKeywords: Record<string, string[]> = {
          '餐饮': ['餐饮', '餐厅', '饭店', '美食', '外卖', '咖啡', '奶茶', '火锅', '烧烤', '寿司', '肯德基', '麦当劳', '星巴克', '瑞幸', '必胜客', '面包', '蛋糕', '甜品', '美团', '饿了么'],
          '交通': ['交通', '打车', '滴滴', '地铁', '公交', '出租', '出行', '高德', '火车票', '机票', '高铁', '顺风车', '共享单车', '哈啰', '摩拜'],
          '购物': ['购物', '超市', '便利店', '商品', '购买', '京东', '淘宝', '天猫', '拼多多', '唯品会', '抖音', '快手', '小红书', 'Costco', '山姆', '盒马', '永辉', '沃尔玛', '大润发'],
          '水果': ['水果', '水果店', '百果园', '水果鲜', '果切', '草莓', '芒果', '苹果', '香蕉', '榴莲', '西瓜'],
          '日用': ['日用', '日用品', '洗护', '清洁', '纸巾', '洗衣液', '洗洁精', '牙膏', '牙刷', '沐浴露', '洗发水', '护发素', '化妆品', '护肤品', '面膜'],
          '服装': ['服装', '衣服', '鞋子', '鞋', '裤子', '外套', 'T恤', '连衣裙', '衬衫', '内衣', '优衣库', 'ZARA', 'H&M', 'UR', '太平鸟', '森马', '海澜之家', '波司登'],
          '美容': ['美容', '美发', '美甲', '护肤', 'SPA', '按摩', '洗脸', '医美', '整形', '光子', '水光', '超声刀', '热玛吉'],
          '医疗': ['医疗', '医院', '诊所', '药店', '药房', '药品', '挂号', '体检', '检查', 'CT', 'X光', '疫苗', '拔牙', '洗牙', '口腔', '眼科', '皮肤科', '内科'],
          '教育': ['教育', '学费', '培训', '课程', '学习', '考试', '教材', '辅导', '新东方', '学而思', '猿辅导', '作业帮', '有道', '网课', '学位', '学历', '学校', '幼儿园'],
          '住房': ['住房', '房租', '物业', '水电', '燃气', '宽带', '取暖', '装修', '家具', '家电', '冰箱', '空调', '洗衣机', '电视', '热水器', '燃气灶', '门锁', '物业费'],
          '通讯': ['通讯', '话费', '流量', '移动', '联通', '电信', '宽带', 'WiFi', '手机', '充话费', '套餐', '5G', '网络'],
          '娱乐': ['娱乐', '电影', '游戏', 'KTV', '酒吧', '桌游', '剧本杀', '密室', '演出', '话剧', '音乐会', '演唱会', '展览', '漫展', '台球', '麻将', '电竞', 'Steam', 'Switch', 'PS5', 'Xbox'],
          '数码': ['数码', '手机', '电脑', '笔记本', '平板', 'iPad', '耳机', '音箱', '键盘', '鼠标', '显示器', '显卡', 'CPU', '内存', '硬盘', '苹果', 'Apple', '小米', '华为', 'OPPO', 'vivo', '荣耀'],
          '旅行': ['旅行', '旅游', '机票', '酒店', '民宿', '门票', '景区', '签证', '护照', '租车', '自驾游', '跟团', '度假村', '机场'],
          '宠物': ['宠物', '猫', '狗', '猫粮', '狗粮', '疫苗', '宠物医院', '宠物店', '美容', '洗澡', '驱虫', '绝育'],
          '礼品': ['礼品', '礼物', '礼盒', '鲜花', '花', '礼品卡', '卡券', '红包', '礼金', '份子', '结婚', '生日', '节日'],
          '工资': ['工资', '薪资', '月薪', '年薪', '奖金', '年终奖', '绩效', '提成', '分红', '股票', '期权'],
          '理财': ['理财', '基金', '股票', '债券', '保险', '定期', '余额宝', '银行', '投资', '收益', '利息', '股息'],
          '奖金': ['奖金', '奖励', '激励', '表彰', '竞赛', '奖学金', '比赛', '获奖'],
          '退款': ['退款', '退货', '取消', '撤销', '退回', '返现', '反现', '退订'],
        }

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

        // 微信/支付宝交易详情中，"商品"、"商户全称"、"商品说明"后的内容最有意义
        const merchantMatch = text.match(/(?:商户全称|商品|商品说明|商户名称|商家名称|店铺名称)[：:]\s*(.+)/i)
        if (merchantMatch) {
          note = merchantMatch[1].trim().slice(0, 50)
        }

        if (!note) {
          const lines = text.split('\n').filter((line) => {
            const l = line.trim()
            if (!l) return false
            // 过滤掉纯金额行、日期行、时间行、单字行、交易单号行
            if (/^[¥￥]?\s*-?[\d,]+\.\d{2}\s*$/.test(l)) return false
            if (/^\d{4}[-\/年]/.test(l)) return false
            if (/^\d{2}:\d{2}/.test(l)) return false
            if (/^\d{20,}$/.test(l)) return false // 交易单号
            if (/^(合计|金额|总计|实付|支付|商品|数量|单价|收银员|订单|流水|电话|地址|网址|欢迎|光临|谢谢|您|当前状态|支付方式|收单机构|商户单号|交易单号)/i.test(l)) return false
            if (l.length <= 2) return false
            return true
          })
          const bestLine = [...lines].sort((a, b) => b.trim().length - a.trim().length)[0]
          if (bestLine) {
            note = bestLine.trim().slice(0, 50)
          }
        }

        return { amount, type, category, note, date }
      } finally {
        URL.revokeObjectURL(imageUrl)
      }
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
        pendingBlobUrlsRef.current.delete(removed.localUrl)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleClearAllImages = () => {
    pendingImages.forEach((p) => {
      if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl)
      pendingBlobUrlsRef.current.delete(p.localUrl)
    })
    setPendingImages([])
    setSavedImageUrls([])
  }

  const handleReset = () => {
    // 编辑模式下"重置"恢复为原始编辑数据，而非清空（F-M11）
    if (isEditMode && editData) {
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
      } else {
        setLocation(null)
      }
      // 清理 pending 但保留已保存的图片
      pendingImages.forEach((p) => {
        if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl)
      })
      setPendingImages([])
      setSavedImageUrls(parseImageList(editData))
    } else {
      setFormData({ amount: '', category: '', type: 'expense', date: todayStr, brand: '', note: '' })
      setLocation(null)
      handleClearAllImages()
    }
  }

  const isSubmitting = submitInProgress || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canAddMore = allImageUrls.length < MAX_IMAGES

  return {
    isEditMode, editLoading,
    formData, setFormData,
    location, setLocation,
    showLocationPicker, setShowLocationPicker,
    savedImageUrls, pendingImages, allImageUrls,
    showTemplateSelector, setShowTemplateSelector,
    ocrProcessing, canAddMore,
    categories, templates, categoryOptions,
    isSubmitting, fileInputRef, ocrFileInputRef,
    handleSubmit, handleTemplateConfirm, handleLocationConfirm,
    handleFileSelect, handleOcrSelect, handleRemoveSavedImage, handleRemovePendingImage, handleClearAllImages, handleReset,
  }
}
