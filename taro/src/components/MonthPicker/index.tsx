/**
 * MonthPicker — 年月选择器，点击弹出 Picker 选择年月
 */
import { View, Text, Picker } from "@tarojs/components";

export interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  light?: boolean;
}

export default function MonthPicker({
  year,
  month,
  onChange,
  light = false,
}: MonthPickerProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Format for Picker (fields="month" expects "YYYY-MM")
  const pickerValue = `${year}-${String(month).padStart(2, "0")}`;
  const maxDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const handlePickerChange = (e: { detail: { value: string } }) => {
    const [sy, sm] = e.detail.value.split("-");
    onChange(parseInt(sy, 10), parseInt(sm, 10));
  };

  const textColor = light ? "rgba(255,255,255,0.9)" : "var(--color-text)";
  const arrowColor = light ? "rgba(255,255,255,0.5)" : "var(--color-text-hint)";

  return (
    <View
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Picker
        mode="date"
        fields="month"
        value={pickerValue}
        start="2020-01"
        end={maxDate}
        onChange={handlePickerChange}
      >
        <View
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8rpx",
            padding: "12rpx 28rpx",
          }}
        >
          <Text
            style={{ fontSize: "30rpx", fontWeight: 600, color: textColor }}
          >
            {year}年{month}月
          </Text>
          <Text
            style={{ fontSize: "22rpx", color: arrowColor, marginTop: "2rpx" }}
          >
            ▼
          </Text>
        </View>
      </Picker>
    </View>
  );
}
