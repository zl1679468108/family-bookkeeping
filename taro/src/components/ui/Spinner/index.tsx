/**
 * Spinner — 通用加载指示器（轻量、无依赖）
 * size: sm(28rpx) / md(40rpx)
 * 颜色继承 currentColor，自动适配按钮/文字颜色与暗色模式
 * 用法：<Spinner /> 或配合 .ui-spin-row 让 spinner + 文字横向居中
 */
import { View } from "@tarojs/components";
import "./index.scss";

export interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

export default function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  return <View className={`ui-spin ui-spin--${size} ${className}`.trim()} />;
}
