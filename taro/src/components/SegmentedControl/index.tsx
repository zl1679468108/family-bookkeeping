import { View, Text } from "@tarojs/components";
import "./index.scss";

interface SegmentedControlProps {
  options: string[];
  value: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <View className="segmented-control">
      {options.map((opt, i) => (
        <Text
          key={i}
          className={`segmented-item ${i === value ? "segmented-item-active" : ""}`}
          onClick={() => onChange(i)}
        >
          {opt}
        </Text>
      ))}
    </View>
  );
}
