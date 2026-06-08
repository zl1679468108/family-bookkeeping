/**
 * PullRefresh — 记账主题下拉加载动画
 * 金币弹跳 + 记账中提示文字
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";

interface PullRefreshProps {
  loading?: boolean;
  text?: string;
}

export default function PullRefresh({
  loading = true,
  text = "记账中…",
}: PullRefreshProps) {
  if (!loading) return null;

  return (
    <View className="pull-refresh">
      <View className="pull-refresh-inner">
        <View className="pull-coin" />
        <View className="pull-coin pull-coin--delay" />
        <View className="pull-coin pull-coin--delay2" />
      </View>
      <Text className="pull-refresh-text">{text}</Text>
    </View>
  );
}
