/**
 * NumberPad — 温暖轻奢数字键盘
 * 圆角大按键，米白底色，珊瑚橙确认键
 */
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";

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
    <View style={{ display: "flex", gap: "12rpx", padding: "16rpx" }}>
      {/* Number grid */}
      <View
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "10rpx",
        }}
      >
        {keys.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10rpx",
            }}
          >
            {row.map((key) => {
              const isBackspace = key === "⌫";
              return (
                <View
                  key={`${rowIdx}-${key}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "108rpx",
                    borderRadius: "22rpx",
                    backgroundColor: isBackspace
                      ? "var(--color-divider)"
                      : "#FFFFFF",
                    boxShadow: isBackspace
                      ? "0 1rpx 3rpx rgba(44,36,22,0.02)"
                      : "0 2rpx 8rpx rgba(44,36,22,0.04), 0 1rpx 2rpx rgba(44,36,22,0.03)",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                  onClick={() => {
                    Taro.vibrateShort({ type: "light" }).catch(() => {});
                    isBackspace ? onDelete() : onInput(key);
                  }}
                  hoverClass="tappable"
                >
                  <Text
                    style={{
                      fontSize: isBackspace ? "36rpx" : "40rpx",
                      fontWeight: 500,
                      color: isBackspace ? "var(--color-text-hint)" : "#3E3C39",
                    }}
                  >
                    {key}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Confirm button */}
      <View
        style={{
          width: "128rpx",
          borderRadius: "22rpx",
          background: confirmDisabled
            ? "var(--color-divider)"
            : "linear-gradient(160deg, #E07B4C, #D6875E)",
          boxShadow: confirmDisabled
            ? "none"
            : "0 8rpx 32rpx rgba(224,123,76,0.35), 0 0 60rpx rgba(224,123,76,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "462rpx",
          transition: "transform 0.1s",
        }}
        onClick={() => {
          if (!confirmDisabled) {
            Taro.vibrateShort({ type: "medium" }).catch(() => {});
            onConfirm();
          }
        }}
        hoverClass={confirmDisabled ? "" : "tappable"}
      >
        <Text
          style={{
            color: confirmDisabled ? "var(--color-text-hint)" : "#FFFFFF",
            fontSize: "28rpx",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          确认
        </Text>
      </View>
    </View>
  );
}
