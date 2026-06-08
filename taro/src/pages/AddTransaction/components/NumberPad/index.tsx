/**
 * NumberPad v4 — 安静记账数字键盘
 * 设计稿对齐：扁平风格，绿色确认键，带安全区适配
 */
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

interface NumberPadProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

const keys: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

export default function NumberPad({
  onInput,
  onDelete,
  onConfirm,
  confirmDisabled = false,
}: NumberPadProps) {
  return (
    <View className="numpad">
      {keys.map((row, rowIdx) => (
        <View key={rowIdx} className="numpad-row">
          {row.map((key) => {
            const isBackspace = key === "⌫";
            return (
              <View
                key={`${rowIdx}-${key}`}
                className={`numpad-key ${isBackspace ? "numpad-key--back" : ""}`}
                onClick={() => {
                  Taro.vibrateShort({ type: "light" }).catch(() => {});
                  isBackspace ? onDelete() : onInput(key);
                }}
                hoverClass="numpad-key--hover"
              >
                <Text
                  className={`numpad-key-text ${isBackspace ? "numpad-key-text--back" : ""}`}
                >
                  {key}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
      {/* Done button row */}
      <View className="numpad-row">
        <View className="numpad-key numpad-key--empty" />
        <View
          className={`numpad-key numpad-key--done ${confirmDisabled ? "numpad-key--done-disabled" : ""}`}
          onClick={() => {
            if (!confirmDisabled) {
              Taro.vibrateShort({ type: "medium" }).catch(() => {});
              onConfirm();
            }
          }}
          hoverClass={confirmDisabled ? "" : "numpad-key--hover"}
        >
          <Text className="numpad-done-text">完成</Text>
        </View>
      </View>
    </View>
  );
}
