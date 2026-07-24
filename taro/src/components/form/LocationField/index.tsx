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

  const hasLocation =
    !!value &&
    (!!value.name || value.latitude !== undefined || value.longitude !== undefined);

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
    return (
      <>
        <View
          className="ft-section ft-loc"
          onClick={() => setVisible(true)}
        >
          <View className="ft-loc-info">
            <Text className="ft-loc-label">位置</Text>
            <View className="ft-loc-texts">
              <Text className="ft-loc-name">{value.name || "已选择位置"}</Text>
              {value.latitude !== undefined && value.longitude !== undefined && (
                <Text className="ft-loc-coords">
                  {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
          <Text
            className="ft-loc-clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            清除
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
          <Text className="ft-field-label">位置</Text>
        </View>
        <View className="ft-field-right">
          <Text className="ft-field-placeholder">选择地点</Text>
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