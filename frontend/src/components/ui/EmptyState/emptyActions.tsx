import React from 'react'
import { Button } from '../Button'

type BtnSize = 'sm' | 'md' | 'lg'

/**
 * 空状态主操作按钮（统一 variant/size，避免各页手写 Button）
 */
export function EmptyActionButton({
  children,
  onClick,
  size = 'md',
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick: () => void
  size?: BtnSize
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}) {
  return (
    <Button variant={variant} size={size} onClick={onClick}>
      {children}
    </Button>
  )
}

/** 常见空态：去记一笔 / 添加第一笔交易 */
export function EmptyAddTransactionAction({
  onClick,
  label = '添加第一笔交易',
  size = 'md',
}: {
  onClick: () => void
  label?: string
  size?: BtnSize
}) {
  return (
    <EmptyActionButton onClick={onClick} size={size}>
      {label}
    </EmptyActionButton>
  )
}
