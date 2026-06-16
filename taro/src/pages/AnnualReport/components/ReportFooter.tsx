/**
 * ReportFooter — 年报页脚
 */
import { View, Text } from "@tarojs/components";
import "./ReportFooter.scss";

export default function ReportFooter() {
  return (
    <View className="report-footer">
      <View className="report-footer__divider" />
      <Text className="report-footer__app">家庭账本</Text>
      <Text className="report-footer__slogan">记录每一笔，掌控每一分</Text>
      <Text className="report-footer__year">—— 年度账单 ——</Text>
    </View>
  );
}
