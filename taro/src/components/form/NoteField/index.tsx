/**
 * NoteField — 备注多行输入 + 字数统计
 */
import { View, Text, Textarea } from "@tarojs/components";
import "./index.scss";
import { FORM_DESC_EXAMPLE } from "../../../utils/formCopy";
import { FIELD_NOTE } from "../../../utils/fieldCopy";
import { MAX_NOTE_LENGTH } from "../../../utils/formCopy";
import { formatCharCount } from "../../../utils/inputHelpers";
import { buildNoteSectionClassName } from "../../../utils/formSection";

export interface NoteFieldProps {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}

export default function NoteField({
  value,
  onChange,
  maxLength = MAX_NOTE_LENGTH,
}: NoteFieldProps) {
  return (
    <View className={buildNoteSectionClassName()}>
      <View className="ft-note-head">
        <Text className="ft-note-label">{FIELD_NOTE}</Text>
        <Text className="ft-note-counter">
          {formatCharCount(value.length, maxLength)}
        </Text>
      </View>
      <Textarea
        className="ft-note-area"
        placeholder={FORM_DESC_EXAMPLE}
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
