/**
 * LocationPicker — 地图位置选择组件
 * 基于高德坐标（与后端、PC端一致）
 * 使用微信小程序原生 Map 组件 + 后端逆地理编码 / POI搜索 API
 * 定位策略：Taro.getLocation 单次定位（高精度 → 普通精度降级）
 * z-index: 2000，确保高于其他 sheet/modal
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Input, Map } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { apiGet } from "../../services/api";
import { useManualQuery } from "../../hooks/useManualQuery";
import { ensurePrivacyAuthorize, isPrivacyError } from "../../utils/privacy";
import SheetHeader from "../SheetHeader";
import { useTheme } from "../../context/ThemeContext";
import Icon, { ICON_COLOR } from "../Icon";
import { Spinner, Button } from "../ui";
import "./index.scss";
import { toastInfo } from "../../utils/toast";
import { FORM_PRIVACY_LOCATION, FORM_LOCATION_REQUIRED, FORM_LOCATION_UNAVAILABLE, FORM_LOCATION_DENIED, FORM_PRIVACY_REQUIRED, FORM_LOCATION_TIMEOUT, FORM_LOCATION_MANUAL_HINT } from "../../utils/formCopy";
import { TITLE_SELECT_LOCATION } from "../../utils/sectionCopy";
import { ACTION_SEARCHING_ELLIPSIS, ACTION_LOCATING, ACTION_LOCATE } from '../../utils/actionCopy'

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
  const { isDark } = useTheme();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [poiId, setPoiId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [locating, setLocating] = useState(false);
  const [locAccuracy, setLocAccuracy] = useState<number | null>(null);
  // 用 ref 保存逆地理编码函数，避免 useCallback 依赖顺序问题
  const reverseGeocodeRef = useRef<(lat: number, lng: number) => Promise<void>>(async () => {});

  // 逆地理编码：通过后端接口（高德）
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await apiGet<{
        address: string;
        poiName?: string;
        poiId?: string;
      }>(`/map/reverse-geocode?latitude=${lat}&longitude=${lng}`);
      setAddress(res.poiName ? `${res.poiName} · ${res.address}` : res.address);
      setPoiId(res.poiId || null);
    } catch (err) {
      console.warn("[LocationPicker] 逆地理编码失败:", err);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  }, []);

  // 同步到 ref，供 handleLocate 等闭包使用
  reverseGeocodeRef.current = reverseGeocode;

  // 定位（先尝试高精度，失败降级为普通精度）
  const handleLocate = useCallback(async () => {
    console.log("[LocationPicker] 开始定位...");
    setLocating(true);
    setLocAccuracy(null);

    // 先触发隐私授权（getLocation 是隐私接口）
    const ok = await ensurePrivacyAuthorize("获取位置需要访问您的地理位置");
    if (!ok) {
      console.warn("[LocationPicker] 隐私授权未通过");
      setLocating(false);
      toastInfo(FORM_PRIVACY_LOCATION);
      return;
    }

    // 检查位置权限
    try {
      const setting = await Taro.getSetting();
      const auth = setting.authSetting["scope.userLocation"];
      console.log("[LocationPicker] 位置权限状态:", auth);
      if (auth === false) {
        // 明确拒绝过，引导去设置
        Taro.showModal({
          title: "位置权限提示",
          content: "需要您授权位置权限才能定位，是否前往设置开启？",
          confirmText: "去设置",
          cancelText: "不了",
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting();
            }
          },
        });
        setLocating(false);
        return;
      }
    } catch (e) {
      console.warn("[LocationPicker] getSetting 失败:", e);
    }

    // 单次定位：先高精度，失败降级为普通精度
    const singleLocate = async (highAccuracy: boolean) => {
      console.log(`[LocationPicker] 调用 getLocation(highAccuracy=${highAccuracy})`);
      const res: any = await Taro.getLocation({
        type: "gcj02",
        isHighAccuracy: highAccuracy,
        highAccuracyExpireTime: 8000,
      });
      console.log("[LocationPicker] getLocation 成功:", res);
      return {
        lat: res.latitude,
        lng: res.longitude,
        acc: res.accuracy ?? 9999,
      };
    };

    try {
      let newPos;
      try {
        newPos = await singleLocate(true);
      } catch (e1: any) {
        console.warn("[LocationPicker] 高精度定位失败，降级普通精度:", e1);
        if (isPrivacyError(e1)) {
          throw e1; // 隐私错误不降级，直接抛出
        }
        newPos = await singleLocate(false);
      }

      console.log("[LocationPicker] 定位结果:", newPos);
      setPos(newPos);
      setLocAccuracy(newPos.acc);
      await reverseGeocodeRef.current(newPos.lat, newPos.lng);
    } catch (e: any) {
      console.error("[LocationPicker] 定位失败:", e);
      const msg = e?.errMsg || e?.message || "";
      let title = FORM_LOCATION_UNAVAILABLE;
      if (msg.indexOf("auth deny") !== -1 || msg.indexOf("authDeny") !== -1) {
        title = FORM_LOCATION_DENIED;
      } else if (msg.indexOf("privacy") !== -1) {
        title = FORM_PRIVACY_REQUIRED;
      } else if (msg.indexOf("timeout") !== -1) {
        title = FORM_LOCATION_TIMEOUT;
      } else if (msg) {
        title = msg.slice(0, 50);
      }
      toastInfo(title + FORM_LOCATION_MANUAL_HINT, 2500);
    } finally {
      setLocating(false);
    }
  }, []);

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
      // 延迟一点触发定位，避免弹窗动画期间发起请求
      const timer = setTimeout(() => {
        handleLocate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, initialLocation, handleLocate]);

  // 地图点击选点
  const handleMapTap = useCallback(
    (e: any) => {
      const { latitude, longitude } = e.detail;
      console.log("[LocationPicker] 地图点击:", latitude, longitude);
      const newPos = { lat: latitude, lng: longitude };
      setPos(newPos);
      reverseGeocodeRef.current(latitude, longitude);
    },
    [],
  );

  // 地图拖动结束选点（与 PC 端一致：拖动地图后取中心点位置）
  const handleRegionChange = useCallback((e: any) => {
    // 微信 onRegionChange 事件：e.type === 'end' 表示拖动/缩放结束
    if (e?.type !== "end") return;
    // 不同版本字段名不一，做兼容处理
    const lat = e?.detail?.latitude ?? e?.detail?.centerLatitude;
    const lng = e?.detail?.longitude ?? e?.detail?.centerLongitude;
    console.log("[LocationPicker] 地图拖动结束:", lat, lng, e?.detail);
    if (typeof lat === "number" && typeof lng === "number") {
      const newPos = { lat, lng };
      setPos(newPos);
      reverseGeocodeRef.current(lat, lng);
    }
  }, []);

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
      toastInfo(FORM_LOCATION_REQUIRED);
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

  // 清除位置
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
        <SheetHeader title={TITLE_SELECT_LOCATION} onClose={onClose} />

        {/* Search */}
        <View className="lp-search">
          <Input
            className="lp-search-input"
            placeholder="搜索地址或商户名称..."
            value={searchText}
            onInput={(e: any) => setSearchText(e.detail.value)}
          />
          <Text
            className={`lp-locate ${locating ? "lp-locate--loading" : ""}`}
            onClick={handleLocate}
          >
            {locating ? ACTION_LOCATING : ACTION_LOCATE}
          </Text>
        </View>

        {/* Search Results */}
        {searchText.length >= 2 &&
          (searching ? (
            <View className="lp-results lp-results--hint">
              <Spinner />
              <Text className="lp-results-tip">{ACTION_SEARCHING_ELLIPSIS}</Text>
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
                ? ([
                    {
                      id: 1,
                      latitude: pos.lat,
                      longitude: pos.lng,
                      width: 32,
                      height: 32,
                      iconPath: "/assets/icons-png/location.png",
                      callout: {
                        content: address || "已选择位置",
                        color: isDark ? "#F6F7F4" : "#1A1C19",
                        fontSize: 12,
                        borderRadius: 8,
                        borderWidth: 0,
                        bgColor: isDark ? "#2A2C29" : "#FFFFFF",
                        padding: 6,
                        display: "ALWAYS",
                        textAlign: "center",
                      },
                    },
                  ] as any)
                : []
            }
            onTap={handleMapTap}
            onRegionChange={handleRegionChange}
            onError={(e: any) => console.warn("[LocationPicker] map error", e)}
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
          <View className="lp-addr-icon">
            <Icon name="location" size={32} color={ICON_COLOR.primary} />
          </View>
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
          <Button variant="default" size="lg" block onClick={handleClear}>
            清除位置
          </Button>
          <Button variant="primary" size="lg" block onClick={handleConfirm}>
            确认位置
          </Button>
        </View>
      </View>
    </View>
  );
}
