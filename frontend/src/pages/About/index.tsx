import React, { useState } from 'react'
import {
  APP_NAME,
  APP_BRAND_MARK,
  APP_SLOGAN,
  APP_VERSION,
  APP_BUILD_DATE,
  CHANGELOG,
  LABEL_APP_VERSION,
  LABEL_UPDATE_DATE,
  LABEL_RUNTIME_ENV,
  LABEL_RUNTIME_WEB,
  SECTION_APP_INFO,
  SECTION_CHANGELOG,
  aboutReleasedLabel,
  aboutFooterCopyright,
} from '../../config/version'
import { Icon } from '../../components/ui/Icon'
import './index.scss'
import {
  buildTimelineItemClassName,
  buildTimelineChevronClassName,
  buildTimelineChangesClassName,
} from '../../utils/timeline'

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

  return (
    <div className="page-container about-page">
      <div className="about-layout">
        {/* 左列：Hero + 应用信息 */}
        <div className="about-layout-left">
          {/* Hero */}
          <div className="about-hero">
            <div className="about-logo">
              <span className="about-logo-text">{APP_BRAND_MARK}</span>
            </div>
            <h1 className="about-name">{APP_NAME}</h1>
            <p className="about-slogan">{APP_SLOGAN}</p>

            <div className="about-version-row">
              <span className="about-version-line" />
              <span className="about-version-tag">v{APP_VERSION}</span>
              <span className="about-version-line" />
            </div>
            <p className="about-date">{aboutReleasedLabel(APP_BUILD_DATE)}</p>
          </div>

          {/* 应用信息 */}
          <div className="about-card">
            <h2 className="about-card-title">
              <Icon name="info" size={16} />
              {SECTION_APP_INFO}
            </h2>

            <div className="about-info-list">
              <div className="about-info-row">
                <span className="about-info-label">{LABEL_APP_VERSION}</span>
                <span className="about-info-value mono">{APP_VERSION}</span>
              </div>
              <div className="about-info-row">
                <span className="about-info-label">{LABEL_UPDATE_DATE}</span>
                <span className="about-info-value">{APP_BUILD_DATE}</span>
              </div>
              <div className="about-info-row">
                <span className="about-info-label">{LABEL_RUNTIME_ENV}</span>
                <span className="about-info-value">{LABEL_RUNTIME_WEB}</span>
              </div>
            </div>
          </div>

          {/* 底部签名 */}
          <div className="about-footer">
            <p>{aboutFooterCopyright(2026)}</p>
          </div>
        </div>

        {/* 右列：更新日志（可滚动） */}
        <div className="about-layout-right">
          <div className="about-card about-card--changelog">
            <h2 className="about-card-title">
              <Icon name="budgets" size={16} />
              {SECTION_CHANGELOG}
            </h2>

            <div className="about-timeline">
              {CHANGELOG.map((entry, index) => {
                const isLatest = index === 0
                const isExpanded = expandedVersions.has(entry.version)

                return (
                  <div
                    key={entry.version}
                    className={buildTimelineItemClassName({ latest: isLatest })}
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
                          <Icon
                            name="chevron-down"
                            size={14}
                            className={buildTimelineChevronClassName({ expanded: isExpanded })}
                          />
                        </div>
                      </button>

                      <div className={buildTimelineChangesClassName({ expanded: isExpanded })}>
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
