/**
 * About — 关于静记
 * 展示版本号、更新日志、应用信息
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import PageContainer from "../../components/PageContainer";
import Icon from "../../components/Icon";
import {
  APP_NAME,
  APP_SLOGAN,
  APP_VERSION,
  APP_BUILD_DATE,
  CHANGELOG,
} from "../../config/version";
import "./index.scss";

export default function About() {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(CHANGELOG.length > 0 ? [CHANGELOG[0].version] : [])
  );

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${year} 年 ${parseInt(month)} 月 ${parseInt(day)} 日`;
  };

  return (
    <PageContainer contentClassName="about-content">
      {/* Hero 区域 */}
      <View className="about-hero">
        <View className="about-logo">
          <Text className="about-logo-text">静</Text>
        </View>
        <Text className="about-name">{APP_NAME}</Text>
        <Text className="about-slogan">{APP_SLOGAN}</Text>

        {/* 版本标签 */}
        <View className="about-version-row">
          <View className="about-version-line" />
          <Text className="about-version-tag">v{APP_VERSION}</Text>
          <View className="about-version-line" />
        </View>
        <Text className="about-date">{formatDate(APP_BUILD_DATE)} 发布</Text>
      </View>

      {/* 更新日志 */}
      <View className="about-card">
        <View className="about-card-title">
          <Icon name="clock" size={40} />
          <Text>更新日志</Text>
        </View>

        <View className="about-timeline">
          {CHANGELOG.map((entry, index) => {
            const isLatest = index === 0;
            const isExpanded = expandedVersions.has(entry.version);

            return (
              <View
                key={entry.version}
                className={`timeline-item${isLatest ? " timeline-item--latest" : ""}`}
              >
                <View className="timeline-dot" />
                <View className="timeline-body">
                  <View
                    className="timeline-header"
                    onClick={() => toggleVersion(entry.version)}
                  >
                    <View className="timeline-header-left">
                      <Text className="timeline-version">v{entry.version}</Text>
                      {entry.highlights && (
                        <Text className="timeline-highlights">{entry.highlights}</Text>
                      )}
                    </View>
                    <View className="timeline-header-right">
                      <Text className="timeline-date">{entry.date}</Text>
                      <Text className={`timeline-chevron${isExpanded ? " expanded" : ""}`}>
                        ›
                      </Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View className="timeline-changes">
                      {entry.changes.map((change, i) => (
                        <View key={i} className="timeline-change">
                          <Text className="timeline-change-dot">·</Text>
                          <Text className="timeline-change-text">{change}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 应用信息 */}
      <View className="about-card">
        <View className="about-card-title">
          <Icon name="info" size={40} />
          <Text>应用信息</Text>
        </View>

        <View className="about-info-list">
          <View className="about-info-row">
            <Text className="about-info-label">应用版本</Text>
            <Text className="about-info-value">{APP_VERSION}</Text>
          </View>
          <View className="about-info-row">
            <Text className="about-info-label">更新日期</Text>
            <Text className="about-info-value">{APP_BUILD_DATE}</Text>
          </View>
          <View className="about-info-row">
            <Text className="about-info-label">运行环境</Text>
            <Text className="about-info-value">小程序</Text>
          </View>
        </View>
      </View>

      {/* 底部签名 */}
      <View className="about-footer">
        <Text className="about-footer-text">© 2026 {APP_NAME} · {APP_SLOGAN}</Text>
      </View>
    </PageContainer>
  );
}
