/**
 * Map — 账单地图页
 * 显示账单发生的地理位置标记，点击查看详情
 */
import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import PageLayout from "../../components/PageLayout";
import EmptyState from "../../components/EmptyState";
import CategoryIcon from "../../components/CategoryIcon";
import { AppSection, PageHero } from "../../components/ui";
import { fetchMapTransactions, fetchBookMembers } from "../../services/mapApi";
import type { MapTransaction, MapFilters, MapMember } from "../../types";
import { useManualQuery } from "../../hooks/useManualQuery";
import "./index.scss";

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  amount: number;
  type: "expense" | "income";
}

export default function MapPage() {
  const [selectedTx, setSelectedTx] = useState<MapTransaction | null>(null);
  const [filters, setFilters] = useState<MapFilters>({});
  const [members, setMembers] = useState<MapMember[]>([]);

  // 加载账本成员
  useEffect(() => {
    fetchBookMembers()
      .then(setMembers)
      .catch(() => {});
  }, []);

  const { data, isLoading } = useManualQuery<MapTransaction[]>({
    key: `map-transactions-${JSON.stringify(filters)}`,
    queryFn: () => fetchMapTransactions(filters),
  });

  // 过滤有位置信息的账单
  const transactionsWithLocation = useMemo(() => {
    const txs = data || [];
    return txs.filter(
      (t) =>
        t.latitude &&
        t.longitude &&
        !isNaN(t.latitude) &&
        !isNaN(t.longitude)
    );
  }, [data]);

  // 计算地图中心点（所有点的平均位置）
  const center = useMemo(() => {
    if (transactionsWithLocation.length === 0) {
      return { latitude: 39.9042, longitude: 116.4074 }; // 默认北京
    }
    const avgLat =
      transactionsWithLocation.reduce((s, t) => s + (t.latitude || 0), 0) /
      transactionsWithLocation.length;
    const avgLng =
      transactionsWithLocation.reduce((s, t) => s + (t.longitude || 0), 0) /
      transactionsWithLocation.length;
    return { latitude: avgLat, longitude: avgLng };
  }, [transactionsWithLocation]);

  // 准备地图标记
  const markers = useMemo<MapMarker[]>(() => {
    return transactionsWithLocation.map((t) => ({
      id: t.id,
      latitude: t.latitude,
      longitude: t.longitude,
      title: t.location_name || t.description || "消费地点",
      amount: t.amount,
      type: t.type,
    }));
  }, [transactionsWithLocation]);

  // 打开地图（调用微信原生地图）
  const handleOpenMap = () => {
    if (markers.length === 0) return;
    Taro.openLocation({
      latitude: center.latitude,
      longitude: center.longitude,
      name: "账单位置",
      address: "消费发生地",
      scale: 14,
    });
  };

  // 查看单个账单位置
  const handleViewLocation = (tx: MapTransaction) => {
    Taro.openLocation({
      latitude: tx.latitude,
      longitude: tx.longitude,
      name: tx.location_name || "消费地点",
      address: tx.description || "",
      scale: 16,
    });
  };

  // 查看账单详情
  const handleViewTransaction = (tx: MapTransaction) => {
    Taro.setStorageSync("edit_tx_id", String(tx.id));
    Taro.switchTab({ url: "/pages/AddTransaction/index" });
  };

  // 按地点分组
  const groupedByLocation = useMemo(() => {
    const map = new Map<
      string,
      { name: string; items: MapTransaction[]; total: number }
    >();
    transactionsWithLocation.forEach((t) => {
      const key = t.location_name || `${t.latitude},${t.longitude}`;
      if (!map.has(key)) {
        map.set(key, { name: key, items: [], total: 0 });
      }
      const group = map.get(key)!;
      group.items.push(t);
      group.total += t.amount;
    });
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [transactionsWithLocation]);

  // 清除所有筛选条件
  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <PageLayout contentClassName="map-content">
      <PageHero
        eyebrow="位置分析"
        title="消费地图"
        meta={`${transactionsWithLocation.length} 条带位置记录 · ${groupedByLocation.length} 个地点`}
        tone="surface"
      />

      <AppSection title="地图概览" compact onAction={handleOpenMap} actionText="打开地图 ›">
      <View className="map-overview" onClick={handleOpenMap}>
        <View className="map-overview__header">
          <Text className="map-overview__title">消费地图</Text>
          <Text className="map-overview__count">
            {transactionsWithLocation.length} 条带位置记录
          </Text>
        </View>
        <View className="map-overview__stats">
          <View className="map-overview__stat">
            <Text className="map-overview__stat-label">地点数</Text>
            <Text className="map-overview__stat-value">
              {groupedByLocation.length}
            </Text>
          </View>
          <View className="map-overview__stat">
            <Text className="map-overview__stat-label">总消费</Text>
            <Text className="map-overview__stat-value map-overview__stat-value--expense">
              ¥
              {transactionsWithLocation
                .filter((t) => t.type === "expense")
                .reduce((s, t) => s + t.amount, 0)
                .toFixed(0)}
            </Text>
          </View>
        </View>
        <View className="map-overview__hint">
          <Text className="map-overview__hint-text">点击打开地图查看</Text>
          <Text className="map-overview__hint-arrow">›</Text>
        </View>
      </View>
      </AppSection>

      {/* 筛选栏 */}
      <View className="map-filter-bar">
        {/* 类型切换 */}
        <View className="map-filter-segment">
          {(["all", "expense", "income"] as const).map((val) => (
            <View
              key={val}
              className={`map-filter-segment__item ${
                (val === "all" ? !filters.type : filters.type === val)
                  ? "map-filter-segment__item--active"
                  : ""
              }`}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  type: val === "all" ? undefined : val,
                }))
              }
            >
              <Text className="map-filter-segment__text">
                {val === "all" ? "全部" : val === "expense" ? "支出" : "收入"}
              </Text>
            </View>
          ))}
        </View>

        {/* 成员筛选 */}
        {members.length > 1 && (
          <View
            className="map-filter-chip"
            onClick={() => {
              const currentId = filters.memberIds?.[0];
              if (!currentId) {
                setFilters((f) => ({ ...f, memberIds: [members[0].userId] }));
              } else {
                const idx = members.findIndex((m) => m.userId === currentId);
                if (idx === members.length - 1) {
                  setFilters((f) => ({ ...f, memberIds: undefined }));
                } else {
                  setFilters((f) => ({
                    ...f,
                    memberIds: [members[idx + 1].userId],
                  }));
                }
              }
            }}
          >
            <Text className="map-filter-chip__text">
              {filters.memberIds?.[0]
                ? members.find((m) => m.userId === filters.memberIds![0])
                    ?.username || "成员"
                : "全部成员"}
            </Text>
          </View>
        )}

        {/* 日期筛选 */}
        <Picker
          mode="date"
          value={filters.startDate || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, startDate: e.detail.value }))
          }
        >
          <View className="map-filter-chip">
            <Text className="map-filter-chip__text">
              {filters.startDate
                ? filters.startDate.slice(5)
                : "开始"}
            </Text>
          </View>
        </Picker>

        <Picker
          mode="date"
          value={filters.endDate || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, endDate: e.detail.value }))
          }
        >
          <View className="map-filter-chip">
            <Text className="map-filter-chip__text">
              {filters.endDate ? filters.endDate.slice(5) : "结束"}
            </Text>
          </View>
        </Picker>

        {/* 清除按钮 */}
        {(filters.type || filters.memberIds || filters.startDate || filters.endDate) && (
          <View className="map-filter-clear" onClick={handleClearFilters}>
            <Text className="map-filter-clear__text">清除</Text>
          </View>
        )}
      </View>

      {/* 加载状态 */}
      {isLoading ? (
        <View className="map-loading">
          <View className="map-loading__spinner" />
          <Text className="map-loading__text">加载中...</Text>
        </View>
      ) : transactionsWithLocation.length === 0 ? (
        <EmptyState
          icon="map"
          title="暂无带位置的账单"
          description="记账时选择地点，这里会显示你的消费地图"
        />
      ) : (
        <>
          {/* 按地点分组列表 */}
          <AppSection title="按地点分组" flush>
            <ScrollView scrollY className="map-list">
              {groupedByLocation.map((group) => (
                <View key={group.key} className="map-group">
                  <View
                    className="map-group__header"
                    onClick={() =>
                      group.items[0] && handleViewLocation(group.items[0])
                    }
                  >
                    <View className="map-group__icon">点</View>
                    <View className="map-group__info">
                      <Text className="map-group__name">{group.name}</Text>
                      <Text className="map-group__meta">
                        {group.items.length} 笔消费 · 共 ¥
                        {group.items
                          .filter((t) => t.type === "expense")
                          .reduce((s, t) => s + t.amount, 0)
                          .toFixed(0)}
                      </Text>
                    </View>
                    <Text className="map-group__arrow">›</Text>
                  </View>
                  <View className="map-group__items">
                    {group.items.slice(0, 5).map((tx) => (
                      <View
                        key={tx.id}
                        className="map-item"
                        onClick={() => handleViewTransaction(tx)}
                      >
                        {/* 统一使用 CategoryIcon 组件渲染分类图标 */}
                        <CategoryIcon
                          icon={tx.category}
                          size={72}
                          background={
                            tx.type === "expense"
                              ? "rgba(239, 71, 111, 0.06)"
                              : "rgba(45, 157, 138, 0.06)"
                          }
                          border={
                            tx.type === "expense"
                              ? "1rpx solid rgba(239, 71, 111, 0.15)"
                              : "1rpx solid rgba(45, 157, 138, 0.15)"
                          }
                        />
                        <View className="map-item__main">
                          <Text className="map-item__desc">
                            {tx.description || "消费"}
                          </Text>
                          <Text className="map-item__date">
                            {tx.date
                              ? new Date(tx.date).toLocaleDateString("zh-CN")
                              : ""}
                          </Text>
                        </View>
                        <Text
                          className={`map-item__amount ${
                            tx.type === "expense"
                              ? "map-item__amount--expense"
                              : "map-item__amount--income"
                          }`}
                        >
                          {tx.type === "expense" ? "-" : "+"}¥
                          {tx.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                    {group.items.length > 5 && (
                      <Text className="map-group__more">
                        还有 {group.items.length - 5} 条...
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </AppSection>
        </>
      )}

      {/* 选中账单弹窗 */}
      {selectedTx && (
        <View className="map-modal" onClick={() => setSelectedTx(null)}>
          <View
            className="map-modal__sheet"
            onClick={(e: any) => e.stopPropagation()}
          >
            <Text className="map-modal__title">账单详情</Text>
            <View className="map-modal__field">
              <Text className="map-modal__label">金额</Text>
              <Text
                className={`map-modal__value ${
                  selectedTx.type === "expense"
                    ? "map-modal__value--expense"
                    : "map-modal__value--income"
                }`}
              >
                {selectedTx.type === "expense" ? "-" : "+"}¥
                {selectedTx.amount.toFixed(2)}
              </Text>
            </View>
            <View className="map-modal__field">
              <Text className="map-modal__label">描述</Text>
              <Text className="map-modal__value">
                {selectedTx.description || "—"}
              </Text>
            </View>
            <View className="map-modal__field">
              <Text className="map-modal__label">位置</Text>
              <Text className="map-modal__value">
                {selectedTx.location_name || "未命名地点"}
              </Text>
            </View>
            <View className="map-modal__actions">
              <View
                className="map-modal__btn"
                onClick={() => handleViewLocation(selectedTx)}
              >
                <Text>查看地图</Text>
              </View>
              <View
                className="map-modal__btn map-modal__btn--primary"
                onClick={() => handleViewTransaction(selectedTx)}
              >
                <Text>查看账单</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </PageLayout>
  );
}
