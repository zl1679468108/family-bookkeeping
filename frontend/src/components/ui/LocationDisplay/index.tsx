import React from 'react'
import { hasLocationValue, formatCoords } from '../../../utils/locationHelpers'
import { ACTION_SELECT_LOCATION, ACTION_CLICK_TO_EDIT, ACTION_CLOSE } from '../../../utils/actionCopy'
import { merchantIdDisplay } from '../../../utils/fieldCopy'
import {
  buildLocationDisplayClassName,
  buildLocationDisplayBtnClassName,
} from '../../../utils/locationDisplay'

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
        <button className={buildLocationDisplayBtnClassName()} onClick={onClick}>
          {ACTION_SELECT_LOCATION}
        </button>
      )
    }
    return null
  }

  const coords = formatCoords(latitude, longitude, 6)

  return (
    <div className={buildLocationDisplayClassName()}>
      <div className="loc-display-name">{locationName}</div>
      <div className="loc-display-body">
        {coords && (
          <div className="loc-display-coords">
            {coords}
          </div>
        )}
        {poiId && (
          <div className="loc-display-poi">
            {merchantIdDisplay(poiId)}
          </div>
        )}
      </div>
      {(onClick || onClear) && (
        <div className="loc-display-footer">
          {onClick && (
            <span className="loc-display-edit" onClick={onClick}>
              {ACTION_CLICK_TO_EDIT}
            </span>
          )}
          {onClear && (
            <span className="loc-display-clear" onClick={onClear}>
              {ACTION_CLOSE}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationDisplay
