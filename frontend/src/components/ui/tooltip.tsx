import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [visible, setVisible] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <span
      ref={triggerRef}
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'inline-flex', position: 'relative' }}
    >
      {children}
      {visible && (
        <span
          className={`tooltip-bubble tooltip-${position}`}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 1000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            ...getTooltipPosition(position),
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}

function getTooltipPosition(pos: TooltipProps['position']): React.CSSProperties {
  switch (pos) {
    case 'bottom':
      return {
        top: 'calc(100% + 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    case 'left':
      return {
        top: '50%',
        right: 'calc(100% + 6px)',
        transform: 'translateY(-50%)',
      }
    case 'right':
      return {
        top: '50%',
        left: 'calc(100% + 6px)',
        transform: 'translateY(-50%)',
      }
    case 'top':
    default:
      return {
        bottom: 'calc(100% + 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }
  }
}
