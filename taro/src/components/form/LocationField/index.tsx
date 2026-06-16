/**
 * LocationField — 位置选择字段
 * 未选择时：显示 "选择地点"
 * 已选择时：显示地点名称 + 坐标 + 清除按钮
 */
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

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
  const handlePick = () => {
    try {
      Taro.chooseLocation({
        latitude: value?.latitude || 39.9042,
        longitude: value?.longitude || 116.4074,
      })
        .then((res: any) => {
          onChange({
            name: res.name || res.address || "",
            latitude: res.latitude,
            longitude: res.longitude,
          });
        })
        .catch(() => {});
    } catch {
      Taro.showToast({ title: "未开启位置权限或不支持", icon: "none" });
    }
  };

  if (value?.name) {
    return (
      <View className="ft-section ft-loc">
        <View className="ft-loc-info">
          <Text className="ft-loc-label">位置</Text>
          <View className="ft-loc-texts">
            <Text className="ft-loc-name">{value.name}</Text>
            {value.latitude !== undefined && value.longitude !== undefined && (
              <Text className="ft-loc-coords">
                {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </View>
        <Text
          className="ft-loc-clear"
          onClick={() => onChange(null)}
        >
          清除
        </Text>
      </View>
    );
  }

  return (
    <View className="ft-section">
      <View className="ft-field" onClick={handlePick}>
        <View className="ft-field-left">
          <Text className="ft-field-label">位置</Text>
        </View>
        <View className="ft-field-right">
          <Text className="ft-field-placeholder">选择地点</Text>
          <Text className="ft-field-arrow">›</Text>
        </View>
      </View>
    </View>
  );
}
