/**
 * LocationPicker — v3.0 地图选点组件
 * 使用微信小程序原生 Map 组件，配合后端逆地理编码 API
 */
import { useState, useCallback, useEffect } from "react";
import { View, Text, Map, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { apiGet } from "../../../../services/api";
import { useManualQuery } from "../../../../hooks/useManualQuery";
import "./index.scss";

export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
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

  // Initialize with initialLocation or get current position
  useEffect(() => {
    if (!visible) return;
    if (initialLocation && initialLocation.latitude) {
      setPos({ lat: initialLocation.latitude, lng: initialLocation.longitude });
      setAddress(initialLocation.locationName);
      setPoiId(initialLocation.poiId);
    } else {
      // Auto locate
      handleLocate();
    }
  }, [visible, initialLocation]);

  // GPS定位
  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const res = await Taro.getLocation({ type: "gcj02" });
      const newPos = { lat: res.latitude, lng: res.longitude };
      setPos(newPos);
      await reverseGeocode(newPos.lat, newPos.lng);
    } catch (e: any) {
      Taro.showToast({
        title: e.errMsg || "定位失败，请授权位置权限",
        icon: "none",
      });
    } finally {
      setLocating(false);
    }
  }, []);

  // 地图点击选点
  const handleMapTap = useCallback((e: any) => {
    const { latitude, longitude } = e.detail;
    const newPos = { lat: latitude, lng: longitude };
    setPos(newPos);
    reverseGeocode(latitude, longitude);
  }, []);

  // 逆地理编码
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await apiGet<{
        address: string;
        poiName?: string;
        poiId?: string;
      }>(`/map/reverse-geocode?latitude=${lat}&longitude=${lng}`);
      setAddress(res.poiName ? `${res.poiName} · ${res.address}` : res.address);
      setPoiId(res.poiId || null);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  // POI搜索
  const { data: searchResults } = useManualQuery<
    Array<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      poiId: string;
    }>
  >({
    key: `map-search-${searchText}`,
    queryFn: () =>
      apiGet<
        Array<{
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          poiId: string;
        }>
      >(`/map/merchants?keyword=${encodeURIComponent(searchText)}`),
    enabled: searchText.length >= 2,
  });

  const handleSearchSelect = (item: any) => {
    setPos({ lat: item.latitude, lng: item.longitude });
    setAddress(item.name);
    setPoiId(item.poiId);
    setSearchText("");
  };

  const handleConfirm = () => {
    if (!pos) return;
    onConfirm({
      latitude: pos.lat,
      longitude: pos.lng,
      locationName: address,
      poiId,
    });
  };

  const handleClear = () => {
    onConfirm({ latitude: 0, longitude: 0, locationName: "", poiId: null });
  };

  if (!visible) return null;

  return (
    <View className="loc-picker-overlay">
      <View className="loc-picker-panel">
        {/* Header */}
        <View className="loc-picker-header">
          <Text className="loc-picker-back" onClick={onClose}>
            ←
          </Text>
          <Text className="loc-picker-title">选择位置</Text>
          <View style={{ width: "60rpx" }} />
        </View>

        {/* Search */}
        <View className="loc-picker-search">
          <Input
            className="loc-picker-search-input"
            placeholder="搜索地址或商户…"
            value={searchText}
            onInput={(e: any) => setSearchText(e.detail.value)}
          />
          <Text className="loc-picker-locate" onClick={handleLocate}>
            {locating ? "···" : "📍"}
          </Text>
        </View>

        {/* Search Results */}
        {searchResults &&
          searchResults.length > 0 &&
          searchText.length >= 2 && (
            <View className="loc-picker-results">
              {searchResults.map((r: any, i: number) => (
                <View
                  key={i}
                  className="loc-picker-result-item"
                  onClick={() => handleSearchSelect(r)}
                >
                  <Text className="loc-picker-result-name">{r.name}</Text>
                  <Text className="loc-picker-result-addr">{r.address}</Text>
                </View>
              ))}
            </View>
          )}

        {/* Map */}
        <Map
          className="loc-picker-map"
          latitude={pos?.lat || 39.9}
          longitude={pos?.lng || 116.4}
          scale={15}
          markers={
            pos
              ? [
                  {
                    id: 1,
                    latitude: pos.lat,
                    longitude: pos.lng,
                    width: 24,
                    height: 32,
                    iconPath: "",
                  },
                ]
              : []
          }
          onTap={handleMapTap}
          onError={() => {}}
          showLocation
        />

        {/* Selected Address */}
        {address ? (
          <View className="loc-picker-address">
            <Text className="loc-picker-addr-icon">📍</Text>
            <Text className="loc-picker-addr-text">{address}</Text>
          </View>
        ) : (
          <View className="loc-picker-address loc-picker-address--hint">
            <Text className="text-sm text-hint">
              点击地图选择位置，或使用搜索查找
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="loc-picker-actions">
          <View
            className="btn-secondary"
            style={{ flex: 1, padding: "20rpx 0" }}
            onClick={handleClear}
          >
            清除位置
          </View>
          <View
            className="btn-primary"
            style={{ flex: 1, padding: "20rpx 0" }}
            onClick={handleConfirm}
          >
            确认位置
          </View>
        </View>
      </View>
    </View>
  );
}
