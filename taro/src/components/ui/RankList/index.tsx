/**
 * RankRow / ReportRankList — 排行/进度行（对齐 PC RankList）
 * 用途：Statistics、Budgets、AnnualReport
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";
import { clampPercent } from "../../../utils/rankProgress";
import { EMPTY_NO_DATA } from "../../../utils/emptyCopy";

export type RankStatus = "safe" | "warn" | "danger";
export type RankType = "income" | "expense" | "neutral";

export interface RankRowItem {
  icon?: ReactNode;
  label?: ReactNode;
  amount?: ReactNode;
  totalAmount?: ReactNode;
  progress?: number;       /* 0-100 */
  meta?: ReactNode;
  type?: RankType;
  status?: RankStatus;
  onClick?: () => void;
}

export function RankRow({
  icon, label, amount, totalAmount, progress, meta,
  type = "neutral", status, onClick,
}: RankRowItem) {
  return (
    <View
      className={`ui-rank-row ui-rank-row--${type} ${status ? `ui-rank-row--${status}` : ""} ${onClick ? "ui-rank-row--clickable" : ""}`}
      hoverClass={onClick ? "ui-rank-row--pressed" : ""}
      hoverStayTime={80}
      onClick={onClick}
    >
      <View className="ui-rank-row__top">
        {icon ? <View className="ui-rank-row__icon">{icon}</View> : null}
        <Text className="ui-rank-row__label">{label}</Text>
        <View className="ui-rank-row__amount-group">
          {totalAmount ? <Text className="ui-rank-row__total">{totalAmount}</Text> : null}
          {amount ? <Text className="ui-rank-row__amount">{amount}</Text> : null}
        </View>
      </View>
      {progress != null ? (
        <View className="ui-rank-row__bar">
          <View className="ui-rank-row__bar-fill" style={{ width: `${clampPercent(progress)}%` }} />
        </View>
      ) : null}
      {meta ? <Text className="ui-rank-row__meta">{meta}</Text> : null}
    </View>
  );
}

export interface ReportRankItem {
  icon?: ReactNode;
  label?: ReactNode;
  amount?: ReactNode;
  type?: RankType;
  tag?: ReactNode;
  onClick?: () => void;
}

export function ReportRankList({ items, emptyText = EMPTY_NO_DATA }: { items: ReportRankItem[]; emptyText?: string }) {
  if (!items || items.length === 0) {
    return (
      <View className="ui-rank-empty">
        <Text className="ui-rank-empty__text">{emptyText}</Text>
      </View>
    );
  }
  return (
    <View className="ui-rank-list">
      {items.map((it, i) => (
        <View key={i} className="ui-rank-list__row" onClick={it.onClick}>
          {it.icon ? <View className="ui-rank-list__icon">{it.icon}</View> : null}
          <View className="ui-rank-list__main">
            <Text className="ui-rank-list__label">{it.label}</Text>
            {it.tag ? <View className="ui-rank-list__tag">{it.tag}</View> : null}
          </View>
          <Text className={`ui-rank-list__amount ui-rank-list__amount--${it.type || "neutral"}`}>{it.amount}</Text>
        </View>
      ))}
    </View>
  );
}
