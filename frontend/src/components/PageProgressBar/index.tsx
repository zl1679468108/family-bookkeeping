import React, { useEffect, useState } from 'react'
import { subscribeProgress, ProgressState } from '../../utils/progress'
import { buildPageProgressBarClassName } from '../../utils/pageProgressBar'
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
      className={buildPageProgressBarClassName({ visible: state.isVisible })}
      aria-hidden={!state.isVisible}
    >
      <div
        className="page-progress-bar__inner"
        style={{ width: `${state.progress}%` }}
      />
    </div>
  )
}
