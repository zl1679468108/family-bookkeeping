/**
 * About — 关于静记
 * 展示版本号、更新日志、应用信息
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageContainer from "../../components/PageContainer";
import Icon, { ICON_COLOR } from "../../components/Icon";
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
  LABEL_RUNTIME_MINIPROGRAM,
  SECTION_APP_INFO,
  SECTION_CHANGELOG,
  SECTION_LEGAL,
  aboutReleasedLabel,
  aboutFooterCopyright,
} from "../../config/version";
import { TITLE_USER_AGREEMENT, TITLE_PRIVACY_POLICY } from "../../utils/sectionCopy";
import "./index.scss";
import {
  buildTimelineItemClassName,
  buildTimelineChevronClassName,
} from "../../utils/timeline";

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

  return (
    <PageContainer contentClassName="about-content">
      {/* Hero 区域 */}
      <View className="about-hero">
        <View className="about-logo">
          <Text className="about-logo-text">{APP_BRAND_MARK}</Text>
        </View>
        <Text className="about-name">{APP_NAME}</Text>
        <Text className="about-slogan">{APP_SLOGAN}</Text>

        {/* 版本标签 */}
        <View className="about-version-row">
          <View className="about-version-line" />
          <Text className="about-version-tag">v{APP_VERSION}</Text>
          <View className="about-version-line" />
        </View>
        <Text className="about-date">{aboutReleasedLabel(APP_BUILD_DATE)}</Text>
      </View>

      {/* 更新日志 */}
      <View className="about-card">
        <View className="about-card-title">
          <Icon name="clock" size={40} />
          <Text>{SECTION_CHANGELOG}</Text>
        </View>

        <View className="about-timeline">
          {CHANGELOG.map((entry, index) => {
            const isLatest = index === 0;
            const isExpanded = expandedVersions.has(entry.version);

            return (
              <View
                key={entry.version}
                className={buildTimelineItemClassName({ latest: isLatest })}
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
                      <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className={buildTimelineChevronClassName({ expanded: isExpanded })} />
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
          <Text>{SECTION_APP_INFO}</Text>
        </View>

        <View className="about-info-list">
          <View className="about-info-row">
            <Text className="about-info-label">{LABEL_APP_VERSION}</Text>
            <Text className="about-info-value">{APP_VERSION}</Text>
          </View>
          <View className="about-info-row">
            <Text className="about-info-label">{LABEL_UPDATE_DATE}</Text>
            <Text className="about-info-value">{APP_BUILD_DATE}</Text>
          </View>
          <View className="about-info-row">
            <Text className="about-info-label">{LABEL_RUNTIME_ENV}</Text>
            <Text className="about-info-value">{LABEL_RUNTIME_MINIPROGRAM}</Text>
          </View>
        </View>
      </View>

      {/* 法律文档 */}
      <View className="about-card">
        <View className="about-card-title">
          <Icon name="lock" size={40} />
          <Text>{SECTION_LEGAL}</Text>
        </View>

        <View className="about-info-list">
          <View
            className="about-info-row about-info-row--link"
            onClick={() => Taro.navigateTo({ url: "/pages/Terms/index" })}
          >
            <Text className="about-info-label">{TITLE_USER_AGREEMENT}</Text>
            <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="about-info-arrow" />
          </View>
          <View
            className="about-info-row about-info-row--link"
            onClick={() => Taro.navigateTo({ url: "/pages/Privacy/index" })}
          >
            <Text className="about-info-label">{TITLE_PRIVACY_POLICY}</Text>
            <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="about-info-arrow" />
          </View>
        </View>
      </View>

      {/* 底部签名 */}
      <View className="about-footer">
        <Text className="about-footer-text">{aboutFooterCopyright(2026)}</Text>
      </View>
    </PageContainer>
  );
}
