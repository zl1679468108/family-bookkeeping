/**
 * NoteField — 备注多行输入 + 字数统计
 */
import { View, Text, Textarea } from "@tarojs/components";
import "./index.scss";

export interface NoteFieldProps {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}

export default function NoteField({
  value,
  onChange,
  maxLength = 500,
}: NoteFieldProps) {
  return (
    <View className="ft-section ft-note">
      <View className="ft-note-head">
        <Text className="ft-note-label">备注</Text>
        <Text className="ft-note-counter">
          {value.length} / {maxLength}
        </Text>
      </View>
      <Textarea
        className="ft-note-area"
        placeholder="例如：小棕瓶 50ml，给妈妈买的礼物"
        value={value}
        onInput={(e: any) => {
          const v = (e.detail.value as string).slice(0, maxLength);
          onChange(v);
        }}
        maxlength={maxLength}
        autoHeight
      />
    </View>
  );
}
