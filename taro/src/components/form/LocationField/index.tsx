/**
 * LocationField — 位置选择字段
 * 点击「选择地点」→ 弹出 LocationPicker 组件（基于高德坐标，与 PC 端一致）
 * 回显条件：只要有 name 或 latitude/longitude 任一存在就显示
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import LocationPicker from "../../LocationPicker";
import type { LocationResult as PickerResult } from "../../LocationPicker";
import "./index.scss";
import Icon, { ICON_COLOR } from "../../Icon";
import { FORM_LOCATION_SELECTED } from "../../../utils/formCopy";
import { ACTION_CLEAR_SELECTION, ACTION_SELECT_LOCATION } from "../../../utils/actionCopy";
import { hasLocationValue, formatCoords } from "../../../utils/locationHelpers";
import { FIELD_LOCATION } from "../../../utils/fieldCopy";

export interface LocationResult {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationFieldProps {
  value?: LocationResult | null;
  onChange: (v: LocationResult | null) => void;
}

export default function LocationField({ value, onChange }: LocationFieldProps) {
  const [visible, setVisible] = useState(false);

  const hasLocation = hasLocationValue(value);

  const handleConfirm = (result: PickerResult) => {
    // LocationPicker 的「清除」会返回 latitude=0, locationName="" 的特殊信号
    if (!result.locationName && (!result.latitude || !result.longitude)) {
      onChange(null);
    } else {
      onChange({
        name: result.locationName || "",
        latitude: result.latitude,
        longitude: result.longitude,
      });
    }
    setVisible(false);
  };

  if (hasLocation && value) {
    const coords = formatCoords(value.latitude, value.longitude, 4);
    return (
      <>
        <View
          className="ft-section ft-loc"
          onClick={() => setVisible(true)}
        >
          <View className="ft-loc-info">
            <Text className="ft-loc-label">{FIELD_LOCATION}</Text>
            <View className="ft-loc-texts">
              <Text className="ft-loc-name">{value.name || FORM_LOCATION_SELECTED}</Text>
              {coords ? (
                <Text className="ft-loc-coords">{coords}</Text>
              ) : null}
            </View>
          </View>
          <Text
            className="ft-loc-clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            {ACTION_CLEAR_SELECTION}
          </Text>
        </View>
        <LocationPicker
          visible={visible}
          onClose={() => setVisible(false)}
          onConfirm={handleConfirm}
          initialLocation={
            value?.latitude && value?.longitude
              ? {
                  latitude: value.latitude,
                  longitude: value.longitude,
                  locationName: value.name || "",
                  poiId: null,
                }
              : null
          }
        />
      </>
    );
  }

  return (
    <View className="ft-section">
      <View className="ft-field" onClick={() => setVisible(true)}>
        <View className="ft-field-left">
          <Text className="ft-field-label">{FIELD_LOCATION}</Text>
        </View>
        <View className="ft-field-right">
          <Text className="ft-field-placeholder">{ACTION_SELECT_LOCATION}</Text>
          <Icon name="chevron-right" size={28} color={ICON_COLOR.muted} className="ft-field-arrow" />
        </View>
      </View>
      <LocationPicker
        visible={visible}
        onClose={() => setVisible(false)}
        onConfirm={handleConfirm}
        initialLocation={null}
      />
    </View>
  );
}