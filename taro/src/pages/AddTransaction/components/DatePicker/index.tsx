/**
 * DatePicker — native date picker wrapper.
 * Uses Taro <Picker mode="date">, no custom calendar, no arrows.
 */
import { PropsWithChildren, useMemo } from "react";
import { Picker } from "@tarojs/components";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePicker({
  value,
  onChange,
  children,
}: PropsWithChildren<DatePickerProps>) {
  const dateStr = useMemo(() => formatDateStr(value), [value]);
  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  const handleChange = (e: any) => {
    onChange(new Date(e.detail.value));
  };

  return (
    <Picker mode="date" value={dateStr} end={todayStr} onChange={handleChange}>
      {children}
    </Picker>
  );
}
