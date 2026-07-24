import { View, Text } from "@tarojs/components";
import "./index.scss";
import { buildSegmentedItemClassName } from "../../utils/segmented";

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
          className={buildSegmentedItemClassName({ active: i === value })}
          onClick={() => onChange(i)}
        >
          {opt}
        </Text>
      ))}
    </View>
  );
}
