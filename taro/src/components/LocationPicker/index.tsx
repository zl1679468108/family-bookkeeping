/**
 * LocationPicker — 地图位置选择组件
 * 基于高德坐标（与后端、PC端一致）
 * 使用微信小程序原生 Map 组件 + 后端逆地理编码 / POI搜索 API
 * 定位策略（3 层降级）：持续采样 → 单次高精度 → 单次普通精度
 * z-index: 2000，确保高于其他 sheet/modal
 */
import { useState, useCallback, useEffect } from "react";
import { View, Text, Input, Map } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { apiGet } from "../../services/api";
import { useManualQuery } from "../../hooks/useManualQuery";
import SheetHeader from "../SheetHeader";
import { Spinner } from "../ui";
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
  const [locAccuracy, setLocAccuracy] = useState<number | null>(null);

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

  // 定位（3 层降级：持续采样 → 单次高精度 → 单次普通精度）
  const handleLocate = useCallback(async () => {
    setLocating(true);
    setLocAccuracy(null);

    // Layer 1: 持续定位采样 — 连续监听位置变化，取 8s 内 accuracy 最优的点
    const tryContinuous = (): Promise<{ lat: number; lng: number; acc: number }> =>
      new Promise((resolve, reject) => {
        let best: { lat: number; lng: number; acc: number } | null = null;
        let rejected = false;
        const SAMPLE_MS = 8000;

        const onChange = (res: any) => {
          if (rejected) return;
          const acc = res.accuracy ?? 9999;
          if (!best || acc < best.acc) {
            best = { lat: res.latitude, lng: res.longitude, acc };
          }
        };

        Taro.onLocationChange(onChange);

        setTimeout(() => {
          rejected = true;
          Taro.offLocationChange(onChange);
          Taro.stopLocationUpdate();
          if (best && best.acc < 500) {
            resolve({ lat: best.lat, lng: best.lng, acc: best.acc });
          } else {
            reject(new Error("no_good_sample"));
          }
        }, SAMPLE_MS);

        Taro.startLocationUpdate({ type: "gcj02" });
      });

    // Layer 2/3: 单次定位 fallback
    const singleLocate = (highAccuracy: boolean) =>
      Taro.getLocation({
        type: "gcj02",
        isHighAccuracy: highAccuracy,
        highAccuracyExpireTime: 10000,
      }).then((res: any) => ({
        lat: res.latitude,
        lng: res.longitude,
        acc: res.accuracy ?? 9999,
      }));

    try {
      let newPos = await tryContinuous().catch(() =>
        singleLocate(true).catch(() => singleLocate(false)),
      );
      setPos(newPos);
      setLocAccuracy(newPos.acc);
      await reverseGeocode(newPos.lat, newPos.lng);
    } catch (e: any) {
      Taro.showToast({
        title: e?.errMsg || "无法获取当前位置，请确认已授权位置权限后手动搜索或点击地图选择位置",
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
  const { data: searchResults, isLoading: searching } = useManualQuery<
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
        <SheetHeader title="选择消费位置" onClose={onClose} />

        {/* Search */}
        <View className="lp-search">
          <Input
            className="lp-search-input"
            placeholder="搜索地址或商户名称..."
            value={searchText}
            onInput={(e: any) => setSearchText(e.detail.value)}
          />
          <Text className="lp-locate" onClick={handleLocate}>
            {locating ? "···" : "定位"}
          </Text>
          <Text className="lp-choose" onClick={handleChooseLocation}>
            选择
          </Text>
        </View>

        {/* Search Results */}
        {searchText.length >= 2 &&
          (searching ? (
            <View className="lp-results lp-results--hint">
              <Spinner />
              <Text className="lp-results-tip">搜索中…</Text>
            </View>
          ) : searchResults && searchResults.length > 0 ? (
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
          ) : (
            <View className="lp-results lp-results--hint">
              <Text className="lp-results-tip">无搜索结果</Text>
            </View>
          ))}

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
          <Text className="lp-addr-icon">位置</Text>
          <Text className="lp-addr-text">
            {address || "在地图上点击选择位置，或使用搜索查找地址"}
          </Text>
        </View>

        {/* 定位精度提示 */}
        {locAccuracy != null && (
          <View className={`lp-accuracy ${locAccuracy > 100 ? "lp-accuracy--low" : ""}`}>
            {locAccuracy > 100
              ? `定位精度约 ±${Math.round(locAccuracy)} 米，建议到开阔处或手动拖动微调`
              : `定位精度约 ±${Math.round(locAccuracy)} 米`}
          </View>
        )}

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
