/**
 * Spinner — 加载转圈（对齐 PC Spinner）
 * 尺寸：sm / md；颜色随主题
 * 用法：<Spinner /> 或配合 .ui-spin-row 让 spinner + 文字横向居中
 */
import { View } from "@tarojs/components";
import "./index.scss";
import { buildSpinClassName, type SpinnerSize } from "../../../utils/spinner";

export type { SpinnerSize };

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export default function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  return <View className={buildSpinClassName({ size, className })} />;
}
