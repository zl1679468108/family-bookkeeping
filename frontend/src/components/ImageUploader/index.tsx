import React, { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import './index.scss'

interface ImageUploaderProps {
  onOcrComplete?: (data: { amount: string; category: string; note: string }) => void
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
  const patterns = [
    /-(\d+(?:\.\d{1,2})?)\s*元/,
    /-¥\s?(\d+(?:\.\d{1,2})?)/,
    /-(\d+(?:\.\d{1,2})?)\s*元/,
    /金额\s*[：:]\s*(-?\d+(?:\.\d{1,2})?)/,
    /支付金额\s*[：:]\s*(-?\d+(?:\.\d{1,2})?)/,
    /实付\s*[：:]\s*(-?\d+(?:\.\d{1,2})?)/,
    /付款\s*[：:]\s*(-?\d+(?:\.\d{1,2})?)/,
    /-?\d+(?:\.\d{1,2})?\s*元/,
    /-?¥\s?\d+(?:\.\d{1,2})?/,
    /-?\d+(?:\.\d{1,2})?\s*元整/,
    /消费\s*(-?\d+(?:\.\d{1,2})?)/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let result = match[1] || match[0]
      result = result.replace(/[^\d.-]/g, '')
      if (isValidAmount(result)) {
        return Math.abs(parseFloat(result)).toFixed(2)
      }
    }
  }

  const numberRegex = /(\d+(?:\.\d{1,2})?)/g
  const numbers = text.match(numberRegex) || []
  
  const validNumbers = numbers.filter(n => {
    const num = parseFloat(n)
    return isValidAmount(n) && !isLikelyCardNumber(n) && !isLikelyPhoneNumber(n) && !isLikelyLastFourDigits(n, text)
  })

  if (validNumbers.length > 0) {
    const sorted = validNumbers.sort((a, b) => parseFloat(b) - parseFloat(a))
    for (const num of sorted) {
      if (parseFloat(num) > 0) {
        return parseFloat(num).toFixed(2)
      }
    }
  }
  
  return ''
}

const isValidAmount = (value: string): boolean => {
  const num = parseFloat(value)
  return !isNaN(num) && num >= 0.01 && num <= 999999.99
}

const isLikelyCardNumber = (value: string): boolean => {
  return value.length >= 14 && value.length <= 19 && /^\d+$/.test(value)
}

const isLikelyPhoneNumber = (value: string): boolean => {
  return value.length >= 11 && value.length <= 15 && /^\d+$/.test(value)
}

const isLikelyLastFourDigits = (value: string, text: string): boolean => {
  if (value.length !== 4) return false
  const cardPattern = new RegExp(`\\d{4}${value}`)
  return cardPattern.test(text)
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
          const worker = await createWorker('chi_sim')
          
          const { data: { text } } = await worker.recognize(imageDataUrl)
          
          await worker.terminate()

          const amount = extractAmount(text)
          const category = detectCategory(text, amount)
          const note = generateNote(text)

          if (onOcrComplete) {
            onOcrComplete({
              amount,
              category,
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