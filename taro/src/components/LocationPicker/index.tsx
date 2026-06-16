/**
 * LocationPicker — 地图位置选择组件
 * 基于高德坐标（与后端、PC端一致）
 * 使用微信小程序原生 Map 组件 + 后端逆地理编码 / POI搜索 API
 * z-index: 2000，确保高于其他 sheet/modal
 */
import { useState, useCallback, useEffect } from "react";
import { View, Text, Map, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { apiGet } from "../../services/api";
import { useManualQuery } from "../../hooks/useManualQuery";
import "./index.scss";

export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
  address?: string;
  poiId: string | null;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
  initialLocation?: LocationResult | null;
}

export default function LocationPicker({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: LocationPickerProps) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [poiId, setPoiId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [locating, setLocating] = useState(false);

  // 打开时：如果有 initialLocation 则显示该位置，否则自动定位
  useEffect(() => {
    if (!visible) return;
    if (initialLocation && initialLocation.latitude) {
      setPos({
        lat: Number(initialLocation.latitude),
        lng: Number(initialLocation.longitude),
      });
      setAddress(initialLocation.locationName || "");
      setPoiId(initialLocation.poiId || null);
    } else {
      handleLocate();
    }
  }, [visible, initialLocation]);

  // GPS 定位
  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const res = await Taro.getLocation({ type: "gcj02" });
      const newPos = { lat: res.latitude, lng: res.longitude };
      setPos(newPos);
      await reverseGeocode(newPos.lat, newPos.lng);
    } catch (e: any) {
      Taro.showToast({
        title: e?.errMsg || "定位失败，请授权位置权限",
        icon: "none",
      });
    } finally {
      setLocating(false);
    }
  }, []);

  // 使用微信原生选择位置API（地址转坐标）
  const handleChooseLocation = useCallback(async () => {
    try {
      const res = await Taro.chooseLocation({});
      const newPos = { lat: res.latitude, lng: res.longitude };
      setPos(newPos);
      setAddress(res.name ? `${res.name} · ${res.address}` : res.address);
      setPoiId(null);
    } catch (e: any) {
      // 用户取消选择时也会触发错误，这里忽略
      if (e?.errMsg !== 'chooseLocation:fail cancel') {
        Taro.showToast({
          title: e?.errMsg || '选择位置失败',
          icon: 'none',
        });
      }
    }
  }, []);

  // 地图点击选点
  const handleMapTap = useCallback((e: any) => {
    const { latitude, longitude } = e.detail;
    const newPos = { lat: latitude, lng: longitude };
    setPos(newPos);
    reverseGeocode(latitude, longitude);
  }, []);

  // 逆地理编码：通过后端接口（高德）
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await apiGet<{
        address: string;
        poiName?: string;
        poiId?: string;
      }>(`/map/reverse-geocode?latitude=${lat}&longitude=${lng}`);
      setAddress(
        res.poiName ? `${res.poiName} · ${res.address}` : res.address,
      );
      setPoiId(res.poiId || null);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  // POI 搜索
  const { data: searchResults } = useManualQuery<
    Array<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      poiId: string;
    }>
  >({
    key: `map-search-${searchText}-${pos?.lat}-${pos?.lng}`,
    queryFn: () =>
      apiGet<
        Array<{
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          poiId: string;
        }>
      >(
        `/map/merchants?keyword=${encodeURIComponent(
          searchText,
        )}${pos ? `&latitude=${pos.lat}&longitude=${pos.lng}` : ""}`,
      ),
    enabled: searchText.length >= 2,
  });

  const handleSearchSelect = (item: any) => {
    setPos({ lat: Number(item.latitude), lng: Number(item.longitude) });
    setAddress(item.name);
    setPoiId(item.poiId);
    setSearchText("");
  };

  // 确认
  const handleConfirm = () => {
    if (!pos) {
      Taro.showToast({ title: "请先选择位置", icon: "none" });
      return;
    }
    onConfirm({
      latitude: pos.lat,
      longitude: pos.lng,
      locationName: address,
      address: address,
      poiId,
    });
  };

  // 清除（不回传任何东西，只关弹窗）
  const handleClear = () => {
    onConfirm({
      latitude: 0,
      longitude: 0,
      locationName: "",
      address: "",
      poiId: null,
    });
  };

  if (!visible) return null;

  const centerLat = pos?.lat || 39.9042;
  const centerLng = pos?.lng || 116.4074;

  return (
    <View className="lp-overlay">
      <View className="lp-panel">
        {/* Header */}
        <View className="lp-header">
          <Text className="lp-close" onClick={onClose}>
            ×
          </Text>
          <Text className="lp-title">选择位置</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Search */}
        <View className="lp-search">
          <Input
            className="lp-search-input"
            placeholder="搜索地址或商户…"
            value={searchText}
            onInput={(e: any) => setSearchText(e.detail.value)}
          />
          <Text className="lp-locate" onClick={handleLocate}>
            {locating ? "···" : "📍"}
          </Text>
          <Text className="lp-choose" onClick={handleChooseLocation}>
            📌
          </Text>
        </View>

        {/* Search Results */}
        {searchResults &&
          searchResults.length > 0 &&
          searchText.length >= 2 && (
            <View className="lp-results">
              {searchResults.slice(0, 8).map((item: any, i: number) => (
                <View
                  key={i}
                  className="lp-result-item"
                  onClick={() => handleSearchSelect(item)}
                >
                  <Text className="lp-result-name">{item.name}</Text>
                  <Text className="lp-result-addr">{item.address}</Text>
                </View>
              ))}
            </View>
          )}

        {/* Map */}
        <View className="lp-map-wrap">
          <Map
            className="lp-map"
            latitude={centerLat}
            longitude={centerLng}
            scale={16}
            markers={
              pos
                ? [
                    {
                      id: 1,
                      latitude: pos.lat,
                      longitude: pos.lng,
                      width: 48,
                      height: 48,
                      iconPath: "/assets/icons-png/location.png",
                    },
                  ]
                : []
            }
            onTap={handleMapTap}
            onError={(e: any) => console.log("map error", e)}
            showLocation
            enable3D={false}
            showCompass={false}
            enableOverlooking={false}
            enableZoom
            enableScroll
            enableRotate={false}
          />
          {/* Center crosshair indicator */}
          <View className="lp-crosshair">
            <View className="lp-crosshair-dot" />
          </View>
        </View>

        {/* Selected Address */}
        <View className="lp-address">
          <Text className="lp-addr-icon">📍</Text>
          <Text className="lp-addr-text">
            {address || "点击地图或搜索选择位置"}
          </Text>
        </View>

        {/* Coords */}
        {pos && (
          <View className="lp-coords">
            <Text className="lp-coords-text">
              {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="lp-actions">
          <View className="lp-btn lp-btn--ghost" onClick={handleClear}>
            <Text className="lp-btn-text lp-btn-text--ghost">清除位置</Text>
          </View>
          <View className="lp-btn lp-btn--primary" onClick={handleConfirm}>
            <Text className="lp-btn-text">确认位置</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
