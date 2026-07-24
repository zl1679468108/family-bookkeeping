/**
 * LoadingOverlay — 列表加载遮罩（半透明覆盖层 + 旋转 spinner + 文案）
 *
 * 设计：绝对定位覆盖父容器（inset:0），父容器需 position: relative。
 * PageLayout 的 loading 分支已为内容区设置该定位，直接传入 loading 即可。
 * 颜色全部走 CSS 变量，自动适配暗色模式。
 */
import { View, Text } from "@tarojs/components";
import "./index.scss";
import { ACTION_LOADING } from "../../../utils/actionCopy";

export interface LoadingOverlayProps {
  /** 提示文字，传空字符串可只显示 spinner */
  tip?: string;
  /** 附加 className */
  className?: string;
}

export function LoadingOverlay({ tip = ACTION_LOADING, className = "" }: LoadingOverlayProps) {
  return (
    <View className={`ui-loading-overlay ${className}`}>
      <View className="ui-loading-overlay__spinner" />
      {tip ? <Text className="ui-loading-overlay__tip">{tip}</Text> : null}
    </View>
  );
}

export default LoadingOverlay;
