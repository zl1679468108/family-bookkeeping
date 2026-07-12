import React from 'react'

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
          选择地点
        </button>
      )
    }
    return null
  }

  const lat = typeof latitude === 'number' ? latitude.toFixed(6) : latitude
  const lng = typeof longitude === 'number' ? longitude.toFixed(6) : longitude

  return (
    <div className="loc-display">
      <div className="loc-display-name">{locationName}</div>
      <div className="loc-display-body">
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
      </div>
      {(onClick || onClear) && (
        <div className="loc-display-footer">
          {onClick && (
            <span className="loc-display-edit" onClick={onClick}>
              点击修改
            </span>
          )}
          {onClear && (
            <span className="loc-display-clear" onClick={onClear}>
              关闭
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationDisplay
