/**
 * MapPicker — 地图选点页
 * 用微信原生 map 组件渲染腾讯地图（GCJ-02 坐标系）。
 * 与 PC 端高德地图同为 GCJ-02，故存储坐标无需转换。
 * 定位策略（3 层降级）：
 *   1. startLocationUpdate + onLocationChange 持续采样 4s，取 accuracy 最优
 *   2. 单次高精度 getLocation(isHighAccuracy:true)
 *   3. 单次普通精度 getLocation
 */
import { useState, useEffect } from "react";
import { View, Map, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useTheme } from "../../context/ThemeContext";
import { useNavBarTheme } from "../../hooks/useNavBarTheme";
import "./index.scss";

interface PickedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export default function MapPicker() {
  const { isDark } = useTheme();
  useNavBarTheme();
  const router = Taro.useRouter();
  const params = router.params;
  const initLat = parseFloat(params.lat || "");
  const initLng = parseFloat(params.lng || "");

  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    initLat && initLng
      ? { lat: initLat, lng: initLng }
      : { lat: 39.9042, lng: 116.4074 },
  );
  const [name, setName] = useState(params.name || "");
  const [locating, setLocating] = useState(false);
  const [locAccuracy, setLocAccuracy] = useState<number | null>(null);

  // 设置导航栏标题
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: "选择位置" });
  }, []);

  const emitPicked = (loc: PickedLocation) => {
    const instance = Taro.getCurrentInstance();
    const channel = instance.page?.getOpenerEventChannel?.();
    channel?.emit("locationPicked", loc);
    Taro.navigateBack();
  };

  // 拖动地图结束 → 取地图中心为新选点
  const handleRegionChange = (e: any) => {
    if (e.detail?.type === "end" && e.detail?.centerLocation) {
      const c = e.detail.centerLocation;
      setCenter({ lat: c.latitude, lng: c.longitude });
    }
  };

  // 点击地图 → 选点移到点击处
  const handleTap = (e: any) => {
    if (e.detail?.latitude !== undefined) {
      setCenter({ lat: e.detail.latitude, lng: e.detail.longitude });
    }
  };

  // ====== 定位（3 层降级：持续采样 → 单次高精度 → 单次普通精度）======
  const handleLocate = () => {
    setLocating(true);
    setLocAccuracy(null);
    const done = (pos?: { lat: number; lng: number }, acc?: number) => {
      if (pos) setCenter(pos);
      setLocAccuracy(acc ?? null);
      setLocating(false);
    };

    // Layer 1: 持续定位采样 — 连续监听位置变化，取 8s 内 accuracy 最优的点
    // 8s 给 GPS 足够时间冷启动锁定（室内无 GPS 则退化为 WiFi，精度受限）
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
          // stopLocationUpdate 返回 void，忽略错误
          Taro.stopLocationUpdate();
          if (best && best.acc < 500) {
            resolve({ lat: best.lat, lng: best.lng, acc: best.acc });
          } else {
            reject(new Error("no_good_sample"));
          }
        }, SAMPLE_MS);

        // startLocationUpdate 返回 void，通过 onChange 回调中的错误处理失败情况
        Taro.startLocationUpdate({
          type: "gcj02",
        });
        // 如果 startLocationUpdate 失败（权限等），会在回调中体现或超时走 reject
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

    // 执行：持续采样 → 高精度单次 → 普通单次
    tryContinuous()
      .catch(() => singleLocate(true))
      .catch(() => singleLocate(false))
      .then((r) => done({ lat: r.lat, lng: r.lng }, r.acc))
      .catch(() => {
        Taro.showToast({ title: "定位失败，请检查定位权限", icon: "none" });
        done();
      });
  };

  const handleConfirm = () => {
    emitPicked({
      name: name.trim(),
      latitude: center.lat,
      longitude: center.lng,
    });
  };

  const markers = [
    {
      id: 0,
      latitude: center.lat,
      longitude: center.lng,
      width: 32,
      height: 32,
    },
  ] as any;

  return (
    <View className={`mappicker ${isDark ? "theme-dark" : ""}`}>
      {/* 搜索 / 名称输入 */}
      <View className="mp-search">
        <Input
          className="mp-search-input"
          placeholder="给这个地点起个名字（如：公司 / 家）"
          value={name}
          onInput={(e: any) => setName(e.detail.value)}
          maxlength={50}
        />
      </View>

      {/* 地图 */}
      <View className="mp-map-wrap">
        <Map
          className="mp-map"
          latitude={center.lat}
          longitude={center.lng}
          scale={16}
          markers={markers}
          showLocation
          onRegionChange={handleRegionChange}
          onTap={handleTap}
          onError={() => {}}
        />
        {/* 中心固定准星（视觉提示，实际选点为地图中心） */}
        <View className="mp-crosshair">
          <Text className="mp-crosshair-dot" />
        </View>
        <View className="mp-tip">拖动地图，将准星对准地点</View>
        {locAccuracy != null && (
          <View className={`mp-accuracy ${locAccuracy > 100 ? "mp-accuracy--low" : ""}`}>
            {locAccuracy > 100
              ? `定位精度约 ±${Math.round(locAccuracy)} 米，建议到开阔处或手动拖动微调`
              : `定位精度约 ±${Math.round(locAccuracy)} 米`}
          </View>
        )}
      </View>

      {/* 底部操作栏 */}
      <View className="mp-actions">
        <View
          className={`mp-locate ${locating ? "mp-locate--loading" : ""}`}
          onClick={handleLocate}
        >
          <Text className="mp-locate-text">我的位置</Text>
        </View>
        <View className="mp-confirm" onClick={handleConfirm}>
          <Text className="mp-confirm-text">确认选择</Text>
        </View>
      </View>
    </View>
  );
}
