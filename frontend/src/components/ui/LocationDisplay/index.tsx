import React from 'react'
import { hasLocationValue, formatCoords } from '../../../utils/locationHelpers'
import { cx } from '../../../utils/cx'

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
  const hasLocation = hasLocationValue({ locationName, latitude, longitude })

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

  const coords = formatCoords(latitude, longitude, 6)

  return (
    <div className={cx('loc-display')}>
      <div className="loc-display-name">{locationName}</div>
      <div className="loc-display-body">
        {coords && (
          <div className="loc-display-coords">
            {coords}
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
