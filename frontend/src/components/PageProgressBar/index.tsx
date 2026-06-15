import React, { useEffect, useState } from 'react'
import { subscribeProgress, ProgressState } from '../../utils/progress'
import './index.scss'

export const PageProgressBar: React.FC = () => {
  const [state, setState] = useState<ProgressState>({ progress: 0, isVisible: false })

  useEffect(() => {
    const unsubscribe = subscribeProgress((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  return (
    <div
      className={`page-progress-bar ${state.isVisible ? 'page-progress-bar--visible' : ''}`}
      aria-hidden={!state.isVisible}
    >
      <div
        className="page-progress-bar__inner"
        style={{ width: `${state.progress}%` }}
      />
    </div>
  )
}
