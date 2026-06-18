# Spec 1：通用 UI 组件库

> 日期：2026-06-18
> 依赖：Spec 0（Token 对齐）
> 关联：总体设计 `2026-06-18-taro-ui-alignment-overview.md`

## 1. 目标

在 `taro/src/components/ui/` 下建设**与 PC 端同名同 props 接口**的通用 UI 组件库，作为所有业务页面重构的基础。

核心原则：
- **props 接口对齐 PC 端**：页面代码可几乎逐字对照 PC 端迁移。
- **内部用 Taro 组件实现**：`View`/`Text`/`Input`/`ScrollView` 等，而非 `div`/`button`。
- **视觉对齐 PC，交互适配小程序**：去 hover 改 active；右侧抽屉改底部 sheet；`document` 事件改 Taro API。
- **复用 Spec 0 的 token**：颜色/圆角/阴影/动画全部走 CSS 变量。

## 2. 小程序适配关键点（PC → Taro 的差异）

PC 端组件大量依赖 Web DOM API，迁移时必须适配：

| PC 端用法 | 小程序替代 | 影响组件 |
|-----------|-----------|----------|
| `<div>` / `<button>` | `<View>` / `<Button>` 或可点击 `<View>` | 全部 |
| `e.target.contains(node)` + `document.mousedown` 关闭浮层 | 浮层用全屏蒙层 `<View onClick>` 拦截点击关闭 | DropdownSelect / GlobalModal / Drawer |
| `input.focus()` | `Taro` 不支持命令式 focus；用受控 `focus` prop | Input（去掉 clear 后 refocus 行为） |
| `input.select()` | 不支持 | NumberInput |
| `document.createElement('input')` 选文件 | `Taro.chooseImage` / `chooseMessageFile` | IconGrid |
| `File` 对象 | 小程序无 File，传 `tempFilePath` + `name` | IconGrid |
| `transition` hover 效果 | 改 `:active` 或 tap 态 | Button / Card / 列表项 |
| `position: fixed` 抽屉 | 小程序支持 fixed，但层级用 `--z-*` 严格控制 | Drawer / GlobalModal |
| `<select>` 原生 | 小程序有原生 `<Picker>`，但自定义下拉更易对齐 PC | DropdownSelect（自研，不用 Picker）|

## 3. 组件清单与接口设计

按"展示型 / 表单型 / 反馈型 / 容器型"分类。每个组件标注：PC 对应物、是否需适配、接口要点。

### 3.1 展示型组件

#### Button
- **PC 对应**：`frontend/src/components/ui/Button`
- **适配**：`<button>` → 可点击 `<View>`；`onClick` 透传；去 hover 用 active。
- **接口**（与 PC 一致）：
  ```ts
  interface ButtonProps {
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';   // rpx: sm=56 / md=72 / lg=88
    icon?: ReactNode;
    block?: boolean;             // 宽度 100%
    loading?: boolean;           // 小程序新增：内置 loading 态（PC 用外部）
    disabled?: boolean;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
  }
  ```
- **样式**：`.ui-btn--{variant}` / `.ui-btn--{size}`，圆角 `--rs`，过渡 `--df`。

#### Card / CardHeader / CardContent
- **PC 对应**：`Card`
- **适配**：无，纯展示。`<div>` → `<View>`。
- **接口**（与 PC 一致）：`padding?: 'sm'|'md'|'lg'|'none'`；CardHeader：`title/subTitle/action`。
- **样式**：背景 `--srfSoft`（或 `--srf`），边框 `--bd`，圆角 `--rm`，阴影 `--sh1`。

#### StatCard
- **PC 对应**：`StatCard`
- **适配**：无。
- **接口**（与 PC 一致）：
  ```ts
  interface StatCardProps {
    label?: ReactNode;
    value?: ReactNode;
    sub?: ReactNode;
    icon?: ReactNode;
    variant?: 'default' | 'income' | 'expense' | 'hero';
    className?: string;
    onClick?: () => void;
  }
  ```
- **hero variant**：用 `--prGr` 渐变背景 + 白字（对齐 PC）。

#### EmptyState
- **PC 对应**：`EmptyState`
- **适配**：无。
- **接口**（与 PC 一致）：`icon/title/description/action`，`variant?: 'default'|'compact'|'full'`。
- **注意**：taro 现有 `components/EmptyState` 保留兼容，新版放 `components/ui/EmptyState`，后续页面逐步迁移到 ui 版。最终废弃旧版。

#### Badge（小程序新增，PC 用 class）
- **理由**：PC 端 badge 用 `.badge` CSS class 散落各处；小程序集中为组件，便于复用。
- **接口**：
  ```ts
  interface BadgeProps {
    variant?: 'default' | 'primary' | 'income' | 'expense' | 'warn' | 'info';
    size?: 'sm' | 'md';
    children: ReactNode;
    className?: string;
  }
  ```

### 3.2 表单型组件

#### Input / SearchInput / NumberInput
- **PC 对应**：`Input`（含三个子组件）
- **适配**：
  - `<input>` → Taro `<Input>` 组件；`onChange` 取 `e.detail.value`（非 `e.target.value`）。
  - 去掉 `ref.focus()`（clear 后不 refocus，小程序不支持）。
  - `<button type="button">` 清空 → 可点击 `<View>` 或 `<Text>`。
- **接口**（保持与 PC 相似，但 onChange 签名改为传 value 字符串，更符合小程序习惯）：
  ```ts
  interface InputProps {
    value?: string;
    defaultValue?: string;       // 非受控
    onChange?: (value: string) => void;   // ← 注意：传 value，非 event
    placeholder?: string;
    label?: string;
    error?: string;
    allowClear?: boolean;
    icon?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    type?: 'text' | 'number' | 'digit' | 'password';  // 对齐 Taro Input type
    maxLength?: number;
    className?: string;
    wrapperClassName?: string;
  }
  ```
  > **关键决策**：PC 端 onChange 传 event 对象，小程序端改为传 `value` 字符串。原因是 Taro `<Input>` 的 onChange 给的是 `e.detail.value`，且小程序习惯直接拿值。页面迁移时需注意这一处差异（极小改动）。其余 props 全对齐。
- **SearchInput**：内置搜索图标 + clear，`onChange(value)` 同上。
- **NumberInput**：`prefix/suffix`，`type="digit"`，`onChange(value)`。

#### Textarea
- **PC 对应**：`Textarea`
- **适配**：Taro `<Textarea>`，`onInput`/`onChange` 取 `e.detail.value`；`autoResize` 用 Taro 原生 `autoHeight`。
- **接口**：`label/error/allowClear/showCount/maxLength/autoResize/required`，`onChange(value)`。

#### SegControl
- **PC 对应**：`SegControl`
- **适配**：`<button>` → 可点击 `<View>`/`<Text>`。
- **接口**（与 PC 完全一致，泛型 `<T extends string>`）：
  ```ts
  interface SegOption<T> { value: T; label: ReactNode; icon?: ReactNode; }
  interface SegControlProps<T> {
    options: SegOption<T>[];
    value?: T;
    onChange?: (value: T) => void;
    size?: 'sm' | 'md';
    variant?: 'default' | 'pill';
    className?: string;
  }
  ```
- **用途**：取代页面里手写的 tab 切换（收入/支出、周/月/年）。

#### DropdownSelect
- **PC 对应**：`DropdownSelect`
- **适配**（最复杂的适配）：
  - PC 用绝对定位浮层 + `document.mousedown` 关闭；小程序改用**底部弹出 sheet**（蒙层 + 上滑列表），交互更符合小程序习惯，视觉对齐 PC 的选项样式。
  - `options` 的 `icon` 支持 emoji / 图片 URL。
  - 搜索：sheet 内顶部放 `SearchInput`，过滤选项。
- **接口**（保持 PC 的核心字段）：
  ```ts
  interface DropdownOption { key: string; label: string; icon?: ReactNode; color?: string; }
  interface DropdownSelectProps {
    options: DropdownOption[];
    value?: string | null;
    onChange?: (key: string) => void;
    placeholder?: string;
    allowClear?: boolean;
    showSearch?: boolean;
    searchPlaceholder?: string;
    label?: string;
    required?: boolean;
    className?: string;
  }
  ```
- **渲染**：触发器是带 chevron 的卡片行；点击弹出底部 sheet（用 `--z-modal` 层级）。

#### IconGrid
- **PC 对应**：`IconGrid`
- **适配**：
  - 选文件：`document.createElement('input')` → `Taro.chooseImage({count:1, sourceType:['album','camera']})` 或 `chooseMessageFile`。
  - 上传回调：`File` → `{ tempFilePath, name, size }`。
  - 自定义图标删除：保留 hover 删除按钮逻辑，小程序用长按或显式删除按钮。
- **接口**（保持 PC 字段，上传回调签名适配小程序）：
  ```ts
  interface IconGridOption { value: string; icon: ReactNode; label?: string; isImage?: boolean; }
  interface CustomIconItem { id: string; icon_url: string; icon_type: 'category' | 'book'; }
  interface IconGridProps {
    options: IconGridOption[];
    value?: string;
    onChange?: (value: string) => void;
    customIcons?: CustomIconItem[];
    onUpload?: (file: { tempFilePath: string; name?: string; size?: number }, iconType: 'category'|'book') => Promise<void>;
    onDelete?: (iconId: string) => Promise<void>;
    iconType?: 'category' | 'book';
    columns?: number;       // 默认 5
    className?: string;
  }
  ```

#### Switch（小程序新增）
- **理由**：设置页、开关项需要，PC 用原生 `<input type="checkbox">`，小程序封装为组件对齐视觉。
- **接口**：`checked/onChange/className`。

### 3.3 反馈型组件

#### GlobalModal ⭐（核心）
- **PC 对应**：`GlobalModal`（confirm/detail/modal 三型）
- **适配**：
  - `document keydown ESC` 关闭 → 小程序无键盘，改为**点蒙层关闭 + 显式关闭按钮**（`closeOnMask`）。
  - z-index 动态计数器：移植 `useModalZIndex` 逻辑（全局 openCount 计数 + base）。
  - `<div>` → `<View>`；`<button>` → 可点击 `<View>`；`<input>` 不在此组件。
  - confirm 型：居中卡片（对齐 PC）；detail/modal 型：小程序改**底部 sheet 上滑**更自然，但视觉保持圆角 `--rm`、遮罩 `--ov`。
- **接口**（与 PC 完全一致）：
  ```ts
  type GlobalModalType = 'confirm' | 'detail' | 'modal';
  interface GlobalModalProps {
    open: boolean;
    onClose: () => void;
    type?: GlobalModalType;
    title?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';        // modal 宽度档（小程序按比例映射）
    closable?: boolean;
    closeOnMask?: boolean;
    className?: string;
    bodyClassName?: string;
    // confirm 专用
    confirmText?: string;
    cancelText?: string;
    confirmDanger?: boolean;
    loading?: boolean;
    onConfirm?: () => void;
  }
  ```
- **渲染策略**：
  - `type='confirm'`：居中卡片 + 透明遮罩 + scaleIn 动画（对齐 PC）。
  - `type='detail'|'modal'`：底部 sheet + 上滑动画（`slideUp`）+ 顶部圆角，内容可滚动（`ScrollView`）。
- **废弃**：taro 现有 `components/ConfirmDialog` 被 GlobalModal 的 confirm 型取代，重构页面时替换，最终移除 ConfirmDialog。

#### Drawer（底部半屏面板）
- **PC 对应**：`Drawer`（右侧抽屉）
- **适配**：PC 右侧滑入；小程序改**底部上滑 sheet**（更符合习惯）。蒙层 + 上滑动画。
- **接口**：
  ```ts
  interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    closable?: boolean;
    closeOnMask?: boolean;
    className?: string;
    height?: string | number | 'auto';   // 小程序：固定底部全宽，高度可配
  }
  ```
- **职责边界（明确，消除与 GlobalModal 的重叠）**：
  - **GlobalModal**：模态弹窗，遮罩强制聚焦，三型（confirm 居中 / detail+modal 底部 sheet）。用于详情展示、表单编辑、删除确认。
  - **Drawer**：非模态半屏面板，**可滚动长内容**（如筛选条件多选、批量操作列表、向导步骤），默认不强制聚焦（`closeOnMask` 可关）。高度可配（半屏/全屏）。
  - 判定规则：内容是"展示/确认一个对象" → GlobalModal；内容是"临时操作面板，需要较大空间" → Drawer。两者并存，不合并。

#### Toast（轻提示）
- **现状**：taro 现有 `components/Toast`，且页面大量用 `Taro.showToast`。
- **决策**：不另建，**统一封装一个 `toast()` 函数**，内部调用 `Taro.showToast`，但颜色对齐语义 token（`--inc/--exp/--info`）。封装在 `utils/toast.ts`：
  ```ts
  export function toast(msg: string, type?: 'success'|'error'|'info', duration?: number): void;
  ```
- **理由**：避免自建 toast 层级与 `Taro.showToast` 冲突；用原生能力最稳。

#### Skeleton
- **PC 对应**：`Skeleton` + 8 个预设
- **适配**：无（纯 View + shimmer 动画）。
- **接口**：`width/height/borderRadius/marginBottom`；预设 `AvatarSkeleton/ButtonSkeleton/InputSkeleton/TextLineSkeleton/TextParagraphSkeleton/CardGridSkeleton/StatCardsSkeleton/TableRowsSkeleton`。
- **shimmer**：用 `skeletonShimmer` keyframe（Spec 0 已定义或此处补充）。

### 3.4 容器与导航型组件

#### List / ListItem
- **PC 对应**：无独立组件（PC 用表格/卡片行）。
- **理由新增**：小程序列表场景极多（交易、分类、账本成员、设置项），统一抽出避免每页手写 `<View className="xxx-row">`。
- **接口**：
  ```ts
  interface ListItemProps {
    icon?: ReactNode;         // 左侧图标
    title?: ReactNode;
    description?: ReactNode;
    extra?: ReactNode;        // 右侧（金额、箭头、开关）
    onClick?: () => void;
    showArrow?: boolean;      // 右侧 ›
    divider?: boolean;        // 底部分隔线
    className?: string;
  }
  interface ListProps {
    children: ReactNode;
    className?: string;
    inset?: boolean;          // 内嵌卡片样式（圆角+边框）
  }
  ```
- **用途**：设置页菜单、交易列表、成员列表等。

#### RankRow / ReportRankList（排行/进度行）
- **PC 对应**：`RankList`
- **适配**：`<div>` → `<View>`；`renderCategoryIcon` 调用保持（taro 已有同名 util）。
- **接口**（与 PC 一致）：`RankRowItem { icon,label,amount,totalAmount,progress,meta,type,status,onClick }`；`ReportRankItem { icon,label,amount,type,tag,onClick }`。
- **用途**：Statistics、Budgets、AnnualReport。

#### Pagination
- **PC 对应**：`Pagination`（上一页/下一页）
- **适配**：`<button>` → `<View>`；信息文本对齐。
- **接口**：`page/totalPages/onChange/info?/className?`。`totalPages<=1 && !info` 时返回 null。
- **说明**：小程序列表更多用"上拉加载"（PageLayout 已支持），分页主要用于报表。保留以对齐 PC。

#### AppSection（已有，保留并增强）
- **现状**：`components/ui/AppSection` 已存在，接口良好。
- **决策**：保留，作为"带标题的分区容器"（对应 PC 的 Card+CardHeader 组合的小程序版）。补充 `loading` 态（传入时内部显示骨架）。

#### PageHero / MetricGrid / FloatingAction（已有，保留）
- 这三个现有组件设计良好，对齐 PC 的 StatCard(hero) 思路，**保留不动**。

## 4. 组件目录结构

```
taro/src/components/ui/
├── index.ts                    # 统一导出
├── Button/
│   ├── index.tsx
│   └── index.scss
├── Card/
├── StatCard/
├── EmptyState/
├── Badge/
├── Input/                      # 含 Input / SearchInput / NumberInput
├── Textarea/
├── SegControl/
├── DropdownSelect/
├── IconGrid/
├── Switch/
├── GlobalModal/
├── Drawer/
├── Skeleton/
├── List/
├── RankList/
├── Pagination/
├── AppSection/                 # 已有，迁入并增强
├── PageHero/                   # 已有，迁入
├── MetricGrid/                 # 已有，迁入
├── MenuList/                   # 已有，保留（基于 List 实现）
└── FloatingAction/             # 已有，迁入
```

统一导出 `index.ts`：
```ts
export { default as Button } from './Button';
export { Card, CardHeader, CardContent } from './Card';
export { StatCard } from './StatCard';
export { EmptyState } from './EmptyState';
export { Badge } from './Badge';
export { Input, SearchInput, NumberInput } from './Input';
export { Textarea } from './Textarea';
export { SegControl } from './SegControl';
export type { SegOption } from './SegControl';
export { DropdownSelect } from './DropdownSelect';
export type { DropdownOption } from './DropdownSelect';
export { IconGrid } from './IconGrid';
export type { IconGridOption, CustomIconItem } from './IconGrid';
export { Switch } from './Switch';
export { GlobalModal } from './GlobalModal';
export type { GlobalModalType } from './GlobalModal';
export { Drawer } from './Drawer';
export { Skeleton, AvatarSkeleton, /* ...预设 */ } from './Skeleton';
export { List, ListItem } from './List';
export { RankRow, ReportRankList } from './RankList';
export type { RankRowItem, ReportRankItem } from './RankList';
export { Pagination } from './Pagination';
export { default as AppSection } from './AppSection';
export { default as PageHero } from './PageHero';
export { default as MetricGrid } from './MetricGrid';
export type { MetricItem } from './MetricGrid';
export { default as MenuList } from './MenuList';
export type { MenuListItem } from './MenuList';
export { default as FloatingAction } from './FloatingAction';
```

## 5. 迁移与兼容策略

1. **现有 5 个 ui 组件**（AppSection/PageHero/MetricGrid/MenuList/FloatingAction）迁入新 `components/ui/` 目录结构，保持接口不变（它们已设计良好）。
2. **现有 ConfirmDialog**：保留，新增 GlobalModal。页面重构时逐步用 GlobalModal confirm 型替换 ConfirmDialog，最终移除。
3. **现有 EmptyState（components/EmptyState）**：保留，新增 ui/EmptyState。重构时迁移，最终移除旧版。
4. **现有 components/Toast**：保留，新增 `utils/toast.ts` 函数封装。重构时迁移。
5. **本次不改动现有页面**：组件库建设期，所有页面继续用旧组件运行。页面重构在 Spec 2+ 进行。

## 6. 实现优先级（建议分两批，但同属 Spec 1）

为控制单次工作量，Spec 1 内部建议分两步实现（均在本 spec 范围）：

**Step 1（地基组件，其他组件依赖它）**：
- Button、Card、EmptyState、Badge、Skeleton、AppSection（迁入增强）
- 这些是纯展示型，无复杂适配，先行。

**Step 2（表单 + 反馈 + 容器）**：
- Input/Textarea/SegControl/DropdownSelect/IconGrid/Switch
- GlobalModal/Drawer
- List/RankList/Pagination
- PageHero/MetricGrid/FloatingAction（迁入）

## 7. 验收标准

1. `components/ui/index.ts` 统一导出全部组件，类型完整。
2. 每个组件有独立的 `index.tsx` + `index.scss`。
3. 组件 props 接口与 PC 端对齐（文档中标注的差异点除外，如 onChange 传 value）。
4. 全部使用 Spec 0 的 token（`--pr/--srf/--rs/--sh1` 等），无硬编码颜色/圆角。
5. GlobalModal/DropdownSelect/Drawer 的浮层关闭机制在小程序可用（蒙层点击关闭）。
6. 编译通过（weapp + h5）。
7. 提供一个组件演示页 `pages/_ui-demo/index.tsx`（在 `app.config.ts` 的 `pages` 数组注册，但**不加入 tabBar**，仅作开发期可视化验收用）用于展示所有组件各 variant。**此演示页是验收的关键证据。** 完成组件库后即可移除或保留为开发参考。

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| DropdownSelect 底部 sheet 与 GlobalModal detail 视觉重叠 | 明确职责：DropdownSelect 是"选项选择"，GlobalModal 是"内容展示"；样式区分（sheet 高度/无标题栏） |
| IconGrid 上传适配小程序文件 API 失败 | 参考现有 Books 页面的 `uploadIcon` 实现（已跑通 `Taro.chooseImage` + `uploadIcon`），复用其模式 |
| onChange 签名差异（event vs value）导致迁移困惑 | 文档明确标注；组件 JSDoc 注明；演示页示范用法 |
| 组件数量多，单 spec 实现周期长 | 内部分 Step 1/2，每步可独立验证 |

## 9. 不在本 Spec 范围

- 业务页面重构（→ Spec 2~5）
- 业务专用组件（如 TransactionItem、BookCard 等页面内组件，随对应页面 spec 处理）
- 深色模式下的组件样式微调（变量已就位，具体调优随页面重构）
- 旧组件（ConfirmDialog/旧 EmptyState/旧 Toast）的移除（所有页面迁移完成后统一清理）
