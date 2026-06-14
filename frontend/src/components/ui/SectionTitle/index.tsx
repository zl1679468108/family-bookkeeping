import React from 'react'
import './index.scss'

/**
 * 通用区块标题组件 —— 取代各页面手写的 <h2> + <div> 标题结构
 *
 * 用法：
 *  <SectionTitle title="交易记录" sub="本月共 120 笔" action={<Button>新增</Button>} />
 *  <SectionTitle title="分类管理" divider={false} />
 */
interface SectionTitleProps {
  title: React.ReactNode
  sub?: React.ReactNode
  action?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  divider?: boolean
  icon?: React.ReactNode
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  sub,
  action,
  className = '',
  style,
  divider = true,
  icon,
}) => {
  return (
    <div
      className={`section-title ${divider ? 'with-divider' : ''} ${className}`.trim()}
      style={style}
    >
      <div className="section-title__left">
        {icon && <span className="section-title__icon">{icon}</span>}
        <div className="section-title__text">
          <h2 className="section-title__main">{title}</h2>
          {sub && <span className="section-title__sub">{sub}</span>}
        </div>
      </div>
      {action && <div className="section-title__action">{action}</div>}
    </div>
  )
}

export default SectionTitle
