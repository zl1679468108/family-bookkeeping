/**
 * MonthPicker — 年月选择器，点击弹出 Picker 选择年月
 */
import { View, Text, Picker } from "@tarojs/components";
import Icon, { ICON_COLOR } from "../Icon";
import { formatYearMonthDisplay } from "../../utils/month";
import { cx } from "../../utils/cx";

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
  // 对齐 PC：支持选未来月份（默认允许到次年 12 月），便于提前规划预算
  const endYear = now.getFullYear() + 1;

  // Format for Picker (fields="month" expects "YYYY-MM")
  const pickerValue = `${year}-${String(month).padStart(2, "0")}`;
  const maxDate = `${endYear}-12`;

  const handlePickerChange = (e: { detail: { value: string } }) => {
    const [sy, sm] = e.detail.value.split("-");
    onChange(parseInt(sy, 10), parseInt(sm, 10));
  };


  return (
    <View className={cx("month-picker", className)}>
      <Picker
        mode="date"
        fields="month"
        value={pickerValue}
        start="2018-01"
        end={maxDate}
        onChange={handlePickerChange}
      >
          <View className="month-picker-inner">
            <Text className="month-picker-text">
              {formatYearMonthDisplay(year, month)}
            </Text>
            <Icon name="chevron-down" size={24} color={light ? ICON_COLOR.onPrimary : ICON_COLOR.muted} className={`month-picker-chevron ${light ? "light" : ""}`} />
          </View>
        </Picker>
    </View>
  );
}
