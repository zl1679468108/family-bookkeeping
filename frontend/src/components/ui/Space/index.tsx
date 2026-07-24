import React from 'react'
import {
  buildSpaceClassName,
  resolveSpaceGap,
  type SpaceSize,
  type SpaceDirection,
} from '../../../utils/space'

interface SpaceProps {
  size?: SpaceSize
  direction?: SpaceDirection
  className?: string
  children: React.ReactNode
}

export const Space: React.FC<SpaceProps> = ({
  size = 'md',
  direction = 'horizontal',
  className = '',
  children,
}) => {
  return (
    <div
      className={buildSpaceClassName({ size, direction, className })}
      style={{ gap: resolveSpaceGap(size) }}
    >
      {React.Children.map(children, (child, index) => (
        child && <div key={index}>{child}</div>
      ))}
    </div>
  )
}

export default Space
