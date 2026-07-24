import React, { useState } from 'react'
import {
  APP_NAME,
  APP_SLOGAN,
  APP_VERSION,
  APP_BUILD_DATE,
  CHANGELOG,
} from '../../config/version'
import { Icon } from '../../components/ui/Icon'
import './index.scss'

const AboutPage: React.FC = () => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(CHANGELOG.length > 0 ? [CHANGELOG[0].version] : [])
  )

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev)
      if (next.has(version)) {
        next.delete(version)
      } else {
        next.add(version)
      }
      return next
    })
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${year} 年 ${parseInt(month)} 月 ${parseInt(day)} 日`
  }

  return (
    <div className="page-container about-page">
      <div className="about-layout">
        {/* 左列：Hero + 应用信息 */}
        <div className="about-layout-left">
          {/* Hero */}
          <div className="about-hero">
            <div className="about-logo">
              <span className="about-logo-text">静</span>
            </div>
            <h1 className="about-name">{APP_NAME}</h1>
            <p className="about-slogan">{APP_SLOGAN}</p>

            <div className="about-version-row">
              <span className="about-version-line" />
              <span className="about-version-tag">v{APP_VERSION}</span>
              <span className="about-version-line" />
            </div>
            <p className="about-date">{formatDate(APP_BUILD_DATE)} 发布</p>
          </div>

          {/* 应用信息 */}
          <div className="about-card">
            <h2 className="about-card-title">
              <Icon name="info" size={16} />
              应用信息
            </h2>

            <div className="about-info-list">
              <div className="about-info-row">
                <span className="about-info-label">应用版本</span>
                <span className="about-info-value mono">{APP_VERSION}</span>
              </div>
              <div className="about-info-row">
                <span className="about-info-label">更新日期</span>
                <span className="about-info-value">{APP_BUILD_DATE}</span>
              </div>
              <div className="about-info-row">
                <span className="about-info-label">运行环境</span>
                <span className="about-info-value">Web</span>
              </div>
            </div>
          </div>

          {/* 底部签名 */}
          <div className="about-footer">
            <p>© 2026 {APP_NAME} · {APP_SLOGAN}</p>
          </div>
        </div>

        {/* 右列：更新日志（可滚动） */}
        <div className="about-layout-right">
          <div className="about-card about-card--changelog">
            <h2 className="about-card-title">
              <Icon name="budgets" size={16} />
              更新日志
            </h2>

            <div className="about-timeline">
              {CHANGELOG.map((entry, index) => {
                const isLatest = index === 0
                const isExpanded = expandedVersions.has(entry.version)

                return (
                  <div
                    key={entry.version}
                    className={`timeline-item${isLatest ? ' timeline-item--latest' : ''}`}
                  >
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <button
                        className="timeline-header"
                        onClick={() => toggleVersion(entry.version)}
                      >
                        <div className="timeline-header-left">
                          <span className="timeline-version">v{entry.version}</span>
                          {entry.highlights && (
                            <span className="timeline-highlights">{entry.highlights}</span>
                          )}
                        </div>
                        <div className="timeline-header-right">
                          <span className="timeline-date">{entry.date}</span>
                          <svg
                            className={`timeline-chevron${isExpanded ? ' expanded' : ''}`}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </button>

                      <div className={`timeline-changes${isExpanded ? ' expanded' : ''}`}>
                        <ul className="timeline-list">
                          {entry.changes.map((change, i) => (
                            <li key={i} className="timeline-change">{change}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
