/**
 * 通用 UI 组件库（对齐 PC 端 frontend/src/components/ui）
 * 统一从本文件导入：import { Button, Card } from "../../components/ui";
 *
 * 组件原则：
 * - props 接口对齐 PC 端
 * - 内部用 Taro 组件（View/Text/Input）实现
 * - 视觉走 CSS 变量（--pr/--srf/--rs），交互适配小程序
 */
export { default as AppSection } from "./AppSection";
export { default as PageHero } from "./PageHero";
export { default as MetricGrid } from "./MetricGrid";
export type { MetricItem } from "./MetricGrid";
export { default as MenuList } from "./MenuList";
export type { MenuListItem } from "./MenuList";
export { default as FloatingAction } from "./FloatingAction";
export { EmptyState } from "./EmptyState";
export {
  Skeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  InputSkeleton,
  TextLineSkeleton,
  TextParagraphSkeleton,
  CardGridSkeleton,
  StatCardsSkeleton,
  TableRowsSkeleton,
} from "./Skeleton";
export { Textarea } from "./Textarea";
export { SegControl } from "./SegControl";
export type { SegOption, SegControlProps } from "./SegControl";
export { Switch } from "./Switch";
export { Button } from "./Button";
export type { ButtonVariant, ButtonSize, ButtonProps } from "./Button";
export { Card, CardHeader, CardContent } from "./Card";
export type { CardPadding } from "./Card";
export { Badge } from "./Badge";
export type { BadgeVariant } from "./Badge";
export { StatCard } from "./StatCard";
export type { StatCardVariant } from "./StatCard";
export { Input, SearchInput, NumberInput } from "./Input";
export type { InputProps, SearchInputProps, NumberInputProps } from "./Input";
export { GlobalModal } from "./GlobalModal";
export type { GlobalModalType, GlobalModalProps } from "./GlobalModal";
export { Drawer } from "./Drawer";
export { List, ListItem } from "./List";
export type { ListItemProps, ListProps } from "./List";
export { RankRow, ReportRankList } from "./RankList";
export type { RankRowItem, ReportRankItem, RankStatus, RankType } from "./RankList";
export { Pagination } from "./Pagination";
export { DropdownSelect } from "./DropdownSelect";
export type { DropdownOption } from "./DropdownSelect";
export { IconGrid } from "./IconGrid";
export type { IconGridOption, CustomIconItem } from "./IconGrid";
export { LoadingOverlay } from "./LoadingOverlay";
export type { LoadingOverlayProps } from "./LoadingOverlay";
export { default as Spinner } from "./Spinner";
export type { SpinnerProps } from "./Spinner";
