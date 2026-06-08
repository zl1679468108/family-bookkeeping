/**
 * MonthPicker — 年月选择器，点击弹出 Picker 选择年月
 */
import { View, Text, Picker } from "@tarojs/components";

export interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  light?: boolean;
  className?: string;
}

export default function MonthPicker({
  year,
  month,
  onChange,
  light = false,
  className = "",
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


  return (
    <View className={`month-picker ${className}`.trim()}>
      <Picker
        mode="date"
        fields="month"
        value={pickerValue}
        start="2020-01"
        end={maxDate}
        onChange={handlePickerChange}
      >
          <View className="month-picker-inner">
            <Text className="month-picker-text">
              {year}年{month}月
            </Text>
            <Text className={`month-picker-chevron ${light ? "light" : ""}`}>
              ▼
            </Text>
          </View>
        </Picker>
    </View>
  );
}
