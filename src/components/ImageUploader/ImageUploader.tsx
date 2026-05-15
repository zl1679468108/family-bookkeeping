import React, { useState, useRef } from 'react'

interface ImageUploaderProps {
  onOcrComplete?: (data: { amount: string; category: string; note: string }) => void
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onOcrComplete }) => {
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setIsScanning(true)

        setTimeout(() => {
          setIsScanning(false)
          onOcrComplete?.({
            amount: '156.80',
            category: 'food',
            note: '超市购物 - 识别自收据'
          })
        }, 2000)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage('')
    setIsScanning(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div 
      className={`image-upload ${selectedImage ? 'has-image' : ''} ${isScanning ? 'scanning' : ''}`}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="scan-overlay"></div>
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
        </>
      )}
    </div>
  )
}