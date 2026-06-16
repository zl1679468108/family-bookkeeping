/**
 * ReportCover — 年报封面
 */
import { View, Text } from "@tarojs/components";
import "./ReportCover.scss";

interface ReportCoverProps {
  year: number;
}

export default function ReportCover({ year }: ReportCoverProps) {

  return (
    <View className="report-cover">
      <View className="report-cover__bg">
        <View className="report-cover__sun" />
        <View className="report-cover__mountains">
          <View className="report-cover__mountain report-cover__mountain--1" />
          <View className="report-cover__mountain report-cover__mountain--2" />
          <View className="report-cover__mountain report-cover__mountain--3" />
        </View>
      </View>
      <View className="report-cover__content">
        <Text className="report-cover__year">{year}</Text>
        <Text className="report-cover__subtitle">年度账单</Text>
        <View className="report-cover__divider" />
        <Text className="report-cover__tagline">
          {year} · 你的每一笔，都算数
        </Text>
      </View>
      <View className="report-cover__footer">
        <Text className="report-cover__app">家庭账本</Text>
      </View>
    </View>
  );
}
