import React, { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import './index.scss'

interface ImageUploaderProps {
  onOcrComplete?: (data: { amount: string; categoryName: string; note: string }) => void
}

const categoryKeywords: Record<string, string[]> = {
  '餐饮': ['餐', '饮', '饭', '美食', '餐厅', '外卖', '咖啡', '奶茶', '火锅', '烧烤', '快餐', '美团', '饿了么', '云间宿', '餐饮管理', '餐厅', '饭店', 'food', 'restaurant', 'cafe', 'meal'],
  '交通': ['公交', '地铁', '打车', '滴滴', '出租', '加油', '停车', '高铁', '火车', '机票', '滴滴出行', '出租车', 'transport', 'taxi', 'flight', 'train'],
  '购物': ['超市', '商场', '淘宝', '京东', '拼多多', '衣服', '鞋', '化妆品', '数码', '便利店', 'shopping', 'mall', 'supermarket', 'store'],
  '居住': ['房租', '水电', '物业', '暖气', '宽带', '维修', '租房', 'housing', 'rent', 'utilities'],
  '娱乐': ['电影', '游戏', 'KTV', '旅游', '景点', '演出', 'movie', 'game', 'travel', 'entertainment'],
  '医疗': ['医院', '药店', '体检', '挂号', '药品', 'hospital', 'clinic', 'pharmacy', 'medical'],
  '教育': ['培训', '书', '课程', '学费', '文具', 'education', 'training', 'school', 'book'],
  '工资': ['工资', '薪资', '薪酬', '奖金', '提成', 'salary', 'income', 'pay', 'bonus'],
  '投资': ['股票', '基金', '理财', '利息', '分红', 'stock', 'fund', 'investment'],
  '兼职': ['兼职', '副业', '外快', 'part-time', 'freelance'],
  '礼金': ['红包', '礼金', '礼物', '压岁钱', 'gift', 'red envelope'],
}

const detectCategory = (text: string, amount: string): string => {
  const lowerText = text.toLowerCase()
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category
      }
    }
  }

  const numAmount = parseFloat(amount)
  if (numAmount > 5000) {
    return '工资'
  } else if (numAmount > 500) {
    return '购物'
  } else if (numAmount > 100) {
    return '餐饮'
  }
  
  return '餐饮'
}

const extractAmount = (text: string): string => {
  // 清洗 OCR 常见错误
  const cleaned = text
    .replace(/O/g, '0')
    .replace(/o/g, '0')
    .replace(/l/g, '1')
    .replace(/I/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    // 将中文逗号、空格等替换为普通符号
    .replace(/，/g, '.')
    .replace(/。/g, '.')
    .replace(/:/g, ':')

  // ---- 优先级1: 带负号 + 货币符号的金额（微信/支付宝账单特征） ----
  // 匹配: -¥2182.00、- ¥ 2182.00、-2182.00元、-¥2182.00元 等
  const negMoneyPatterns = [
    /-?\s*[¥￥]\s*(\d+(?:\.\d{1,2})?)/,
    /(-?\d+(?:\.\d{1,2})?)\s*[元圆]/,
    /-?\s*(\d+(?:\.\d{1,2})?)/,
  ]

  for (const pattern of negMoneyPatterns) {
    const match = cleaned.match(pattern)
    if (match) {
      const raw = match[1] || match[2]
      if (raw) {
        const num = parseFloat(raw)
        // 允许负金额
        if (Math.abs(num) >= 0.01 && Math.abs(num) <= 999999.99) {
          const absAmount = Math.abs(num).toFixed(2)
          console.log('【P1匹配】pattern:', pattern, '→', absAmount)
          return absAmount
        }
      }
    }
  }

  // ---- 优先级2: 支付语义上下文 ----
  const contextualPatterns = [
    /支付金额\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /实付\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /应付\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /消费\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /合计\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /金额\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /付款\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
    /扣款\s*[：:]?\s*-?[¥￥]?\s*(\d+(?:\.\d{1,2})?)/,
  ]

  for (const pattern of contextualPatterns) {
    const match = cleaned.match(pattern)
    if (match && match[1]) {
      const raw = match[1].replace(/[^\d.]/g, '')
      const num = parseFloat(raw)
      if (num >= 0.01 && num <= 999999.99) {
        console.log('【P2匹配】pattern:', pattern, '→', num.toFixed(2))
        return num.toFixed(2)
      }
    }
  }

  // ---- 优先级3: 找所有候选数字，智能排序 ----
  // 匹配所有可能金额格式的数字
  const candidateRegex = /(-?\d+(?:\.\d{1,2})?)/g
  const candidates: { raw: string; num: number; hasPoint: boolean; isNegative: boolean; context: string }[] = []
  let match: RegExpExecArray | null

  while ((match = candidateRegex.exec(cleaned)) !== null) {
    let raw = match[1]
    const isNegative = raw.startsWith('-')
    raw = raw.replace(/^-/, '')  // 去负号
    const num = parseFloat(raw)
    const absNum = Math.abs(num)

    // 过滤明显不是金额的
    if (absNum < 0.01 || absNum > 999999.99) continue
    // 排除银行卡号（14-19位连续数字）
    if (raw.length >= 14) continue
    // 排除手机号（11位连续数字且前面有"电话"等）
    if (raw.length === 11 && /电话|手机|TEL/i.test(cleaned.substring(Math.max(0, match.index - 10), match.index))) continue
    // 排除银行卡尾号（4位且前面有长数字串）
    if (raw.length === 4) {
      const before = cleaned.substring(Math.max(0, match.index - 30), match.index).replace(/\s/g, '')
      if (/\d{8,}$/.test(before)) continue
    }

    // 获取上下文（前后20字符）
    const ctx = cleaned.substring(Math.max(0, match.index - 20), match.index + raw.length + 20)
    candidates.push({ raw, num: absNum, hasPoint: raw.includes('.'), isNegative, context: ctx })
  }

  console.log('【P3候选】', candidates.map(c => `${c.raw}(${c.hasPoint?'dot':'int'},${c.isNegative?'neg':'pos'})`).join(', '))

  if (candidates.length === 0) return ''

  // 排序策略
  candidates.sort((a, b) => {
    // 1. 负号优先（支付账单中带负号的通常是金额）
    if (a.isNegative && !b.isNegative) return -1
    if (!a.isNegative && b.isNegative) return 1
    // 2. 带小数点优先（金额格式特征）
    if (a.hasPoint && !b.hasPoint) return -1
    if (!a.hasPoint && b.hasPoint) return 1
    // 3. 靠近支付关键词优先
    const aNear = /支付|实付|应付|消费|合计|金额|付款|扣款|交易/.test(a.context)
    const bNear = /支付|实付|应付|消费|合计|金额|付款|扣款|交易/.test(b.context)
    if (aNear && !bNear) return -1
    if (!aNear && bNear) return 1
    // 4. 排除4位及以下的小数字（很可能是尾号/日期）
    if (a.raw.length <= 4 && b.raw.length > 4) return 1
    if (b.raw.length <= 4 && a.raw.length > 4) return -1
    // 5. 金额较大的优先（账单金额通常不很小）
    return b.num - a.num
  })

  const result = candidates[0].num.toFixed(2)
  console.log('【P3结果】', result)
  return result
}

const generateNote = (text: string): string => {
  const noteParts: string[] = []
  
  const merchants = [
    ['美团', '美团'],
    ['微信', '微信支付'],
    ['支付宝', '支付宝'],
    ['云间宿', '云间宿'],
    ['滴滴', '滴滴出行'],
    ['饿了么', '饿了么'],
    ['淘宝', '淘宝'],
    ['京东', '京东'],
    ['拼多多', '拼多多'],
    ['星巴克', '星巴克'],
    ['麦当劳', '麦当劳'],
    ['肯德基', '肯德基'],
  ]
  
  for (const [keyword, name] of merchants) {
    if (text.includes(keyword)) {
      noteParts.push(name)
      break
    }
  }
  
  if (text.includes('午餐')) noteParts.push('午餐')
  if (text.includes('晚餐')) noteParts.push('晚餐')
  if (text.includes('早餐')) noteParts.push('早餐')
  if (text.includes('外卖')) noteParts.push('外卖')
  if (text.includes('超市')) noteParts.push('超市购物')
  if (text.includes('购物')) noteParts.push('购物')
  if (text.includes('出行')) noteParts.push('出行')
  if (text.includes('餐饮')) noteParts.push('餐饮')
  if (text.includes('餐厅')) noteParts.push('餐厅消费')
  
  if (noteParts.length === 0) {
    const goodsMatch = text.match(/商品\s*[：:]\s*([^\n]+)/)
    if (goodsMatch) {
      const goods = goodsMatch[1].trim()
      if (goods.length > 0 && goods.length < 50) {
        noteParts.push(goods)
      }
    }
  }
  
  return noteParts.length > 0 ? noteParts.join(' ') : '消费支出'
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onOcrComplete }) => {
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  const simulateProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 95
      }
      setScanProgress(Math.round(progress))
    }, 200)
    return interval
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string
        setSelectedImage(imageDataUrl)
        setIsScanning(true)
        setScanProgress(0)

        const progressInterval = simulateProgress()

        try {
          const worker = await createWorker('chi_sim+eng')

          const { data: { text } } = await worker.recognize(imageDataUrl)

          // DEBUG: 打印 OCR 原始识别结果
          console.log('【OCR原始文本】', text)
          console.log('【OCR文本长度】', text.length)

          await worker.terminate()

          const amount = extractAmount(text)
          console.log('【提取金额】', amount)

          const detectedCategory = detectCategory(text, amount)
          const note = generateNote(text)

          if (onOcrComplete) {
            onOcrComplete({
              amount,
              categoryName: detectedCategory,
              note: note || '识别自收据'
            })
          }
        } catch (error) {
          console.error('OCR识别失败:', error)
        } finally {
          clearInterval(progressInterval)
          setScanProgress(100)
          setTimeout(() => {
            setIsScanning(false)
            setScanProgress(0)
          }, 500)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage('')
    setIsScanning(false)
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="image-upload-wrapper">
      <div 
        className={`image-upload ${selectedImage ? 'has-image' : ''} ${isScanning ? 'scanning' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="scan-overlay"></div>
        <div className="scan-mask"></div>
        <div className="scan-text">
          <div className="scan-loader"></div>
          <div className="scan-label">识别中 {scanProgress}%</div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          id="fileInput" 
          accept="image/*" 
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="upload-placeholder">
          <svg className="image-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div className="image-upload-text">点击上传收据图片，自动识别金额和分类</div>
        </div>
        {selectedImage && (
          <>
            <img className="image-preview" src={selectedImage} alt="预览" />
            <button 
              className="remove-image" 
              onClick={(e) => {
                e.stopPropagation()
                removeImage()
              }}
            >
              ×
            </button>
            <button 
              className="preview-image" 
              onClick={(e) => {
                e.stopPropagation()
                setShowPreview(true)
              }}
              title="预览图片"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <div className="scan-progress">
              <div className="scan-progress-bar" style={{ width: `${scanProgress}%` }}></div>
            </div>
          </>
        )}
      </div>

      {showPreview && (
        <div 
          className="image-preview-modal" 
          onClick={() => setShowPreview(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowPreview(false)}
            >
              ×
            </button>
            <img src={selectedImage} alt="图片预览" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  )
}