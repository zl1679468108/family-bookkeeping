/**
 * DropdownSelect — 自定义下拉选择（对齐 PC DropdownSelect）
 * 适配：PC 绝对定位浮层 + document.mousedown 关闭 → 底部 sheet + 蒙层点击关闭
 * 触发器是带 chevron 的卡片行，点击弹出底部选项 sheet（可搜索）。
 */
import { ReactNode, useMemo, useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useModalZIndex } from "../GlobalModal/useModalZIndex";
import { SearchInput } from "../Input";
import "./index.scss";
import { FORM_SELECT_PLACEHOLDER, FORM_DROPDOWN_NO_MATCH, FORM_DROPDOWN_UNLIMITED } from "../../../utils/formCopy";
import Icon, { ICON_COLOR } from "../../Icon";
import { ACTION_SEARCH } from "../../../utils/actionCopy"
import {
  filterOptionsByLabelKeyword,
  findOptionByKey,
  hasDropdownValue,
  buildUiDropdownClassName,
  buildUiDropdownTriggerClassName,
  buildUiDropdownOptionClassName,
} from "../../../utils/dropdownHelpers";
import { FIELD_REQUIRED_MARK } from "../../../utils/inputHelpers";

export interface DropdownOption {
  key: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

export interface DropdownSelectProps {
  options: DropdownOption[];
  value?: string | null;
  onChange?: (key: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  label?: ReactNode;
  required?: boolean;
  className?: string;
}

export function DropdownSelect({
  options, value, onChange, placeholder = FORM_SELECT_PLACEHOLDER,
  allowClear = false, showSearch = false, searchPlaceholder = ACTION_SEARCH,
  label, required = false, className = "",
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const z = useModalZIndex(open, "modal");

  const selected = findOptionByKey(options, value);

  const filtered = useMemo(
    () => filterOptionsByLabelKeyword(options, keyword),
    [options, keyword],
  );

  const handleSelect = (key: string) => {
    onChange?.(key);
    setOpen(false);
    setKeyword("");
  };

  return (
    <View className={buildUiDropdownClassName({ className })}>
      {label ? (
        <Text className="ui-dropdown__label">
          {required ? <Text className="ui-dropdown__required">{FIELD_REQUIRED_MARK.trim()}</Text> : null}
          {label}
        </Text>
      ) : null}
      <View
        className={buildUiDropdownTriggerClassName({ placeholder: !selected })}
        hoverClass="ui-dropdown__trigger--pressed"
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            {selected.icon ? <View className="ui-dropdown__trigger-icon">{selected.icon}</View> : null}
            <Text className="ui-dropdown__trigger-text">{selected.label}</Text>
          </>
        ) : (
          <Text className="ui-dropdown__trigger-text">{placeholder}</Text>
        )}
        <Icon name="chevron-down" size={28} color={ICON_COLOR.muted} className="ui-dropdown__chevron" />
      </View>

      {open ? (
        <View className="ui-dropdown__sheet-wrap" style={{ zIndex: z }} catchMove>
          <View className="ui-dropdown__mask" onClick={() => { setOpen(false); setKeyword(""); }} />
          <View className="ui-dropdown__sheet">
            <View className="ui-dropdown__sheet-header">
              <Text className="ui-dropdown__sheet-title">{placeholder}</Text>
              <View className="ui-dropdown__sheet-close" onClick={() => { setOpen(false); setKeyword(""); }}>
                <Icon name="close" size={32} color={ICON_COLOR.muted} className="ui-dropdown__close-icon" />
              </View>
            </View>
            {showSearch ? (
              <View className="ui-dropdown__search">
                <SearchInput value={keyword} onChange={setKeyword} placeholder={searchPlaceholder} />
              </View>
            ) : null}
            <ScrollView scrollY className="ui-dropdown__options">
              {allowClear ? (
                <View
                  className={buildUiDropdownOptionClassName({ active: !hasDropdownValue(value) })}
                  onClick={() => handleSelect("")}
                >
                  <Text className="ui-dropdown__option-label ui-dropdown__option-label--muted">{FORM_DROPDOWN_UNLIMITED}</Text>
                </View>
              ) : null}
              {filtered.length === 0 ? (
                <View className="ui-dropdown__empty"><Text>{FORM_DROPDOWN_NO_MATCH}</Text></View>
              ) : (
                filtered.map((opt) => (
                  <View
                    key={opt.key}
                    className={buildUiDropdownOptionClassName({ active: opt.key === value })}
                    onClick={() => handleSelect(opt.key)}
                  >
                    {opt.icon ? <View className="ui-dropdown__option-icon">{opt.icon}</View> : null}
                    <Text className="ui-dropdown__option-label">{opt.label}</Text>
                    {opt.key === value ? <Text className="ui-dropdown__check">✓</Text> : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default DropdownSelect;