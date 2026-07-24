import React from 'react'
import {
  buildFooterActionsClassName,
  type FooterActionsAlign,
} from '../../../utils/footerActions'
import './index.scss'

/**
 * FooterActions — 弹窗/表单底部按钮组
 * 统一双按钮（取消+确认）与多操作排列
 */
export interface FooterActionsProps {
  children: React.ReactNode
  /** end: 右对齐（弹窗）；stretch: 均分拉满；start: 左对齐 */
  align?: FooterActionsAlign
  className?: string
}

export const FooterActions: React.FC<FooterActionsProps> = ({
  children,
  align = 'end',
  className = '',
}) => {
  const cls = buildFooterActionsClassName({ align, className })
  return <div className={cls}>{children}</div>
}

export default FooterActions
