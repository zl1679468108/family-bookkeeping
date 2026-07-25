/**
 * LocationPicker — 地图位置选择组件
 * 基于高德坐标（与后端、PC端一致）
 * 使用微信小程序原生 Map 组件 + 后端逆地理编码 / POI搜索 API
 *
 * 选点交互加固：
 * - 点击 / 拖动 / 点 POI 都能稳定取点
 * - mapCenter 与选中点同步，避免受控 lat/lng 把地图弹回
 * - 逆地理防抖 + 请求序号，避免乱序回写
 * - 去掉 marker callout，减少点击被气泡吞掉
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Input, Map } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { apiGet } from "../../services/api";
import { useManualQuery } from "../../hooks/useManualQuery";
import { ensurePrivacyAuthorize, isPrivacyError } from "../../utils/privacy";
import SheetHeader from "../SheetHeader";
import Icon, { ICON_COLOR } from "../Icon";
import { Spinner, Button } from "../ui";
import "./index.scss";
import { toastInfo } from "../../utils/toast";
import {
  FORM_PRIVACY_LOCATION,
  FORM_LOCATION_REQUIRED,
  FORM_LOCATION_UNAVAILABLE,
  FORM_LOCATION_DENIED,
  FORM_PRIVACY_REQUIRED,
  FORM_LOCATION_TIMEOUT,
  FORM_LOCATION_MANUAL_HINT,
  FORM_SEARCH_LOCATION,
  FORM_LOCATION_MAP_HINT,
  FORM_LOCATION_PERMISSION_TITLE,
  FORM_LOCATION_PERMISSION_CONTENT,
  formLocationAccuracyHint,
  FORM_PRIVACY_LOCATION_ACCESS,
} from "../../utils/formCopy";
import { TITLE_SELECT_LOCATION } from "../../utils/sectionCopy";
import {
  ACTION_SEARCHING_ELLIPSIS,
  ACTION_LOCATING,
  ACTION_LOCATE,
  ACTION_GO_SETTINGS,
  ACTION_DECLINE,
  ACTION_SEARCH,
} from "../../utils/actionCopy";
import { EMPTY_SEARCH_RESULTS } from "../../utils/emptyCopy";
import {
  buildLocateBtnClassName,
  buildAccuracyClassName,
} from "../../utils/locationPicker";
import { API_PATHS } from "../../utils/apiPaths";
import { merchantIdDisplay } from "../../utils/fieldCopy";
import {
  formatCoords,
  formatLocationLabel,
  formatPoiSearchLabel,
} from "../../utils/locationHelpers";

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

type LatLng = { lat: number; lng: number };

const MAP_ID = "lp-select-map";
const DEFAULT_CENTER: LatLng = { lat: 39.9042, lng: 116.4074 };
const GEOCODE_DEBOUNCE_MS = 260;

function toCoord(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function almostSame(a: LatLng | null | undefined, lat: number, lng: number): boolean {
  if (!a) return false;
  return Math.abs(a.lat - lat) < 1e-6 && Math.abs(a.lng - lng) < 1e-6;
}

function regionEventType(e: any): string {
  return String(e?.type || e?.detail?.type || "");
}

function regionCausedBy(e: any): string {
  return String(e?.causedBy || e?.detail?.causedBy || "");
}

export default function LocationPicker({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: LocationPickerProps) {
  /** 选中点（marker） */
  const [pos, setPos] = useState<LatLng | null>(null);
  /** 地图受控中心：仅程序化移动 / 拖动结束后同步，避免渲染把地图弹回 */
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [scale, setScale] = useState(16);
  const [address, setAddress] = useState("");
  const [poiId, setPoiId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [locating, setLocating] = useState(false);
  const [locAccuracy, setLocAccuracy] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const reverseGeocodeRef = useRef<(lat: number, lng: number) => Promise<void>>(
    async () => {},
  );
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeSeqRef = useRef(0);
  const skipRegionUntilRef = useRef(0);
  const lastGeocodeKeyRef = useRef("");

  const clearGeocodeTimer = () => {
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }
  };

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const seq = ++geocodeSeqRef.current;
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    lastGeocodeKeyRef.current = key;
    setGeocoding(true);
    try {
      const qs = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
      }).toString();
      const res = await apiGet<{
        address: string;
        poiName?: string;
        poiId?: string;
        locationName?: string;
      }>(API_PATHS.map.reverseGeocode(qs));
      if (seq !== geocodeSeqRef.current) return;
      const label =
        (res.locationName || "").trim() ||
        formatLocationLabel(res.poiName, res.address, {
          latitude: lat,
          longitude: lng,
        });
      setAddress(label);
      setPoiId(res.poiId || null);
    } catch {
      if (seq !== geocodeSeqRef.current) return;
      setAddress(
        formatLocationLabel(null, null, { latitude: lat, longitude: lng }),
      );
      setPoiId(null);
    } finally {
      if (seq === geocodeSeqRef.current) setGeocoding(false);
    }
  }, []);

  reverseGeocodeRef.current = reverseGeocode;

  const scheduleReverseGeocode = useCallback(
    (lat: number, lng: number, immediate = false) => {
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      clearGeocodeTimer();
      // 同一坐标且非强制刷新时跳过，减少重复请求
      if (!immediate && key === lastGeocodeKeyRef.current) return;
      const run = () => {
        reverseGeocodeRef.current(lat, lng);
      };
      if (immediate) {
        run();
        return;
      }
      geocodeTimerRef.current = setTimeout(run, GEOCODE_DEBOUNCE_MS);
    },
    [],
  );

  /** 统一写入选中点；syncMap 时同步受控中心（点击/定位/搜索需要） */
  const applySelection = useCallback(
    (
      lat: number,
      lng: number,
      opts?: {
        syncMap?: boolean;
        accuracy?: number | null;
        immediateGeocode?: boolean;
        skipRegionMs?: number;
      },
    ) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      setPos((prev) => (almostSame(prev, lat, lng) ? prev : { lat, lng }));
      if (opts?.syncMap !== false) {
        setMapCenter((prev) => (almostSame(prev, lat, lng) ? prev : { lat, lng }));
      }
      if (opts?.accuracy !== undefined) {
        setLocAccuracy(opts.accuracy);
      } else {
        setLocAccuracy(null);
      }
      if (opts?.skipRegionMs) {
        skipRegionUntilRef.current = Date.now() + opts.skipRegionMs;
      }
      scheduleReverseGeocode(lat, lng, !!opts?.immediateGeocode);
    },
    [scheduleReverseGeocode],
  );

  const readMapCenter = useCallback((): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      try {
        const ctx = Taro.createMapContext(MAP_ID);
        ctx.getCenterLocation({
          success: (res) => {
            const lat = toCoord(res.latitude);
            const lng = toCoord(res.longitude);
            if (lat == null || lng == null) {
              resolve(null);
              return;
            }
            resolve({ lat, lng });
          },
          fail: () => resolve(null),
        });
      } catch {
        resolve(null);
      }
    });
  }, []);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    setLocAccuracy(null);

    const ok = await ensurePrivacyAuthorize(FORM_PRIVACY_LOCATION_ACCESS);
    if (!ok) {
      setLocating(false);
      toastInfo(FORM_PRIVACY_LOCATION);
      return;
    }

    try {
      const setting = await Taro.getSetting();
      const auth = setting.authSetting["scope.userLocation"];
      if (auth === false) {
        Taro.showModal({
          title: FORM_LOCATION_PERMISSION_TITLE,
          content: FORM_LOCATION_PERMISSION_CONTENT,
          confirmText: ACTION_GO_SETTINGS,
          cancelText: ACTION_DECLINE,
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting();
            }
          },
        });
        setLocating(false);
        return;
      }
    } catch {}

    const singleLocate = async (highAccuracy: boolean) => {
      const res: any = await Taro.getLocation({
        type: "gcj02",
        isHighAccuracy: highAccuracy,
        highAccuracyExpireTime: 8000,
      });
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
        if (isPrivacyError(e1)) {
          throw e1;
        }
        newPos = await singleLocate(false);
      }

      setScale(16);
      applySelection(newPos.lat, newPos.lng, {
        syncMap: true,
        accuracy: newPos.acc,
        immediateGeocode: true,
        skipRegionMs: 600,
      });
    } catch (e: any) {
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
  }, [applySelection]);

  useEffect(() => {
    if (!visible) {
      clearGeocodeTimer();
      return;
    }
    setSearchText("");
    setSubmittedKeyword("");
    setLocAccuracy(null);
    setGeocoding(false);
    lastGeocodeKeyRef.current = "";

    if (initialLocation && initialLocation.latitude) {
      const lat = Number(initialLocation.latitude);
      const lng = Number(initialLocation.longitude);
      setPos({ lat, lng });
      setMapCenter({ lat, lng });
      setAddress(initialLocation.locationName || "");
      setPoiId(initialLocation.poiId || null);
      setScale(16);
    } else {
      setPos(null);
      setAddress("");
      setPoiId(null);
      const timer = setTimeout(() => {
        handleLocate();
      }, 300);
      return () => {
        clearTimeout(timer);
        clearGeocodeTimer();
      };
    }

    return () => clearGeocodeTimer();
  }, [visible, initialLocation, handleLocate]);

  /** 点击地图空白处取点 */
  const handleMapTap = useCallback(
    (e: any) => {
      const lat = toCoord(e?.detail?.latitude);
      const lng = toCoord(e?.detail?.longitude);
      if (lat == null || lng == null) return;
      applySelection(lat, lng, {
        syncMap: true,
        immediateGeocode: true,
        skipRegionMs: 500,
      });
    },
    [applySelection],
  );

  /** 点击地图上的 POI 标注 */
  const handlePoiTap = useCallback(
    (e: any) => {
      const lat = toCoord(e?.detail?.latitude);
      const lng = toCoord(e?.detail?.longitude);
      if (lat == null || lng == null) return;
      const name = String(e?.detail?.name || "").trim();
      applySelection(lat, lng, {
        syncMap: true,
        immediateGeocode: !name,
        skipRegionMs: 500,
      });
      // 有名称时先展示，再补全地址/商户ID
      if (name) {
        setAddress(name);
        scheduleReverseGeocode(lat, lng, true);
      }
    },
    [applySelection, scheduleReverseGeocode],
  );

  /**
   * 拖动/缩放结束：用 mapContext 取中心点（比 detail 坐标更稳）
   * 兼容 type / causedBy 在 e 或 e.detail 上的差异
   */
  const handleRegionChange = useCallback(
    async (e: any) => {
      const type = regionEventType(e);
      if (type && type !== "end") return;
      if (!type) return;

      const causedBy = regionCausedBy(e);
      // 程序化 set lat/lng 触发的 update 忽略
      if (causedBy === "update") return;
      // 点击后短窗口内忽略，避免与 onTap 抢写
      if (Date.now() < skipRegionUntilRef.current) return;

      // drag / scale / gesture / 空（部分机型不传 causedBy）都接受
      let next = await readMapCenter();
      if (!next) {
        const lat = toCoord(
          e?.detail?.latitude ?? e?.detail?.centerLatitude ?? e?.latitude,
        );
        const lng = toCoord(
          e?.detail?.longitude ?? e?.detail?.centerLongitude ?? e?.longitude,
        );
        if (lat == null || lng == null) return;
        next = { lat, lng };
      }

      // 拖动结束：选中点跟中心对齐，并同步受控中心，防止后续 render 弹回
      setPos((prev) =>
        almostSame(prev, next!.lat, next!.lng) ? prev : { ...next! },
      );
      setMapCenter((prev) =>
        almostSame(prev, next!.lat, next!.lng) ? prev : { ...next! },
      );
      setLocAccuracy(null);
      scheduleReverseGeocode(next.lat, next.lng, false);
    },
    [readMapCenter, scheduleReverseGeocode],
  );

  const { data: searchResults, isLoading: searching } = useManualQuery<
    Array<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      poiId: string;
    }>
  >({
    key: `map-poi-search-${submittedKeyword}-${pos?.lat}-${pos?.lng}`,
    queryFn: () => {
      const params = new URLSearchParams({ keyword: submittedKeyword });
      if (pos) {
        params.set("latitude", String(pos.lat));
        params.set("longitude", String(pos.lng));
      }
      return apiGet<
        Array<{
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          poiId: string;
        }>
      >(API_PATHS.map.poiSearch(params.toString()));
    },
    enabled: submittedKeyword.length >= 1,
  });

  const handleSearch = () => {
    const kw = searchText.trim();
    if (!kw) return;
    setSubmittedKeyword(kw);
  };

  const handleSearchSelect = (item: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    poiId: string;
  }) => {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    setScale(16);
    setAddress(formatPoiSearchLabel(item.name, item.address));
    setPoiId(item.poiId || null);
    applySelection(lat, lng, {
      syncMap: true,
      immediateGeocode: false,
      skipRegionMs: 600,
    });
    // 搜索结果已有文案，不必立刻逆地理；仍异步补全（商户ID 可能已有）
    setSearchText("");
    setSubmittedKeyword("");
    setLocAccuracy(null);
  };

  const handleConfirm = () => {
    if (!pos) {
      toastInfo(FORM_LOCATION_REQUIRED);
      return;
    }
    const locationName =
      address ||
      formatLocationLabel(null, null, {
        latitude: pos.lat,
        longitude: pos.lng,
      });
    onConfirm({
      latitude: pos.lat,
      longitude: pos.lng,
      locationName,
      address: locationName,
      poiId,
    });
  };

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

  const showResults = submittedKeyword.length >= 1;
  const coordsText = pos ? formatCoords(pos.lat, pos.lng, 6) : null;
  const addressHint = geocoding
    ? address || "正在解析地址…"
    : address || FORM_LOCATION_MAP_HINT;

  return (
    <View className="lp-overlay">
      <View className="lp-panel">
        <SheetHeader title={TITLE_SELECT_LOCATION} onClose={onClose} />

        <View className="lp-search">
          <Input
            className="lp-search-input"
            placeholder={FORM_SEARCH_LOCATION}
            value={searchText}
            confirmType="search"
            onInput={(e: any) => setSearchText(e.detail.value)}
            onConfirm={handleSearch}
          />
          <Text className="lp-search-btn" onClick={handleSearch}>
            {ACTION_SEARCH}
          </Text>
          <Text
            className={buildLocateBtnClassName({ loading: locating })}
            onClick={handleLocate}
          >
            {locating ? ACTION_LOCATING : ACTION_LOCATE}
          </Text>
        </View>

        {showResults &&
          (searching ? (
            <View className="lp-results lp-results--hint">
              <Spinner />
              <Text className="lp-results-tip">{ACTION_SEARCHING_ELLIPSIS}</Text>
            </View>
          ) : searchResults && searchResults.length > 0 ? (
            <View className="lp-results">
              {searchResults.slice(0, 8).map((item, i) => (
                <View
                  key={`${item.poiId || item.name}-${i}`}
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
              <Text className="lp-results-tip">{EMPTY_SEARCH_RESULTS}</Text>
            </View>
          ))}

        <View className="lp-map-wrap">
          <Map
            id={MAP_ID}
            className="lp-map"
            latitude={mapCenter.lat}
            longitude={mapCenter.lng}
            scale={scale}
            markers={
              pos
                ? ([
                    {
                      id: 1,
                      latitude: pos.lat,
                      longitude: pos.lng,
                      width: 28,
                      height: 28,
                      iconPath: "/assets/icons-png/location.png",
                      // 不使用 callout：气泡会吞掉点击，导致「有时点不中」
                    },
                  ] as any)
                : []
            }
            onTap={handleMapTap}
            onPoiTap={handlePoiTap as any}
            onRegionChange={handleRegionChange as any}
            onError={() => undefined}
            showLocation
            enablePoi
            enable3D={false}
            showCompass={false}
            enableOverlooking={false}
            enableZoom
            enableScroll
            enableRotate={false}
          />
          {/* 中心准星：拖动地图时表示当前将选中的中心点 */}
          <View className="lp-crosshair">
            <View className="lp-crosshair-dot" />
          </View>
        </View>

        <View className="lp-footer">
          <View className="lp-address">
            <View className="lp-addr-icon">
              <Icon name="location" size={32} color={ICON_COLOR.primary} />
            </View>
            <View className="lp-addr-body">
              <Text className="lp-addr-text">{addressHint}</Text>
              {coordsText ? (
                <Text className="lp-addr-coords">{coordsText}</Text>
              ) : null}
              {poiId ? (
                <Text className="lp-addr-poi">{merchantIdDisplay(poiId)}</Text>
              ) : null}
              {locAccuracy != null ? (
                <Text
                  className={buildAccuracyClassName({
                    low: locAccuracy > 100,
                  })}
                >
                  {formLocationAccuracyHint(locAccuracy, locAccuracy > 100)}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="lp-actions">
            <Button variant="default" size="md" block onClick={handleClear}>
              清除位置
            </Button>
            <Button variant="primary" size="md" block onClick={handleConfirm}>
              确认位置
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
