/**
 * Pagination — 上一页/下一页（对齐 PC Pagination，无页码跳转）
 * totalPages<=1 且无 info 时返回 null
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange?: (page: number) => void;
  info?: ReactNode;
  className?: string;
}

export function Pagination({ page, totalPages, onChange, info, className = "" }: PaginationProps) {
  if (totalPages <= 1 && !info) return null;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <View className={`ui-pagination ${className}`}>
      {info ? <Text className="ui-pagination__info">{info}</Text> : <Text className="ui-pagination__info-placeholder" />}
      <View className="ui-pagination__btns">
        <View
          className={`ui-pagination__btn ${prevDisabled ? "ui-pagination__btn--disabled" : ""}`}
          hoverClass={prevDisabled ? "" : "ui-pagination__btn--pressed"}
          onClick={() => !prevDisabled && onChange?.(page - 1)}
        >
          <Text>上一页</Text>
        </View>
        <View
          className={`ui-pagination__btn ${nextDisabled ? "ui-pagination__btn--disabled" : ""}`}
          hoverClass={nextDisabled ? "" : "ui-pagination__btn--pressed"}
          onClick={() => !nextDisabled && onChange?.(page + 1)}
        >
          <Text>下一页</Text>
        </View>
      </View>
    </View>
  );
}

export default Pagination;
