import React from 'react'
import './index.scss'

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({ title, children }) => {
  return (
    <div className="header">
      <h1>{title}</h1>
      {children && <div className="header-actions">{children}</div>}
    </div>
  )
}