import React from 'react'
import './index.scss'

interface LocationDisplayProps {
  locationName?: string
  latitude?: number | string
  longitude?: number | string
  poiId?: string | null
  onClick?: () => void
  onClear?: () => void
  showButton?: boolean
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  locationName,
  latitude,
  longitude,
  poiId,
  onClick,
  onClear,
  showButton = false,
}) => {
  const hasLocation = locationName || (latitude && longitude)

  if (!hasLocation) {
    if (showButton && onClick) {
      return (
        <button className="loc-display-btn" onClick={onClick}>
          📍 选择地点
        </button>
      )
    }
    return null
  }

  const lat = typeof latitude === 'number' ? latitude.toFixed(6) : latitude
  const lng = typeof longitude === 'number' ? longitude.toFixed(6) : longitude

  return (
    <div className="loc-display">
      <div className="loc-display-header" onClick={onClick}>
        <span className="loc-display-icon">📍</span>
        <span className="loc-display-name">{locationName}</span>
      </div>
      {(latitude || longitude) && (
        <div className="loc-display-coords">
          {lat}, {lng}
        </div>
      )}
      {poiId && (
        <div className="loc-display-poi">
          商户ID: {poiId}
        </div>
      )}
      <div className="loc-display-actions">
        {onClick && (
          <span className="loc-display-edit" onClick={onClick}>
            · 点击修改
          </span>
        )}
        {onClear && (
          <button className="loc-display-clear" onClick={onClear}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default LocationDisplay