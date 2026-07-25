/**
 * LocationField — 位置选择字段
 * 点击「选择地点」→ 弹出 LocationPicker 组件（基于高德坐标，与 PC 端一致）
 * 回显条件：只要有 name 或 latitude/longitude 任一存在就显示
 * 展示信息对齐 PC LocationDisplay：地址名 / 坐标 / 商户ID
 */
import { useState } from "react";
import { View, Text } from "@tarojs/components";
import LocationPicker from "../../LocationPicker";
import type { LocationResult as PickerResult } from "../../LocationPicker";
import "./index.scss";
import Icon, { ICON_COLOR } from "../../Icon";
import { FORM_LOCATION_SELECTED } from "../../../utils/formCopy";
import {
  ACTION_SELECT_LOCATION,
  ACTION_CLICK_TO_EDIT,
  ACTION_CLOSE,
} from "../../../utils/actionCopy";
import { hasLocationValue, formatCoords } from "../../../utils/locationHelpers";
import { FIELD_LOCATION, merchantIdDisplay } from "../../../utils/fieldCopy";

export interface LocationResult {
  name: string;
  latitude?: number;
  longitude?: number;
  poiId?: string | null;
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
        poiId: result.poiId ?? null,
      });
    }
    setVisible(false);
  };

  if (hasLocation && value) {
    const coords = formatCoords(value.latitude, value.longitude, 6);
    return (
      <>
        <View className="ft-loc-card">
          <Text className="ft-loc-card__name">
            {value.name || FORM_LOCATION_SELECTED}
          </Text>
          <View className="ft-loc-card__body">
            {coords ? <Text className="ft-loc-card__coords">{coords}</Text> : null}
            {value.poiId ? (
              <Text className="ft-loc-card__poi">
                {merchantIdDisplay(value.poiId)}
              </Text>
            ) : null}
          </View>
          <View className="ft-loc-card__footer">
            <Text
              className="ft-loc-card__edit"
              onClick={() => setVisible(true)}
            >
              {ACTION_CLICK_TO_EDIT}
            </Text>
            <Text
              className="ft-loc-card__close"
              onClick={() => onChange(null)}
            >
              {ACTION_CLOSE}
            </Text>
          </View>
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
                  poiId: value.poiId ?? null,
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
          <Icon
            name="chevron-right"
            size={28}
            color={ICON_COLOR.muted}
            className="ft-field-arrow"
          />
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
