/**
 * Pagination — 上一页/下一页（对齐 PC Pagination，无页码跳转）
 * totalPages<=1 且无 info 时返回 null
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import {
  ACTION_PREV_PAGE,
  ACTION_NEXT_PAGE,
  shouldShowPagination,
  isPageAtStart,
  isPageAtEnd,
  buildPaginationBtnClassName,
} from "../../../utils/pagination";
import { cx } from "../../../utils/cx";
import "./index.scss";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange?: (page: number) => void;
  info?: ReactNode;
  className?: string;
}

export function Pagination({ page, totalPages, onChange, info, className = "" }: PaginationProps) {
  if (!shouldShowPagination(totalPages, !!info)) return null;
  const prevDisabled = isPageAtStart(page);
  const nextDisabled = isPageAtEnd(page, totalPages);

  return (
    <View className={cx("ui-pagination", className)}>
      {info ? (
        <Text className="ui-pagination__info">{info}</Text>
      ) : (
        <Text className="ui-pagination__info-placeholder" />
      )}
      <View className="ui-pagination__btns">
        <View
          className={buildPaginationBtnClassName({ disabled: prevDisabled })}
          hoverClass={prevDisabled ? "" : "ui-pagination__btn--pressed"}
          onClick={() => !prevDisabled && onChange?.(page - 1)}
        >
          <Text>{ACTION_PREV_PAGE}</Text>
        </View>
        <View
          className={buildPaginationBtnClassName({ disabled: nextDisabled })}
          hoverClass={nextDisabled ? "" : "ui-pagination__btn--pressed"}
          onClick={() => !nextDisabled && onChange?.(page + 1)}
        >
          <Text>{ACTION_NEXT_PAGE}</Text>
        </View>
      </View>
    </View>
  );
}

export default Pagination;
