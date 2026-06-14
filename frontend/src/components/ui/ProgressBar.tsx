import React, { useEffect, useState } from 'react'
import { subscribeProgress, ProgressState } from '../../utils/progress'
import './ProgressBar.scss'

export const ProgressBar: React.FC = () => {
  const [state, setState] = useState<ProgressState>({ progress: 0, isVisible: false })

  useEffect(() => {
    const unsubscribe = subscribeProgress((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  return (
    <div
      className={`progress-bar ${state.isVisible ? 'progress-bar--visible' : ''}`}
      aria-hidden={!state.isVisible}
    >
      <div
        className="progress-bar__inner"
        style={{ width: `${state.progress}%` }}
      />
    </div>
  )
}
