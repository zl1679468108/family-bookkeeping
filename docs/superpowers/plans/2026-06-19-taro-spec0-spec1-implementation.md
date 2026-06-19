# Taro UI 对齐 PC 端 — Spec 0 (Token) + Spec 1 (组件库) 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 taro 小程序端的设计 Token 全量对齐 PC 端命名与数值，并建设 22 个 props 对齐 PC、内部 Taro 实现的通用 UI 组件库，作为后续 15 个业务页面重构的地基。

**Architecture:** Spec 0 重写 `app.scss` 的 token（新命名 + 旧名兼容映射 + 补齐阴影/动画/z-index/深色模式），保证现有页面零回归。Spec 1 在 `components/ui/` 下逐个建设组件，迁入现有 5 个组件，最后用 `_ui-demo` 演示页统一验收。组件视觉走 CSS 变量（`--pr`/`--srf`/`--rs`），交互适配小程序（蒙层点击关闭浮层、底部 sheet 替代抽屉、active 替代 hover）。

**Tech Stack:** Taro 4 (React) + TypeScript + SCSS + `@tarojs/components`。无测试框架，验收靠编译 + 演示页。

**关联设计文档：**
- `docs/superpowers/specs/2026-06-18-taro-ui-alignment-overview.md`
- `docs/superpowers/specs/2026-06-18-spec0-taro-design-tokens.md`
- `docs/superpowers/specs/2026-06-18-spec1-taro-ui-component-library.md`

**验证约定（无测试框架）：**
- 每个 Task 末尾的"验证"= 运行编译命令，确认无 TS/SCSS 报错。
- 关键视觉验证集中在最后的 `_ui-demo` 演示页（Task 22）。
- 编译命令：`cd taro && npm run build:h5`（h5 最快，先验），通过后再 `npm run build:weapp`。

---

## 文件结构总览

### Spec 0 — 修改
- `taro/src/app.scss`（重写 token 块 + 末尾追加 keyframes/深色模式）

### Spec 1 — 新建/迁入（全部在 `taro/src/components/ui/`）
- `index.ts`（统一导出）
- 地基展示组件：`Button/`、`Card/`、`Badge/`、`EmptyState/`、`Skeleton/`
- 表单组件：`Input/`、`Textarea/`、`SegControl/`、`Switch/`、`DropdownSelect/`、`IconGrid/`
- 反馈组件：`GlobalModal/`、`Drawer/`
- 容器组件：`List/`、`RankList/`、`Pagination/`
- 迁入增强：`AppSection/`、`PageHero/`、`MetricGrid/`、`FloatingAction/`、`MenuList/`
- 演示页：`taro/src/pages/_ui-demo/index.tsx` + `.scss`，注册到 `app.config.ts`

### 工具
- `taro/src/utils/toast.ts`（统一 toast 封装）

---

## Task 0: 前置 — 确认基线编译通过

**Files:** 无修改

- [ ] **Step 1: 确认当前可编译**

Run:
```bash
cd taro && npm run build:h5 2>&1 | tail -20
```
Expected: 编译成功（BUILD SUCCESSFUL 或无 ERROR）。若失败，先修复现有问题再开始。

- [ ] **Step 2: 记录基线**

记下当前编译耗时与输出，作为后续每个 Task 验证的对照基线。

---

## Task 1: Spec 0 — 重写设计 Token

**Files:**
- Modify: `taro/src/app.scss:8-52`（替换 token 块）
- Modify: `taro/src/app.scss`（末尾追加 keyframes + 深色模式）

- [ ] **Step 1: 替换 `page { ... }` token 块**

把 `taro/src/app.scss` 第 8-52 行（从 `/* === Design Tokens === */` 到 `page { ... }` 的闭合 `}` 即第 52 行）整段替换为下面的内容。**注意：保留第 1-7 行的文件头注释，只替换 token 块。**

```scss
/* === Design Tokens（对齐 PC 端 frontend/src/styles/design-tokens.css） ===
   命名规则：极简缩写（--pr=primary, --srf=surface, --fg=foreground, --bd=border, --rs=radius small）
   单位：PC 用 px，小程序用 rpx（1px ≈ 2rpx）
   === */
page {
  /* ═══ 主色（绿色） ═══ */
  --pr:    #2D9D8A;
  --prH:   #248B78;   /* hover */
  --prD:   #1A7A6A;   /* pressed */
  --prBg:  #E7F5F2;   /* 主色淡背景 */
  --prBd:  #C4E5DE;   /* 主色边框 */
  --prGr:  linear-gradient(135deg, #2D9D8A 0%, #45B7A7 100%); /* 主色渐变（hero/logo/头像） */

  /* ═══ 中性色 ═══ */
  --bg:      #F6F7F4;
  --srf:     #FFFFFF;
  --srfH:    #F9FAF8;   /* hover 表面 */
  --srfSoft: #FAFAF7;   /* 柔色表面（卡片底） */
  --fg:      #1A1C19;
  --fg2:     #5A5D58;
  --fg3:     #8B8E89;
  --bd:      #E0E2DD;
  --bdL:     #EDEEE9;   /* 浅边框/分隔线 */
  --bdH:     #D0D2CD;   /* hover 边框 */

  /* ═══ 语义色（深 + 淡背景成对） ═══ */
  --inc:    #3BA272;   --incBg:  #EAF7F0;   /* 收入 */
  --exp:    #E06055;   --expBg:  #FCEEED;   /* 支出 / danger */
  --warn:   #E8A838;   --warnBg: #FDF6E8;   /* 警告 */
  --info:   #4A90D9;   --infoBg: #ECF3FB;   /* 信息 */

  /* ═══ 遮罩 ═══ */
  --ov: rgba(0, 0, 0, 0.35);

  /* ═══ 圆角（px→rpx ×2） ═══ */
  --rs: 16rpx;   /* 8px  按钮/输入框 */
  --rm: 24rpx;   /* 12px 卡片/弹窗 */
  --rl: 36rpx;   /* 18px 面板/StatCard */
  --rx: 48rpx;   /* 24px 大面板 */

  /* ═══ 阴影（4 档） ═══ */
  --sh1: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
  --sh2: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  --sh3: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
  --sh4: 0 32rpx 96rpx rgba(0, 0, 0, 0.12);

  /* ═══ Z-Index 层级 ═══ */
  --z-baseline: 0;   --z-1: 1;   --z-5: 5;   --z-10: 10;
  --z-30: 30;   --z-50: 50;  --z-100: 100;  --z-200: 200;  --z-400: 400;
  --z-detail: 1000;   /* 详情弹窗 */
  --z-modal: 1500;    /* 表单/编辑弹窗 */
  --z-critical: 2500; /* 确认/危险操作 */
  --z-toast: 3000;    /* Toast，最高 */

  /* ═══ 缓动函数 ═══ */
  --ease: cubic-bezier(0.25, 0, 0, 1);
  --sp:   cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性（弹窗） */

  /* ═══ 过渡时长 ═══ */
  --df: 0.15s;   /* 微交互 */
  --dn: 0.25s;   /* 展开/折叠 */
  --ds: 0.35s;   /* 视图切换 */

  /* ═══ 等宽字体（金额） ═══ */
  --fm: ui-monospace, "SF Mono", Menlo, monospace;

  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC",
    "Helvetica Neue", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
  color: var(--fg);
  background-color: var(--bg);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;

  /* ═══ 旧命名兼容映射（过渡期保留，页面重构完成后移除） ═══ */
  --primary:      var(--pr);
  --primary-dark: var(--prH);
  --primary-bg:   var(--prBg);
  --primary-grad: var(--prGr);
  --surface:      var(--srf);
  --surface-soft: var(--srfSoft);
  --fg-2:         var(--fg2);
  --fg-3:         var(--fg3);
  --border:       var(--bd);
  --border-light: var(--bdL);
  --accent:       var(--pr);
  --income:       var(--inc);
  --income-bg:    var(--incBg);
  --expense:      var(--exp);
  --expense-bg:   var(--expBg);
  --radius-sm:    var(--rs);
  --radius-md:    var(--rm);
  --radius-lg:    var(--rl);
  --radius-xl:    var(--rx);
  --font-base:    28rpx;
}
```

> 关键变更说明：
> - `--bg` 从 `#f5f6f1` → `#F6F7F4`（对齐 PC，差异极小）。
> - `--fg` 从 `#24312d` → `#1A1C19`。
> - `--primary-grad` 从带深色版本 → 纯绿渐变（对齐 PC hero 视觉）。
> - 旧名兼容映射保证现有页面零回归。

- [ ] **Step 2: 颜色工具类对齐新命名**

在 app.scss 中找到颜色工具类（`.text-primary`、`.text-secondary` 等，约在第 54 行后的工具类区），把它们引用的 `var(--primary)` 等改为新名。先搜索定位：

Run: `cd taro && grep -n "var(--primary)\|var(--surface)\|var(--expense)\|var(--fg-2)\|var(--fg-3)\|var(--border)\|var(--accent)" src/app.scss`

对匹配到的工具类行，将 `var(--primary)` → `var(--pr)`、`var(--surface)` → `var(--srf)`、`var(--expense)` → `var(--exp)`、`var(--fg-2)` → `var(--fg2)`、`var(--fg-3)` → `var(--fg3)`、`var(--border)` → `var(--bd)`、`var(--accent)` → `var(--pr)`。

（这些行因兼容映射本来也能工作，但工具类作为公共样式优先用新名，减少未来清理量。）

- [ ] **Step 3: 在 app.scss 末尾追加全局 keyframes**

在 `taro/src/app.scss` 文件**最末尾**追加：

```scss

/* === 全局动画 keyframes（对齐 PC design-tokens.css） === */
@keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp  { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn   { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes slideUp   { from { transform: translateY(60rpx); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(60rpx); opacity: 0; } }
@keyframes spin      { to { transform: rotate(360deg); } }
@keyframes skeletonShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 聚焦高亮（详情返回列表定位，对齐 PC spotlightPulse） */
@keyframes spotlightPulse {
  0%, 100% { box-shadow: 0 0 0 2rpx rgba(45, 157, 138, 0.45), 0 0 28rpx rgba(45, 157, 138, 0.18); }
  50%      { box-shadow: 0 0 0 4rpx rgba(45, 157, 138, 0.7),  0 0 48rpx rgba(45, 157, 138, 0.32); }
}
.spotlight--focused { animation: spotlightPulse 1.6s var(--ease) 2; }

/* === 深色模式（变量就位，切换入口随 Spec 5 实现） === */
page.theme-dark {
  --bg:    #1A1C19;
  --srf:   #252825;
  --srfH:  #2C2F2C;
  --srfSoft: #2C2F2C;
  --fg:    #E8EAE5;
  --fg2:   #A5A8A3;
  --fg3:   #6E716C;
  --bd:    #3A3D39;
  --bdL:   #303330;
  --bdH:   #454845;
  --pr:    #45B7A7;
  --prH:   #52C4B4;
  --prD:   #2D9D8A;
  --prBg:  #1A3A35;
  --prBd:  #2A5A52;
  --inc:    #52C494;   --incBg:  #1A3528;
  --exp:    #F08075;   --expBg:  #3A2020;
  --warn:   #F0C040;   --warnBg: #3A3020;
  --info:   #60A5FA;   --infoBg: #1A2A40;
  --ov: rgba(0, 0, 0, 0.55);
  --sh1: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  --sh2: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  --sh3: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
  --sh4: 0 32rpx 96rpx rgba(0, 0, 0, 0.5);
}
```

- [ ] **Step 4: 验证编译**

Run: `cd taro && npm run build:h5 2>&1 | tail -15`
Expected: BUILD SUCCESSFUL，无 SCSS 报错。

- [ ] **Step 5: Commit**

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/app.scss
git commit -m "feat(taro): Spec0 设计 token 对齐 PC 端命名与数值

- 主色/中性/语义/圆角采用 PC 极简命名（--pr/--srf/--inc/--exp/--rs）
- 补齐阴影(4档)/z-index(含弹窗3层)/缓动/过渡时长体系
- 旧命名兼容映射，现有页面零回归
- 追加全局 keyframes（fadeIn/scaleIn/slideUp/spin/shimmer/spotlight）
- 追加深色模式变量（.theme-dark，切换入口待 Spec5）"
```

---

## Task 2: 迁入现有 5 个 ui 组件 + 建统一导出骨架

**Files:**
- Create: `taro/src/components/ui/index.ts`
- Verify: `taro/src/components/ui/{AppSection,PageHero,MetricGrid,FloatingAction,MenuList}/`

- [ ] **Step 1: 确认现有 5 个组件已位于 `components/ui/`**

Run: `cd taro && ls src/components/ui/`
Expected: 列出 `AppSection PageHero MetricGrid FloatingAction MenuList`（及各自 index.tsx/index.scss）。

（这 5 个组件设计良好，接口不变，无需改动代码，只需建统一导出。）

- [ ] **Step 2: 创建统一导出 `index.ts`**

Create `taro/src/components/ui/index.ts`（注意：AppSection/PageHero/MetricGrid/MenuList/FloatingAction 都是 `export default`，故用 `export { default as X }` 语法）:

```ts
/**
 * 通用 UI 组件库（对齐 PC 端 frontend/src/components/ui）
 * 统一从本文件导入：import { Button, Card } from "@/components/ui";
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
```

（后续新建组件的导出语句，在各自 Task 末尾追加到本文件。）

- [ ] **Step 3: 验证编译**

Run: `cd taro && npm run build:h5 2>&1 | tail -10`
Expected: BUILD SUCCESSFUL。

- [ ] **Step 4: Commit**

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 建立通用组件库统一导出骨架

迁入现有 5 个组件（AppSection/PageHero/MetricGrid/MenuList/FloatingAction）的统一导出"
```

---

## Task 3: Button 组件

**Files:**
- Create: `taro/src/components/ui/Button/index.tsx`
- Create: `taro/src/components/ui/Button/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Button/index.tsx`:

```tsx
/**
 * Button — 通用按钮（对齐 PC frontend/src/components/ui/Button）
 * variant: default/primary/secondary/outline/ghost/danger
 * size: sm(56rpx)/md(72rpx)/lg(88rpx)
 * 适配：div/button → 可点击 View；hover → active；新增 loading 内置态
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Button({
  variant = "default",
  size = "md",
  icon,
  block = false,
  loading = false,
  disabled = false,
  children,
  className = "",
  onClick,
}: ButtonProps) {
  const cls = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    block ? "ui-btn--block" : "",
    loading ? "ui-btn--loading" : "",
    disabled ? "ui-btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View
      className={cls}
      hoverClass={disabled || loading ? "" : "ui-btn--pressed"}
      hoverStayTime={100}
      onClick={(e) => {
        if (disabled || loading) return;
        e.stopPropagation();
        onClick?.();
      }}
    >
      {loading ? (
        <View className="ui-btn__spinner" />
      ) : icon ? (
        <View className="ui-btn__icon">{icon}</View>
      ) : null}
      {children ? <Text className="ui-btn__label">{children}</Text> : null}
    </View>
  );
}

export default Button;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Button/index.scss`:

```scss
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: var(--rs);
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1;
  padding: 0 24rpx;
  box-sizing: border-box;
  transition: opacity var(--df) var(--ease), background var(--df) var(--ease);
  user-select: none;

  /* sizes */
  &--sm { height: 56rpx; font-size: 24rpx; padding: 0 20rpx; }
  &--md { height: 72rpx; font-size: 28rpx; padding: 0 28rpx; }
  &--lg { height: 88rpx; font-size: 30rpx; padding: 0 36rpx; }

  &--block { display: flex; width: 100%; }

  /* variants */
  &--default {
    background: var(--srf);
    color: var(--fg);
    border: 2rpx solid var(--bd);
  }
  &--primary {
    background: var(--pr);
    color: #fff;
  }
  &--secondary {
    background: var(--prBg);
    color: var(--pr);
  }
  &--outline {
    background: transparent;
    color: var(--pr);
    border: 2rpx solid var(--pr);
  }
  &--ghost {
    background: transparent;
    color: var(--fg2);
  }
  &--danger {
    background: var(--exp);
    color: #fff;
  }

  /* pressed（替代 hover） */
  &--pressed { opacity: 0.82; }
  &--primary.ui-btn--pressed,
  &--danger.ui-btn--pressed { background: var(--prD); }

  &--disabled,
  &--loading {
    opacity: 0.5;
    pointer-events: none;
  }

  &__icon { display: flex; align-items: center; justify-content: center; }
  &__label { font-size: inherit; }

  /* loading spinner */
  &__spinner {
    width: 28rpx; height: 28rpx;
    border: 3rpx solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  &--default &__spinner,
  &--outline &__spinner,
  &--ghost &__spinner,
  &--secondary &__spinner {
    border-color: rgba(45,157,138,0.3);
    border-top-color: var(--pr);
  }
}
```

- [ ] **Step 3: 追加导出**

在 `taro/src/components/ui/index.ts` 末尾追加（在 FloatingAction 导出行之后）:

```ts
export { Button } from "./Button";
export type { ButtonVariant, ButtonSize, ButtonProps } from "./Button";
```

- [ ] **Step 4: 验证编译**

Run: `cd taro && npm run build:h5 2>&1 | tail -10`
Expected: BUILD SUCCESSFUL。

- [ ] **Step 5: Commit**

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Button taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Button 组件（6 variant × 3 size，内置 loading）"
```

---

## Task 4: Card 组件

**Files:**
- Create: `taro/src/components/ui/Card/index.tsx`
- Create: `taro/src/components/ui/Card/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Card/index.tsx`:

```tsx
/**
 * Card / CardHeader / CardContent — 卡片容器（对齐 PC Card）
 * padding: sm(24rpx)/md(40rpx)/lg(56rpx)/none
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type CardPadding = "sm" | "md" | "lg" | "none";

export interface CardProps {
  padding?: CardPadding;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ padding = "md", children, className = "", onClick }: CardProps) {
  return (
    <View
      className={`ui-card ui-card--pad-${padding} ${className}`}
      hoverClass={onClick ? "ui-card--pressed" : ""}
      hoverStayTime={100}
      onClick={onClick}
    >
      {children}
    </View>
  );
}

export interface CardHeaderProps {
  title?: ReactNode;
  subTitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subTitle, action, className = "" }: CardHeaderProps) {
  return (
    <View className={`ui-card__header ${className}`}>
      <View className="ui-card__header-text">
        {title ? <Text className="ui-card__title">{title}</Text> : null}
        {subTitle ? <Text className="ui-card__subtitle">{subTitle}</Text> : null}
      </View>
      {action ? <View className="ui-card__action">{action}</View> : null}
    </View>
  );
}

export function CardContent({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <View className={`ui-card__content ${className}`}>{children}</View>;
}
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Card/index.scss`:

```scss
.ui-card {
  background: var(--srfSoft);
  border: 2rpx solid var(--bdL);
  border-radius: var(--rm);
  box-shadow: var(--sh1);
  box-sizing: border-box;
  transition: box-shadow var(--df) var(--ease);
  &--pressed { box-shadow: var(--sh2); }

  &--pad-sm { padding: 24rpx; }
  &--pad-md { padding: 40rpx; }
  &--pad-lg { padding: 56rpx; }
  &--pad-none { padding: 0; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24rpx;
    margin-bottom: 24rpx;
    border-bottom: 2rpx solid var(--bdL);
  }
  &__header-text { display: flex; flex-direction: column; gap: 4rpx; }
  &__title { font-size: 30rpx; font-weight: 600; color: var(--fg); }
  &__subtitle { font-size: 24rpx; color: var(--fg3); }
  &__action { display: flex; align-items: center; }
  &__content { /* 透明容器，仅占位 */ }
}
```

- [ ] **Step 3: 追加导出**

在 `index.ts` 追加:

```ts
export { Card, CardHeader, CardContent } from "./Card";
export type { CardPadding } from "./Card";
```

- [ ] **Step 4: 验证 & Commit**

Run: `cd taro && npm run build:h5 2>&1 | tail -10`（期望 SUCCESSFUL）

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Card taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Card/CardHeader/CardContent 组件"
```

---

## Task 5: Badge 组件

**Files:**
- Create: `taro/src/components/ui/Badge/index.tsx`
- Create: `taro/src/components/ui/Badge/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Badge/index.tsx`:

```tsx
/**
 * Badge — 徽标/标签（小程序新增，PC 用 .badge class）
 * variant: default/primary/income/expense/warn/info
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type BadgeVariant = "default" | "primary" | "income" | "expense" | "warn" | "info";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", size = "sm", children, className = "" }: BadgeProps) {
  return (
    <View className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`}>
      <Text className="ui-badge__text">{children}</Text>
    </View>
  );
}

export default Badge;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Badge/index.scss`:

```scss
.ui-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--rs);
  font-weight: 500;
  line-height: 1;

  &--sm { padding: 4rpx 12rpx; font-size: 22rpx; }
  &--md { padding: 8rpx 20rpx; font-size: 24rpx; }

  &--default { background: var(--bdL); color: var(--fg2); }
  &--primary { background: var(--prBg); color: var(--pr); }
  &--income  { background: var(--incBg); color: var(--inc); }
  &--expense { background: var(--expBg); color: var(--exp); }
  &--warn    { background: var(--warnBg); color: var(--warn); }
  &--info    { background: var(--infoBg); color: var(--info); }

  &__text { font-size: inherit; }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { Badge } from "./Badge";
export type { BadgeVariant } from "./Badge";
```

- [ ] **Step 4: 验证 & Commit**

Run: `cd taro && npm run build:h5 2>&1 | tail -10`

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Badge taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Badge 组件（6 variant）"
```

---

## Task 5.5: StatCard 组件

**Files:**
- Create: `taro/src/components/ui/StatCard/index.tsx`
- Create: `taro/src/components/ui/StatCard/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/StatCard/index.tsx`:

```tsx
/**
 * StatCard — 统计卡片（对齐 PC StatCard）
 * variant: default/income/expense/hero（hero 用主色渐变 + 白字）
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type StatCardVariant = "default" | "income" | "expense" | "hero";

export interface StatCardProps {
  label?: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  variant?: StatCardVariant;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label, value, sub, icon,
  variant = "default", className = "", onClick,
}: StatCardProps) {
  return (
    <View
      className={`ui-stat ui-stat--${variant} ${className}`}
      hoverClass={onClick ? "ui-stat--pressed" : ""}
      hoverStayTime={100}
      onClick={onClick}
    >
      {label ? <Text className="ui-stat__label">{label}</Text> : null}
      {value ? <Text className="ui-stat__value">{value}</Text> : null}
      {sub ? <Text className="ui-stat__sub">{sub}</Text> : null}
      {icon ? <View className="ui-stat__icon">{icon}</View> : null}
    </View>
  );
}

export default StatCard;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/StatCard/index.scss`:

```scss
.ui-stat {
  position: relative;
  background: var(--srfSoft);
  border: 2rpx solid var(--bdL);
  border-radius: var(--rl);
  padding: 32rpx;
  box-shadow: var(--sh1);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  overflow: hidden;
  transition: box-shadow var(--df) var(--ease), transform var(--df) var(--ease);
  &--pressed { box-shadow: var(--sh2); transform: translateY(-2rpx); }

  &__label { font-size: 24rpx; color: var(--fg3); }
  &__value { font-size: 44rpx; font-weight: 700; color: var(--fg); font-family: var(--fm); line-height: 1.2; }
  &__sub { font-size: 22rpx; color: var(--fg3); }
  &__icon { position: absolute; right: 24rpx; top: 24rpx; }

  /* income / expense：语义色点缀（value 着色） */
  &--income .ui-stat__value { color: var(--inc); }
  &--expense .ui-stat__value { color: var(--exp); }

  /* hero：主色渐变背景 + 白字 */
  &--hero {
    background: var(--prGr);
    border-color: transparent;
    box-shadow: var(--sh2);
    .ui-stat__label { color: rgba(255,255,255,0.85); }
    .ui-stat__value { color: #fff; }
    .ui-stat__sub { color: rgba(255,255,255,0.8); }
  }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { StatCard } from "./StatCard";
export type { StatCardVariant } from "./StatCard";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/StatCard taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 StatCard 组件（含 hero 渐变 variant）"
```

---

## Task 6: EmptyState 组件（新版）

**Files:**
- Create: `taro/src/components/ui/EmptyState/index.tsx`
- Create: `taro/src/components/ui/EmptyState/index.scss`

> 注意：现有 `components/EmptyState/` 保留不动（兼容），新版在 `components/ui/EmptyState/`。

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/EmptyState/index.tsx`:

```tsx
/**
 * EmptyState — 空状态占位（对齐 PC EmptyState）
 * variant: default（居中带 action）/compact（小尺寸）/full（整屏）
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "compact" | "full";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  return (
    <View className={`ui-empty ui-empty--${variant} ${className}`}>
      {icon ? <View className="ui-empty__icon">{icon}</View> : null}
      {title ? <Text className="ui-empty__title">{title}</Text> : null}
      {description ? <Text className="ui-empty__desc">{description}</Text> : null}
      {action ? <View className="ui-empty__action">{action}</View> : null}
    </View>
  );
}

export default EmptyState;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/EmptyState/index.scss`:

```scss
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64rpx 40rpx;
  gap: 16rpx;

  &--compact { padding: 32rpx 24rpx; }
  &--full { min-height: 60vh; }

  &__icon { font-size: 80rpx; margin-bottom: 8rpx; }
  &--compact &__icon { font-size: 56rpx; }
  &__title { font-size: 28rpx; color: var(--fg2); font-weight: 500; }
  &__desc { font-size: 24rpx; color: var(--fg3); line-height: 1.5; }
  &__action { margin-top: 16rpx; }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { EmptyState } from "./EmptyState";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/EmptyState taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 ui/EmptyState 组件（default/compact/full）"
```

---

## Task 7: Skeleton 组件

**Files:**
- Create: `taro/src/components/ui/Skeleton/index.tsx`
- Create: `taro/src/components/ui/Skeleton/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Skeleton/index.tsx`:

```tsx
/**
 * Skeleton — 骨架屏（对齐 PC Skeleton + 预设）
 */
import { ReactNode } from "react";
import { View } from "@tarojs/components";
import "./index.scss";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  marginBottom?: string | number;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "32rpx",
  borderRadius = "var(--rs)",
  marginBottom = 0,
  className = "",
}: SkeletonProps) {
  return (
    <View
      className={`ui-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        marginBottom: marginBottom || undefined,
      }}
    />
  );
}

/* 预设组合 */
export function AvatarSkeleton({ size = 80 }: { size?: number }) {
  return <Skeleton width={`${size}rpx`} height={`${size}rpx`} borderRadius="50%" />;
}
export function ButtonSkeleton({ width = "200rpx" }: { width?: string }) {
  return <Skeleton width={width} height="72rpx" />;
}
export function InputSkeleton() {
  return <Skeleton height="80rpx" marginBottom="24rpx" />;
}
export function TextLineSkeleton({ width = "100%" }: { width?: string }) {
  return <Skeleton width={width} height="28rpx" marginBottom="16rpx" />;
}
export function TextParagraphSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <TextLineSkeleton key={i} width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </View>
  );
}
export function CardGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View className="ui-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="ui-skeleton-grid__item">
          <Skeleton height="120rpx" marginBottom="16rpx" />
          <TextLineSkeleton width="50%" />
        </View>
      ))}
    </View>
  );
}
export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="ui-skeleton-stats">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="ui-skeleton-stats__item">
          <Skeleton width="80rpx" height="24rpx" marginBottom="12rpx" />
          <Skeleton width="120rpx" height="40rpx" />
        </View>
      ))}
    </View>
  );
}
export function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="ui-skeleton-row">
          <Skeleton width="80rpx" height="80rpx" borderRadius="50%" />
          <View className="ui-skeleton-row__text">
            <Skeleton width="40%" height="28rpx" marginBottom="12rpx" />
            <Skeleton width="70%" height="24rpx" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default Skeleton;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Skeleton/index.scss`:

```scss
.ui-skeleton {
  background: linear-gradient(
    90deg,
    var(--bdL) 25%,
    var(--srfH) 37%,
    var(--bdL) 63%
  );
  background-size: 400% 100%;
  animation: skeletonShimmer 1.4s ease infinite;
}
.ui-skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}
.ui-skeleton-stats {
  display: flex;
  gap: 16rpx;
  &__item { flex: 1; }
}
.ui-skeleton-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  &__text { flex: 1; }
}
```

- [ ] **Step 3: 追加导出**

```ts
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
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Skeleton taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Skeleton 组件 + 8 个预设"
```

---

## Task 8: Input / SearchInput / NumberInput 组件

**Files:**
- Create: `taro/src/components/ui/Input/index.tsx`
- Create: `taro/src/components/ui/Input/index.scss`

> 关键：onChange 传 `value: string`（非 event），对齐小程序习惯。文档已确认此差异。

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Input/index.tsx`:

```tsx
/**
 * Input / SearchInput / NumberInput — 输入框家族（对齐 PC Input）
 * 适配：原生 input → Taro Input；onChange(e) → onChange(value:string)；
 *       去掉 ref.focus()（小程序不支持命令式 focus）
 */
import { ReactNode, useState } from "react";
import { View, Text, Input as TaroInput } from "@tarojs/components";
import "./index.scss";

export interface BaseInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: ReactNode;
  error?: string;
  allowClear?: boolean;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  wrapperClassName?: string;
}

export interface InputProps extends BaseInputProps {
  type?: "text" | "number" | "digit" | "password" | "nickname";
  password?: boolean;
  onFocus?: () => void;
  onBlur?: (value: string) => void;
}

export function Input({
  value,
  onChange,
  placeholder,
  label,
  error,
  allowClear = false,
  icon,
  required = false,
  disabled = false,
  maxLength,
  className = "",
  wrapperClassName = "",
  type = "text",
  password = false,
  onFocus,
  onBlur,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const showClear = allowClear && !!value && !disabled;

  return (
    <View className={`ui-input-wrap ${error ? "ui-input-wrap--error" : ""} ${wrapperClassName}`}>
      {label ? (
        <Text className="ui-input__label">
          {required ? <Text className="ui-input__required">*</Text> : null}
          {label}
        </Text>
      ) : null}
      <View className={`ui-input ${focused ? "ui-input--focus" : ""} ${disabled ? "ui-input--disabled" : ""} ${className}`}>
        {icon ? <View className="ui-input__icon">{icon}</View> : null}
        <TaroInput
          className="ui-input__field"
          type={type as any}
          password={password}
          value={value}
          placeholder={placeholder}
          placeholderClass="ui-input__placeholder"
          maxlength={maxLength}
          disabled={disabled}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e.detail.value); }}
          onInput={(e) => onChange?.(e.detail.value)}
        />
        {showClear ? (
          <View className="ui-input__clear" onClick={() => onChange?.("")}>
            <Text className="ui-input__clear-icon">×</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text className="ui-input__error">{error}</Text> : null}
    </View>
  );
}

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "搜索", className = "" }: SearchInputProps) {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Text className="ui-input__search-icon">🔍</Text>}
      allowClear
      className={`ui-input--search ${className}`}
      wrapperClassName="ui-input-wrap--search"
    />
  );
}

export interface NumberInputProps extends BaseInputProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function NumberInput({
  prefix,
  suffix,
  wrapperClassName = "",
  ...rest
}: NumberInputProps) {
  /* 用 row 包装：Input 在左占主宽，suffix 在右侧（如"元"） */
  return (
    <View className={`ui-input-wrap ui-input-wrap--number ${wrapperClassName}`}>
      <Input
        {...rest}
        type="digit"
        icon={prefix ? <Text className="ui-input__prefix">{prefix}</Text> : rest.icon}
      />
      {suffix ? <Text className="ui-input__suffix">{suffix}</Text> : null}
    </View>
  );
}
```

> 说明：`defaultValue` 从解构中移除（未使用，避免 TS noUnusedLocals 报错）。Input 不接受 children。NumberInput 的 suffix 通过 row 包装渲染在 Input 右侧。

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Input/index.scss`:

```scss
.ui-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  &--error .ui-input { border-color: var(--exp); }
  /* number：row 包装，Input 左 + suffix 右 */
  &--number {
    flex-direction: row;
    align-items: flex-end;
    gap: 12rpx;
    .ui-input-wrap { /* 内部 label 容器 */ }
  }
  /* search：柔色背景、无边框 */
  &--search .ui-input {
    background: var(--srfSoft);
    border-color: transparent;
  }
}

.ui-input__label {
  font-size: 26rpx;
  color: var(--fg2);
  font-weight: 500;
}
.ui-input__required { color: var(--exp); margin-right: 4rpx; }

.ui-input {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 80rpx;
  padding: 0 24rpx;
  background: var(--srf);
  border: 2rpx solid var(--bd);
  border-radius: var(--rs);
  transition: border-color var(--df) var(--ease);

  &--focus { border-color: var(--pr); }
  &--disabled { background: var(--bdL); opacity: 0.7; }

  &__icon { display: flex; align-items: center; color: var(--fg3); }
  &__field {
    flex: 1;
    font-size: 28rpx;
    color: var(--fg);
    min-height: 40rpx;
  }
  &__placeholder { color: var(--fg3); font-size: 28rpx; }
  &__clear {
    width: 36rpx; height: 36rpx;
    display: flex; align-items: center; justify-content: center;
    background: var(--bd);
    border-radius: 50%;
  }
  &__clear-icon { color: #fff; font-size: 24rpx; line-height: 1; }
  &__search-icon { font-size: 28rpx; }
  &__prefix { font-size: 28rpx; color: var(--fg2); }
  &__error { font-size: 24rpx; color: var(--exp); }
}

/* number 包装下：Input 占满剩余宽度，suffix 行内右侧 */
.ui-input-wrap--number {
  .ui-input { flex: 1; }
}
.ui-input__suffix {
  font-size: 28rpx;
  color: var(--fg3);
  padding-bottom: 20rpx;
  white-space: nowrap;
}
```

> 说明：`.ui-input-wrap--number` 把 wrap 改成 row（覆盖默认 column），内部 `.ui-input` 设 `flex:1` 占满，`.ui-input__suffix` 作为行内兄弟显示在右侧。无 absolute 定位，避免错位。

- [ ] **Step 3: 追加导出**

```ts
export { Input, SearchInput, NumberInput } from "./Input";
export type { InputProps, SearchInputProps, NumberInputProps } from "./Input";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Input taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Input/SearchInput/NumberInput（onChange 传 value）"
```

---

## Task 9: Textarea 组件

**Files:**
- Create: `taro/src/components/ui/Textarea/index.tsx`
- Create: `taro/src/components/ui/Textarea/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Textarea/index.tsx`:

```tsx
/**
 * Textarea — 文本域（对齐 PC Textarea）
 * 适配：onInput 取 e.detail.value；autoResize 用 Taro autoHeight
 */
import { ReactNode } from "react";
import { View, Text, Textarea as TaroTextarea } from "@tarojs/components";
import "./index.scss";

export interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: ReactNode;
  error?: string;
  allowClear?: boolean;
  showCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Textarea({
  value = "",
  onChange,
  placeholder,
  label,
  error,
  allowClear = false,
  showCount = false,
  maxLength,
  autoResize = true,
  required = false,
  disabled = false,
  className = "",
}: TextareaProps) {
  const showClear = allowClear && !!value && !disabled;
  return (
    <View className={`ui-textarea-wrap ${error ? "ui-textarea-wrap--error" : ""} ${className}`}>
      {label ? (
        <Text className="ui-textarea__label">
          {required ? <Text className="ui-textarea__required">*</Text> : null}
          {label}
        </Text>
      ) : null}
      <View className="ui-textarea">
        <TaroTextarea
          className="ui-textarea__field"
          value={value}
          placeholder={placeholder}
          placeholderClass="ui-textarea__placeholder"
          maxlength={maxLength || -1}
          disabled={disabled}
          autoHeight={autoResize}
          onInput={(e) => onChange?.(e.detail.value)}
        />
        {(showClear || (showCount && maxLength)) ? (
          <View className="ui-textarea__footer">
            {showCount && maxLength ? (
              <Text className="ui-textarea__count">{value.length}/{maxLength}</Text>
            ) : <Text />}
            {showClear ? (
              <Text className="ui-textarea__clear" onClick={() => onChange?.("")}>清空</Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {error ? <Text className="ui-textarea__error">{error}</Text> : null}
    </View>
  );
}

export default Textarea;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Textarea/index.scss`:

```scss
.ui-textarea-wrap {
  display: flex; flex-direction: column; gap: 12rpx;
  &--error .ui-textarea { border-color: var(--exp); }
}
.ui-textarea__label { font-size: 26rpx; color: var(--fg2); font-weight: 500; }
.ui-textarea__required { color: var(--exp); margin-right: 4rpx; }
.ui-textarea {
  padding: 20rpx 24rpx;
  background: var(--srf);
  border: 2rpx solid var(--bd);
  border-radius: var(--rs);
}
.ui-textarea__field {
  width: 100%;
  font-size: 28rpx;
  color: var(--fg);
  line-height: 1.5;
  min-height: 80rpx;
}
.ui-textarea__placeholder { color: var(--fg3); }
.ui-textarea__footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12rpx;
}
.ui-textarea__count { font-size: 22rpx; color: var(--fg3); }
.ui-textarea__clear { font-size: 24rpx; color: var(--pr); }
.ui-textarea__error { font-size: 24rpx; color: var(--exp); }
```

- [ ] **Step 3: 追加导出**

```ts
export { Textarea } from "./Textarea";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Textarea taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Textarea 组件（autoResize/字数统计/清空）"
```

---

## Task 10: SegControl 组件

**Files:**
- Create: `taro/src/components/ui/SegControl/index.tsx`
- Create: `taro/src/components/ui/SegControl/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/SegControl/index.tsx`:

```tsx
/**
 * SegControl — 分段控制器（对齐 PC SegControl，泛型 <T extends string>）
 * size: sm/md；variant: default/pill
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface SegOption<T extends string> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
}

export interface SegControlProps<T extends string> {
  options: SegOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  size?: "sm" | "md";
  variant?: "default" | "pill";
  className?: string;
}

export function SegControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  variant = "default",
  className = "",
}: SegControlProps<T>) {
  return (
    <View className={`ui-seg ui-seg--${size} ui-seg--${variant} ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <View
            key={opt.value}
            className={`ui-seg__item ${active ? "ui-seg__item--active" : ""}`}
            hoverClass={active ? "" : "ui-seg__item--pressed"}
            hoverStayTime={80}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.icon ? <View className="ui-seg__icon">{opt.icon}</View> : null}
            {opt.label != null ? <Text className="ui-seg__label">{opt.label}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export default SegControl;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/SegControl/index.scss`:

```scss
.ui-seg {
  display: inline-flex;
  background: var(--bdL);
  border-radius: var(--rs);
  padding: 4rpx;
  gap: 4rpx;

  &--sm { .ui-seg__item { height: 52rpx; font-size: 24rpx; padding: 0 20rpx; } }
  &--md { .ui-seg__item { height: 64rpx; font-size: 26rpx; padding: 0 28rpx; } }

  &--pill {
    background: transparent;
    gap: 16rpx;
    padding: 0;
    .ui-seg__item {
      border-radius: 999rpx;
      &--active { background: var(--prBg); color: var(--pr); }
    }
  }

  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    border-radius: calc(var(--rs) - 4rpx);
    color: var(--fg2);
    transition: all var(--df) var(--ease);

    &--active {
      background: var(--srf);
      color: var(--fg);
      font-weight: 600;
      box-shadow: var(--sh1);
    }
    &--pressed { opacity: 0.6; }
  }
  &__icon { display: flex; align-items: center; }
  &__label { font-size: inherit; }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { SegControl } from "./SegControl";
export type { SegOption, SegControlProps } from "./SegControl";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/SegControl taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 SegControl 分段控制器（泛型 + pill variant）"
```

---

## Task 11: Switch 组件

**Files:**
- Create: `taro/src/components/ui/Switch/index.tsx`
- Create: `taro/src/components/ui/Switch/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Switch/index.tsx`:

```tsx
/**
 * Switch — 开关（小程序新增，对齐视觉）
 */
import { View } from "@tarojs/components";
import "./index.scss";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked = false, onChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <View
      className={`ui-switch ${checked ? "ui-switch--on" : ""} ${disabled ? "ui-switch--disabled" : ""} ${className}`}
      onClick={() => {
        if (disabled) return;
        onChange?.(!checked);
      }}
    >
      <View className="ui-switch__thumb" />
    </View>
  );
}

export default Switch;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Switch/index.scss`:

```scss
.ui-switch {
  width: 88rpx; height: 52rpx;
  border-radius: 999rpx;
  background: var(--bd);
  position: relative;
  transition: background var(--df) var(--ease);
  flex-shrink: 0;

  &--on { background: var(--pr); }
  &--disabled { opacity: 0.5; }

  &__thumb {
    position: absolute;
    top: 4rpx; left: 4rpx;
    width: 44rpx; height: 44rpx;
    border-radius: 50%;
    background: #fff;
    box-shadow: var(--sh1);
    transition: transform var(--df) var(--ease);
  }
  &--on &__thumb { transform: translateX(36rpx); }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { Switch } from "./Switch";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Switch taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Switch 开关组件"
```

---

## Task 12: GlobalModal 组件 ⭐（核心）

**Files:**
- Create: `taro/src/components/ui/GlobalModal/index.tsx`
- Create: `taro/src/components/ui/GlobalModal/index.scss`
- Create: `taro/src/components/ui/GlobalModal/useModalZIndex.ts`

- [ ] **Step 1: 创建 z-index hook**

Create `taro/src/components/ui/GlobalModal/useModalZIndex.ts`:

```ts
/**
 * useModalZIndex — 弹窗动态 z-index（对齐 PC modalZIndex）
 * 全局 openCount 计数，实际 z = base + openCount，解决多层叠加。
 */
import { useEffect, useState } from "react";

const MODAL_BASE: Record<string, number> = {
  detail: 1000,
  modal: 1500,
  critical: 2500,
};

let openCount = 0;

export function useModalZIndex(open: boolean, type: "detail" | "modal" | "critical") {
  const [z, setZ] = useState(MODAL_BASE[type]);
  useEffect(() => {
    if (open) {
      openCount += 1;
      setZ(MODAL_BASE[type] + openCount);
      return () => {
        openCount = Math.max(0, openCount - 1);
      };
    }
  }, [open, type]);
  return z;
}
```

- [ ] **Step 2: 创建组件**

Create `taro/src/components/ui/GlobalModal/index.tsx`:

```tsx
/**
 * GlobalModal — 模态弹窗（对齐 PC GlobalModal，三型）
 * - confirm: 居中卡片 + scaleIn（删除/危险确认）
 * - detail:  底部 sheet + slideUp（详情展示）
 * - modal:   底部 sheet + slideUp（表单/编辑）
 * 适配：ESC 关闭 → 蒙层点击关闭 + 显式关闭按钮
 */
import { ReactNode } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useModalZIndex } from "./useModalZIndex";
import "./index.scss";

export type GlobalModalType = "confirm" | "detail" | "modal";

export interface GlobalModalProps {
  open: boolean;
  onClose: () => void;
  type?: GlobalModalType;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  closable?: boolean;
  closeOnMask?: boolean;
  className?: string;
  bodyClassName?: string;
  /* confirm 专用 */
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
}

export function GlobalModal({
  open,
  onClose,
  type = "modal",
  title,
  description,
  children,
  footer,
  size = "md",
  closable = true,
  closeOnMask = true,
  className = "",
  bodyClassName = "",
  confirmText = "确认",
  cancelText = "取消",
  confirmDanger = false,
  loading = false,
  onConfirm,
}: GlobalModalProps) {
  const zType = type === "confirm" ? "critical" : type;
  const z = useModalZIndex(open, zType);

  if (!open) return null;

  const isConfirm = type === "confirm";

  const handleMaskClick = () => {
    if (closeOnMask) onClose();
  };

  return (
    <View
      className={`ui-modal ui-modal--${type} ${className}`}
      style={{ zIndex: z }}
      catchMove
    >
      <View className="ui-modal__mask" onClick={handleMaskClick} />

      {isConfirm ? (
        /* confirm: 居中卡片 */
        <View className={`ui-modal__dialog ui-modal__dialog--center ui-modal__dialog--${size}`}>
          <View className="ui-modal__confirm">
            {title ? <Text className="ui-modal__confirm-title">{title}</Text> : null}
            {description ? <Text className="ui-modal__confirm-desc">{description}</Text> : null}
            {children}
            <View className="ui-modal__confirm-actions">
              <View
                className="ui-modal__btn ui-modal__btn--cancel"
                hoverClass="ui-modal__btn--pressed"
                onClick={onClose}
              >
                <Text>{cancelText}</Text>
              </View>
              <View
                className={`ui-modal__btn ui-modal__btn--ok ${confirmDanger ? "ui-modal__btn--danger" : ""} ${loading ? "ui-modal__btn--loading" : ""}`}
                hoverClass="ui-modal__btn--pressed"
                onClick={() => { if (!loading) onConfirm?.(); }}
              >
                {loading ? (
                  <View className="ui-modal__spinner" />
                ) : (
                  <Text>{confirmText}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* detail / modal: 底部 sheet */
        <View className={`ui-modal__dialog ui-modal__dialog--sheet ui-modal__dialog--${size}`}>
          <View className="ui-modal__sheet">
            {title || closable ? (
              <View className="ui-modal__header">
                {title ? <Text className="ui-modal__title">{title}</Text> : <Text />}
                {closable ? (
                  <View className="ui-modal__close" onClick={onClose}>
                    <Text className="ui-modal__close-icon">×</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            {description ? <Text className="ui-modal__desc">{description}</Text> : null}
            <ScrollView scrollY className={`ui-modal__body ${bodyClassName}`}>
              {children}
            </ScrollView>
            {footer ? <View className="ui-modal__footer">{footer}</View> : null}
          </View>
        </View>
      )}
    </View>
  );
}

export default GlobalModal;
```

- [ ] **Step 3: 创建样式**

Create `taro/src/components/ui/GlobalModal/index.scss`:

```scss
.ui-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &__mask {
    position: absolute;
    inset: 0;
    background: var(--ov);
    animation: fadeIn var(--df) var(--ease);
  }

  /* dialog 容器 */
  &__dialog {
    position: relative;
    animation: scaleIn var(--dn) var(--sp);

    /* confirm 居中 */
    &--center {
      width: 600rpx;
      max-width: 86%;
      &.ui-modal__dialog--sm { width: 520rpx; }
      &.ui-modal__dialog--lg { width: 680rpx; }
    }
    /* detail/modal 底部 sheet */
    &--sheet {
      align-self: flex-end;
      width: 100%;
      max-height: 88vh;
      animation: slideUp var(--dn) var(--ease);
    }
  }

  /* confirm 卡片 */
  &__confirm {
    background: var(--srf);
    border-radius: var(--rm);
    padding: 48rpx 40rpx 32rpx;
    box-shadow: var(--sh3);
  }
  &__confirm-title { display: block; font-size: 32rpx; font-weight: 600; color: var(--fg); text-align: center; }
  &__confirm-desc { display: block; font-size: 26rpx; color: var(--fg2); text-align: center; margin-top: 16rpx; line-height: 1.5; }
  &__confirm-actions { display: flex; gap: 20rpx; margin-top: 40rpx; }

  &__btn {
    flex: 1;
    height: 76rpx;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--rs);
    font-size: 28rpx;
    transition: opacity var(--df);
    &--cancel { background: var(--bdL); color: var(--fg2); }
    &--ok { background: var(--pr); color: #fff; }
    &--danger { background: var(--exp); }
    &--pressed { opacity: 0.8; }
    &--loading { opacity: 0.7; }
  }
  &__spinner {
    width: 32rpx; height: 32rpx;
    border: 3rpx solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* sheet */
  &__sheet {
    background: var(--srf);
    border-radius: var(--rl) var(--rl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: var(--sh4);
    max-height: 88vh;
    display: flex;
    flex-direction: column;
  }
  &__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 32rpx 32rpx 20rpx;
    border-bottom: 2rpx solid var(--bdL);
  }
  &__title { font-size: 32rpx; font-weight: 600; color: var(--fg); }
  &__close {
    width: 56rpx; height: 56rpx;
    display: flex; align-items: center; justify-content: center;
    background: var(--bdL); border-radius: 50%;
  }
  &__close-icon { font-size: 36rpx; color: var(--fg2); line-height: 1; }
  &__desc { display: block; padding: 20rpx 32rpx 0; font-size: 26rpx; color: var(--fg3); }
  &__body {
    flex: 1;
    padding: 24rpx 32rpx;
    overflow: auto;
  }
  &__footer {
    padding: 20rpx 32rpx 32rpx;
    border-top: 2rpx solid var(--bdL);
    display: flex; gap: 20rpx;
  }
}
```

- [ ] **Step 4: 追加导出**

```ts
export { GlobalModal } from "./GlobalModal";
export type { GlobalModalType, GlobalModalProps } from "./GlobalModal";
```

- [ ] **Step 5: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/GlobalModal taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 GlobalModal（confirm居中 + detail/modal底部sheet + 动态z-index）"
```

---

## Task 13: Drawer 组件

**Files:**
- Create: `taro/src/components/ui/Drawer/index.tsx`
- Create: `taro/src/components/ui/Drawer/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Drawer/index.tsx`:

```tsx
/**
 * Drawer — 底部半屏面板（对齐 PC Drawer，PC 右侧抽屉 → 小程序底部 sheet）
 * 职责：可滚动长内容操作面板（筛选/批量/向导），区别于 GlobalModal 的模态内容展示。
 */
import { ReactNode } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useModalZIndex } from "../GlobalModal/useModalZIndex";
import "./index.scss";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closable?: boolean;
  closeOnMask?: boolean;
  className?: string;
  height?: string | number | "auto";
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  closable = true,
  closeOnMask = true,
  className = "",
  height = "auto",
}: DrawerProps) {
  const z = useModalZIndex(open, "modal");
  if (!open) return null;

  return (
    <View className={`ui-drawer ${className}`} style={{ zIndex: z }} catchMove>
      <View className="ui-drawer__mask" onClick={() => closeOnMask && onClose()} />
      <View
        className="ui-drawer__panel"
        style={height !== "auto" ? { height: typeof height === "number" ? `${height}rpx` : height } : undefined}
      >
        <View className="ui-drawer__handle" />
        {title || closable ? (
          <View className="ui-drawer__header">
            {title ? <Text className="ui-drawer__title">{title}</Text> : <Text />}
            {closable ? (
              <View className="ui-drawer__close" onClick={onClose}>
                <Text className="ui-drawer__close-icon">×</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <ScrollView scrollY className="ui-drawer__body">{children}</ScrollView>
        {footer ? <View className="ui-drawer__footer">{footer}</View> : null}
      </View>
    </View>
  );
}

export default Drawer;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Drawer/index.scss`:

```scss
.ui-drawer {
  position: fixed; inset: 0;
  display: flex; align-items: flex-end;
  &__mask {
    position: absolute; inset: 0;
    background: var(--ov);
    animation: fadeIn var(--df) var(--ease);
  }
  &__panel {
    position: relative;
    width: 100%;
    max-height: 90vh;
    background: var(--srf);
    border-radius: var(--rl) var(--rl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: var(--sh4);
    animation: slideUp var(--dn) var(--ease);
    display: flex; flex-direction: column;
  }
  &__handle {
    width: 64rpx; height: 8rpx;
    background: var(--bd);
    border-radius: 999rpx;
    margin: 16rpx auto 0;
  }
  &__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20rpx 32rpx;
    border-bottom: 2rpx solid var(--bdL);
  }
  &__title { font-size: 30rpx; font-weight: 600; color: var(--fg); }
  &__close {
    width: 56rpx; height: 56rpx;
    display: flex; align-items: center; justify-content: center;
    background: var(--bdL); border-radius: 50%;
  }
  &__close-icon { font-size: 36rpx; color: var(--fg2); line-height: 1; }
  &__body { flex: 1; padding: 24rpx 32rpx; overflow: auto; }
  &__footer { padding: 20rpx 32rpx 32rpx; border-top: 2rpx solid var(--bdL); }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { Drawer } from "./Drawer";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Drawer taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Drawer 底部半屏面板"
```

---

## Task 14: List / ListItem 组件

**Files:**
- Create: `taro/src/components/ui/List/index.tsx`
- Create: `taro/src/components/ui/List/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/List/index.tsx`:

```tsx
/**
 * List / ListItem — 通用列表（小程序新增，PC 用表格/卡片行）
 * 用途：设置菜单、交易列表、成员列表
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface ListItemProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  onClick?: () => void;
  showArrow?: boolean;
  divider?: boolean;
  className?: string;
}

export function ListItem({
  icon, title, description, extra, onClick,
  showArrow = false, divider = true, className = "",
}: ListItemProps) {
  const clickable = !!onClick;
  return (
    <View
      className={`ui-list-item ${divider ? "ui-list-item--divider" : ""} ${clickable ? "ui-list-item--clickable" : ""} ${className}`}
      hoverClass={clickable ? "ui-list-item--pressed" : ""}
      hoverStayTime={80}
      onClick={onClick}
    >
      {icon ? <View className="ui-list-item__icon">{icon}</View> : null}
      <View className="ui-list-item__main">
        {title ? <Text className="ui-list-item__title">{title}</Text> : null}
        {description ? <Text className="ui-list-item__desc">{description}</Text> : null}
      </View>
      {extra ? <View className="ui-list-item__extra">{extra}</View> : null}
      {showArrow ? <Text className="ui-list-item__arrow">›</Text> : null}
    </View>
  );
}

export interface ListProps {
  children?: ReactNode;
  inset?: boolean;
  className?: string;
}

export function List({ children, inset = false, className = "" }: ListProps) {
  return (
    <View className={`ui-list ${inset ? "ui-list--inset" : ""} ${className}`}>
      {children}
    </View>
  );
}
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/List/index.scss`:

```scss
.ui-list {
  background: var(--srf);
  &--inset {
    border-radius: var(--rm);
    overflow: hidden;
    border: 2rpx solid var(--bdL);
  }
}
.ui-list-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  min-height: 96rpx;
  box-sizing: border-box;

  &--divider { border-bottom: 2rpx solid var(--bdL); }
  &:last-child { border-bottom: 0; }

  &--clickable { transition: background var(--df); }
  &--pressed { background: var(--srfH); }

  &__icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  &__main { flex: 1; display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
  &__title { font-size: 28rpx; color: var(--fg); }
  &__desc { font-size: 24rpx; color: var(--fg3); }
  &__extra { display: flex; align-items: center; font-size: 26rpx; color: var(--fg3); }
  &__arrow { font-size: 36rpx; color: var(--fg3); line-height: 1; margin-left: 4rpx; }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { List, ListItem } from "./List";
export type { ListItemProps, ListProps } from "./List";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/List taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 List/ListItem 通用列表"
```

---

## Task 15: RankList 组件

**Files:**
- Create: `taro/src/components/ui/RankList/index.tsx`
- Create: `taro/src/components/ui/RankList/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/RankList/index.tsx`:

```tsx
/**
 * RankRow / ReportRankList — 排行/进度行（对齐 PC RankList）
 * 用途：Statistics、Budgets、AnnualReport
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

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
          <View className="ui-rank-row__bar-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
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

export function ReportRankList({ items, emptyText = "暂无数据" }: { items: ReportRankItem[]; emptyText?: string }) {
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
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/RankList/index.scss`:

```scss
.ui-rank-row {
  padding: 20rpx 0;
  &--clickable { transition: background var(--df); }
  &--pressed { background: var(--srfH); }
  &__top { display: flex; align-items: center; gap: 16rpx; }
  &__icon { flex-shrink: 0; }
  &__label { flex: 1; font-size: 28rpx; color: var(--fg); }
  &__amount-group { display: flex; flex-direction: column; align-items: flex-end; gap: 2rpx; }
  &__total { font-size: 22rpx; color: var(--fg3); }
  &__amount { font-size: 28rpx; font-weight: 600; color: var(--fg); font-family: var(--fm); }

  &__bar {
    height: 12rpx;
    background: var(--bdL);
    border-radius: 999rpx;
    margin-top: 16rpx;
    overflow: hidden;
  }
  &__bar-fill {
    height: 100%;
    background: var(--pr);
    border-radius: 999rpx;
    transition: width var(--ds) var(--ease);
  }
  &--income &__bar-fill { background: var(--inc); }
  &--expense &__bar-fill { background: var(--exp); }
  &--warn &__bar-fill { background: var(--warn); }
  &--danger &__bar-fill { background: var(--exp); }

  &__meta { display: block; font-size: 22rpx; color: var(--fg3); margin-top: 8rpx; }
}

.ui-rank-list {
  &__row {
    display: flex; align-items: center; gap: 16rpx;
    padding: 20rpx 0;
    border-bottom: 2rpx solid var(--bdL);
  }
  &__icon { flex-shrink: 0; }
  &__main { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
  &__label { font-size: 28rpx; color: var(--fg); }
  &__tag { font-size: 20rpx; color: var(--fg3); }
  &__amount { font-size: 28rpx; font-weight: 600; font-family: var(--fm); }
  &__amount--income { color: var(--inc); }
  &__amount--expense { color: var(--exp); }
  &__amount--neutral { color: var(--fg); }
}
.ui-rank-empty { padding: 48rpx 0; text-align: center; }
.ui-rank-empty__text { font-size: 26rpx; color: var(--fg3); }
```

- [ ] **Step 3: 追加导出**

```ts
export { RankRow, ReportRankList } from "./RankList";
export type { RankRowItem, ReportRankItem, RankStatus, RankType } from "./RankList";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/RankList taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 RankRow/ReportRankList 排行组件"
```

---

## Task 16: Pagination 组件

**Files:**
- Create: `taro/src/components/ui/Pagination/index.tsx`
- Create: `taro/src/components/ui/Pagination/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/Pagination/index.tsx`:

```tsx
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
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/Pagination/index.scss`:

```scss
.ui-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 0;
  gap: 16rpx;
  &__info { font-size: 24rpx; color: var(--fg3); flex: 1; }
  &__info-placeholder { flex: 1; }
  &__btns { display: flex; gap: 16rpx; }
  &__btn {
    height: 60rpx;
    padding: 0 24rpx;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--rs);
    background: var(--srf);
    border: 2rpx solid var(--bd);
    font-size: 24rpx; color: var(--fg2);
    transition: opacity var(--df);
    &--pressed { opacity: 0.7; }
    &--disabled { opacity: 0.4; pointer-events: none; }
  }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { Pagination } from "./Pagination";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/Pagination taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 Pagination 分页组件"
```

---

## Task 17: DropdownSelect 组件（底部 sheet 选择器）

**Files:**
- Create: `taro/src/components/ui/DropdownSelect/index.tsx`
- Create: `taro/src/components/ui/DropdownSelect/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/DropdownSelect/index.tsx`:

```tsx
/**
 * DropdownSelect — 自定义下拉选择（对齐 PC DropdownSelect）
 * 适配：PC 绝对定位浮层 + document.mousedown 关闭 → 底部 sheet + 蒙层点击关闭
 * 触发器是带 chevron 的卡片行，点击弹出底部选项 sheet（可搜索）。
 */
import { ReactNode, useMemo, useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { useModalZIndex } from "../GlobalModal/useModalZIndex";
import { SearchInput } from "../Input";
import "./index.scss";

export interface DropdownOption {
  key: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

export interface DropdownSelectProps {
  options: DropdownOption[];
  value?: string | null;
  onChange?: (key: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  label?: ReactNode;
  required?: boolean;
  className?: string;
}

export function DropdownSelect({
  options, value, onChange, placeholder = "请选择",
  allowClear = false, showSearch = false, searchPlaceholder = "搜索",
  label, required = false, className = "",
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const z = useModalZIndex(open, "modal");

  const selected = options.find((o) => o.key === value);

  const filtered = useMemo(() => {
    if (!keyword) return options;
    return options.filter((o) => o.label.includes(keyword));
  }, [options, keyword]);

  const handleSelect = (key: string) => {
    onChange?.(key);
    setOpen(false);
    setKeyword("");
  };

  return (
    <View className={`ui-dropdown ${className}`}>
      {label ? (
        <Text className="ui-dropdown__label">
          {required ? <Text className="ui-dropdown__required">*</Text> : null}
          {label}
        </Text>
      ) : null}
      <View
        className={`ui-dropdown__trigger ${!selected ? "ui-dropdown__trigger--placeholder" : ""}`}
        hoverClass="ui-dropdown__trigger--pressed"
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            {selected.icon ? <View className="ui-dropdown__trigger-icon">{selected.icon}</View> : null}
            <Text className="ui-dropdown__trigger-text">{selected.label}</Text>
          </>
        ) : (
          <Text className="ui-dropdown__trigger-text">{placeholder}</Text>
        )}
        <Text className="ui-dropdown__chevron">▾</Text>
      </View>

      {open ? (
        <View className="ui-dropdown__sheet-wrap" style={{ zIndex: z }} catchMove>
          <View className="ui-dropdown__mask" onClick={() => { setOpen(false); setKeyword(""); }} />
          <View className="ui-dropdown__sheet">
            <View className="ui-dropdown__sheet-header">
              <Text className="ui-dropdown__sheet-title">{placeholder}</Text>
              <View className="ui-dropdown__sheet-close" onClick={() => { setOpen(false); setKeyword(""); }}>
                <Text className="ui-dropdown__close-icon">×</Text>
              </View>
            </View>
            {showSearch ? (
              <View className="ui-dropdown__search">
                <SearchInput value={keyword} onChange={setKeyword} placeholder={searchPlaceholder} />
              </View>
            ) : null}
            <ScrollView scrollY className="ui-dropdown__options">
              {allowClear ? (
                <View
                  className={`ui-dropdown__option ${!value ? "ui-dropdown__option--active" : ""}`}
                  onClick={() => handleSelect("")}
                >
                  <Text className="ui-dropdown__option-label ui-dropdown__option-label--muted">不限</Text>
                </View>
              ) : null}
              {filtered.length === 0 ? (
                <View className="ui-dropdown__empty"><Text>无匹配项</Text></View>
              ) : (
                filtered.map((opt) => (
                  <View
                    key={opt.key}
                    className={`ui-dropdown__option ${opt.key === value ? "ui-dropdown__option--active" : ""}`}
                    onClick={() => handleSelect(opt.key)}
                  >
                    {opt.icon ? <View className="ui-dropdown__option-icon">{opt.icon}</View> : null}
                    <Text className="ui-dropdown__option-label">{opt.label}</Text>
                    {opt.key === value ? <Text className="ui-dropdown__check">✓</Text> : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default DropdownSelect;
```

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/DropdownSelect/index.scss`:

```scss
.ui-dropdown {
  &__label { display: block; font-size: 26rpx; color: var(--fg2); font-weight: 500; margin-bottom: 12rpx; }
  &__required { color: var(--exp); margin-right: 4rpx; }

  &__trigger {
    display: flex; align-items: center; gap: 12rpx;
    height: 80rpx; padding: 0 24rpx;
    background: var(--srf);
    border: 2rpx solid var(--bd);
    border-radius: var(--rs);
    transition: border-color var(--df);
    &--pressed { border-color: var(--pr); }
    &--placeholder .ui-dropdown__trigger-text { color: var(--fg3); }
  }
  &__trigger-icon { display: flex; align-items: center; }
  &__trigger-text { flex: 1; font-size: 28rpx; color: var(--fg); }
  &__chevron { font-size: 24rpx; color: var(--fg3); }

  /* sheet */
  &__sheet-wrap { position: fixed; inset: 0; display: flex; align-items: flex-end; }
  &__mask { position: absolute; inset: 0; background: var(--ov); animation: fadeIn var(--df) var(--ease); }
  &__sheet {
    position: relative; width: 100%;
    background: var(--srf);
    border-radius: var(--rl) var(--rl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: var(--sh4);
    max-height: 80vh;
    display: flex; flex-direction: column;
    animation: slideUp var(--dn) var(--ease);
  }
  &__sheet-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 28rpx 32rpx 20rpx;
  }
  &__sheet-title { font-size: 30rpx; font-weight: 600; color: var(--fg); }
  &__sheet-close { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; background: var(--bdL); border-radius: 50%; }
  &__close-icon { font-size: 36rpx; color: var(--fg2); line-height: 1; }
  &__search { padding: 0 32rpx 16rpx; }

  &__options { flex: 1; padding: 8rpx 0; max-height: 60vh; }
  &__option {
    display: flex; align-items: center; gap: 16rpx;
    padding: 24rpx 32rpx;
    transition: background var(--df);
    &--active { background: var(--prBg); }
  }
  &__option-icon { display: flex; align-items: center; }
  &__option-label { flex: 1; font-size: 28rpx; color: var(--fg); }
  &__option-label--muted { color: var(--fg3); }
  &__check { font-size: 28rpx; color: var(--pr); }
  &__empty { padding: 60rpx 0; text-align: center; }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { DropdownSelect } from "./DropdownSelect";
export type { DropdownOption } from "./DropdownSelect";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/DropdownSelect taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 DropdownSelect 底部 sheet 选择器（含搜索）"
```

---

## Task 18: IconGrid 组件

**Files:**
- Create: `taro/src/components/ui/IconGrid/index.tsx`
- Create: `taro/src/components/ui/IconGrid/index.scss`

- [ ] **Step 1: 创建组件**

Create `taro/src/components/ui/IconGrid/index.tsx`:

```tsx
/**
 * IconGrid — 图标网格选择器（对齐 PC IconGrid）
 * 适配：document.createElement('input') 选文件 → Taro.chooseImage；
 *       File → { tempFilePath, name, size }
 */
import { ReactNode } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export interface IconGridOption {
  value: string;
  icon: ReactNode;
  label?: string;
  isImage?: boolean;
}

export interface CustomIconItem {
  id: string;
  icon_url: string;
  icon_type: "category" | "book";
}

export interface IconGridProps {
  options: IconGridOption[];
  value?: string;
  onChange?: (value: string) => void;
  customIcons?: CustomIconItem[];
  onUpload?: (
    file: { tempFilePath: string; name?: string; size?: number },
    iconType: "category" | "book"
  ) => Promise<void>;
  onDelete?: (iconId: string) => Promise<void>;
  iconType?: "category" | "book";
  columns?: number;
  className?: string;
}

export function IconGrid({
  options, value, onChange,
  customIcons = [], onUpload, onDelete,
  iconType = "category", columns = 5, className = "",
}: IconGridProps) {
  const handleUpload = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sourceType: ["album", "camera"] });
      const file = res.tempFiles?.[0];
      if (!file) return;
      await onUpload?.(
        { tempFilePath: file.path, name: "icon", size: file.size },
        iconType
      );
    } catch (e) {
      Taro.showToast({ title: "选择失败", icon: "none" });
    }
  };

  const colStyle = { gridTemplateColumns: `repeat(${columns}, 1fr)` } as React.CSSProperties;

  return (
    <View className={`ui-icon-grid ${className}`}>
      <View className="ui-icon-grid__section" style={colStyle}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <View
              key={opt.value}
              className={`ui-icon-grid__item ${active ? "ui-icon-grid__item--active" : ""}`}
              onClick={() => onChange?.(opt.value)}
            >
              {opt.isImage ? (
                <Image className="ui-icon-grid__img" src={String(opt.icon)} mode="aspectFit" />
              ) : (
                <Text className="ui-icon-grid__emoji">{opt.icon}</Text>
              )}
            </View>
          );
        })}
      </View>

      {customIcons.length > 0 || onUpload ? (
        <View className="ui-icon-grid__section ui-icon-grid__custom" style={colStyle}>
          {customIcons.map((c) => {
            const active = c.id === value;
            return (
              <View
                key={c.id}
                className={`ui-icon-grid__item ${active ? "ui-icon-grid__item--active" : ""}`}
                onClick={() => onChange?.(c.id)}
              >
                <Image className="ui-icon-grid__img" src={c.icon_url} mode="aspectFit" />
                {onDelete ? (
                  /* catchMove 阻止冒泡，避免点删除触发外层选中 */
                  <View
                    className="ui-icon-grid__del"
                    catchMove
                    onClick={() => onDelete?.(c.id)}
                  >
                    <Text className="ui-icon-grid__del-icon">×</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          {onUpload ? (
            <View className="ui-icon-grid__item ui-icon-grid__upload" onClick={handleUpload}>
              <Text className="ui-icon-grid__upload-icon">+</Text>
              <Text className="ui-icon-grid__upload-text">上传</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default IconGrid;
```

> 说明：删除按钮用独立 `<View onClick>`，点击删除时需阻止冒泡到外层网格项（否则会同时触发选中）。小程序 View 的 `catchMove` 用于阻止滑动事件；为阻止点击冒泡，应在删除按钮的 onClick 里**不再调用** onChange，并由外层项的 onClick 判断事件来源。简化实现：删除按钮独立 onClick 调 onDelete，外层项 onClick 调 onChange——若两者都触发，可在删除时先 onDelete 再由调用方控制（onUpload/onDelete 通常会关闭选择）。若实际出现"点删除也选中"的 bug，给删除按钮加一个 `catchMove` 并在外层 onClick 里判断 `e.target`（小程序支持有限，备选方案是把删除按钮做成长按触发）。

- [ ] **Step 2: 创建样式**

Create `taro/src/components/ui/IconGrid/index.scss`:

```scss
.ui-icon-grid {
  &__section {
    display: grid;
    gap: 20rpx;
    padding: 8rpx 0;
  }
  &__custom {
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 2rpx dashed var(--bd);
  }
  &__item {
    aspect-ratio: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 8rpx;
    background: var(--srfSoft);
    border: 2rpx solid var(--bdL);
    border-radius: var(--rm);
    position: relative;
    transition: all var(--df) var(--ease);

    &--active {
      border-color: var(--pr);
      background: var(--prBg);
      box-shadow: 0 0 0 4rpx rgba(45,157,138,0.15);
    }
  }
  &__emoji { font-size: 48rpx; line-height: 1; }
  &__img { width: 56rpx; height: 56rpx; }

  &__del {
    position: absolute;
    top: -12rpx; right: -12rpx;
    width: 36rpx; height: 36rpx;
    background: var(--exp);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  &__del-icon { color: #fff; font-size: 24rpx; line-height: 1; }

  &__upload {
    border: 2rpx dashed var(--bd);
    background: transparent;
    flex-direction: column;
  }
  &__upload-icon { font-size: 44rpx; color: var(--fg3); line-height: 1; }
  &__upload-text { font-size: 22rpx; color: var(--fg3); }
}
```

- [ ] **Step 3: 追加导出**

```ts
export { IconGrid } from "./IconGrid";
export type { IconGridOption, CustomIconItem } from "./IconGrid";
```

- [ ] **Step 4: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/IconGrid taro/src/components/ui/index.ts
git commit -m "feat(taro): Spec1 IconGrid 图标网格选择器（Taro.chooseImage 上传）"
```

---

## Task 19: toast 工具封装

**Files:**
- Create: `taro/src/utils/toast.ts`

- [ ] **Step 1: 创建封装**

Create `taro/src/utils/toast.ts`:

```ts
/**
 * toast — 统一轻提示封装（对齐 PC notify 语义）
 * 内部用 Taro.showToast，颜色语义对齐 --inc/--exp/--info
 */
import Taro from "@tarojs/taro";

export type ToastType = "success" | "error" | "info" | "warn";

export function toast(
  message: string,
  type: ToastType = "info",
  duration = 2000
): void {
  const iconMap: Record<ToastType, "success" | "error" | "none" | "loading"> = {
    success: "success",
    error: "error",
    info: "none",
    warn: "none",
  };
  Taro.showToast({
    title: message,
    icon: iconMap[type],
    duration,
    mask: false,
  });
}
```

- [ ] **Step 2: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/utils/toast.ts
git commit -m "feat(taro): Spec1 toast 统一封装（语义对齐 inc/exp/info）"
```

---

## Task 20: AppSection 增强（加 loading 态）

**Files:**
- Modify: `taro/src/components/ui/AppSection/index.tsx`

现有 AppSection 源码（第 5-53 行）：props 为 `{title, subtitle, actionText, onAction, children, className, bodyClassName, compact, flush}`，body 区渲染 `{children}`。

- [ ] **Step 1: 增加 loading prop 与骨架态**

Edit `taro/src/components/ui/AppSection/index.tsx`，做 3 处改动：

改动 A — 在 import 区加入 Skeleton（注意：Skeleton 在 Task 7 已建好）：

把
```tsx
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";
```
改为
```tsx
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import { Skeleton } from "../Skeleton";
import "./index.scss";
```

改动 B — props 接口加 `loading`：

把
```tsx
interface AppSectionProps {
  title?: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
  flush?: boolean;
}
```
改为
```tsx
interface AppSectionProps {
  title?: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
  flush?: boolean;
  loading?: boolean;
}
```

改动 C — 函数参数解构加 loading，body 区按 loading 切换：

把
```tsx
export default function AppSection({
  title,
  subtitle,
  actionText,
  onAction,
  children,
  className = "",
  bodyClassName = "",
  compact = false,
  flush = false,
}: AppSectionProps) {
```
改为
```tsx
export default function AppSection({
  title,
  subtitle,
  actionText,
  onAction,
  children,
  className = "",
  bodyClassName = "",
  compact = false,
  flush = false,
  loading = false,
}: AppSectionProps) {
```

并把 body 行
```tsx
      <View className={`app-section__body ${bodyClassName}`}>{children}</View>
```
改为
```tsx
      <View className={`app-section__body ${bodyClassName}`}>
        {loading ? <Skeleton height="200rpx" /> : children}
      </View>
```

- [ ] **Step 2: 验证 & Commit**

```bash
cd taro && npm run build:h5 2>&1 | tail -10
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/components/ui/AppSection
git commit -m "feat(taro): Spec1 AppSection 增加 loading 骨架态"
```

---

## Task 21: _ui-demo 演示页（验收关键证据）

**Files:**
- Create: `taro/src/pages/_ui-demo/index.tsx`
- Create: `taro/src/pages/_ui-demo/index.scss`
- Modify: `taro/src/app.config.ts`（注册页面，不加 tabBar）

- [ ] **Step 1: 创建演示页组件**

Create `taro/src/pages/_ui-demo/index.tsx`:

```tsx
/**
 * _ui-demo — 组件库可视化验收页（开发期用，不进 tabBar）
 * 覆盖所有组件各 variant，供视觉验证。
 */
import { useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import {
  Button, Card, CardHeader, CardContent, Badge, EmptyState,
  Skeleton, Input, SearchInput, NumberInput, Textarea, SegControl,
  Switch, GlobalModal, Drawer, DropdownSelect, IconGrid, List, ListItem,
  RankRow, ReportRankList, Pagination, StatCard,
  AppSection, PageHero, MetricGrid, MenuList, FloatingAction,
} from "@/components/ui";
import "./index.scss";

export default function UiDemo() {
  const [inputVal, setInputVal] = useState("");
  const [textVal, setTextVal] = useState("");
  const [seg, setSeg] = useState<"all" | "income" | "expense">("all");
  const [sw, setSw] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string>("");
  const [icon, setIcon] = useState("🍚");

  return (
    <View className="demo">
      <ScrollView scrollY className="demo__scroll">
        <PageHero title="组件库演示" value="Spec 0 + 1" meta="视觉对齐 PC 端" />

        <AppSection title="Button">
          <View className="demo__row">
            <Button variant="default">默认</Button>
            <Button variant="primary">主操作</Button>
            <Button variant="secondary">次要</Button>
          </View>
          <View className="demo__row">
            <Button variant="outline">描边</Button>
            <Button variant="ghost">幽灵</Button>
            <Button variant="danger">危险</Button>
          </View>
          <View className="demo__row">
            <Button size="sm">小</Button>
            <Button size="md" loading>加载中</Button>
            <Button size="lg" disabled>禁用</Button>
          </View>
          <Button variant="primary" block onClick={() => setConfirmOpen(true)}>
            块级按钮（触发 confirm）
          </Button>
        </AppSection>

        <AppSection title="Card">
          <Card>
            <CardHeader title="卡片标题" subTitle="副标题" action={<Badge variant="primary">新</Badge>} />
            <CardContent>
              <Text>这是卡片内容，padding=md。</Text>
            </CardContent>
          </Card>
        </AppSection>

        <AppSection title="Badge">
          <View className="demo__row">
            <Badge>默认</Badge>
            <Badge variant="primary">主</Badge>
            <Badge variant="income">收入</Badge>
            <Badge variant="expense">支出</Badge>
            <Badge variant="warn">警告</Badge>
            <Badge variant="info">信息</Badge>
          </View>
        </AppSection>

        <AppSection title="StatCard">
          <View className="demo__stats">
            <StatCard label="本月支出" value="¥3,200" sub="较上月 -8%" variant="expense" />
            <StatCard label="本月收入" value="¥12,000" sub="较上月 +5%" variant="income" />
          </View>
          <StatCard label="总资产" value="¥86,400" sub="截至 6 月" variant="hero" />
        </AppSection>

        <AppSection title="EmptyState">
          <EmptyState icon="📭" title="暂无数据" description="点击下方按钮添加第一条记录">
            <Button variant="primary" size="sm">添加</Button>
          </EmptyState>
        </AppSection>

        <AppSection title="Skeleton" loading>
          <Text>上方 loading 态即 AppSection loading 效果</Text>
        </AppSection>

        <AppSection title="Input">
          <Input label="用户名" placeholder="请输入" value={inputVal} onChange={setInputVal} allowClear required />
          <Input label="错误态" placeholder="演示" error="该字段必填" />
          <SearchInput value={inputVal} onChange={setInputVal} placeholder="搜索..." />
          <NumberInput label="金额" prefix="¥" placeholder="0.00" />
        </AppSection>

        <AppSection title="Textarea">
          <Textarea label="备注" placeholder="说点什么..." value={textVal} onChange={setTextVal} showCount maxLength={100} />
        </AppSection>

        <AppSection title="SegControl">
          <SegControl
            value={seg}
            onChange={setSeg}
            options={[
              { value: "all", label: "全部" },
              { value: "income", label: "收入" },
              { value: "expense", label: "支出" },
            ]}
          />
          <SegControl variant="pill" value={seg} onChange={setSeg}
            options={[{ value: "all", label: "日" }, { value: "income", label: "周" }, { value: "expense", label: "月" }]} />
        </AppSection>

        <AppSection title="Switch">
          <View className="demo__row">
            <Text>开关：{sw ? "开" : "关"}</Text>
            <Switch checked={sw} onChange={setSw} />
          </View>
        </AppSection>

        <AppSection title="DropdownSelect">
          <DropdownSelect
            label="分类"
            placeholder="选择分类"
            value={dropdown}
            onChange={setDropdown}
            showSearch
            options={[
              { key: "1", label: "餐饮", icon: "🍚" },
              { key: "2", label: "交通", icon: "🚗" },
              { key: "3", label: "购物", icon: "🛒" },
              { key: "4", label: "居住", icon: "🏠" },
            ]}
          />
        </AppSection>

        <AppSection title="IconGrid">
          <IconGrid
            value={icon}
            onChange={setIcon}
            options={[
              { value: "🍚", icon: "🍚" }, { value: "🍜", icon: "🍜" },
              { value: "🍔", icon: "🍔" }, { value: "🚗", icon: "🚗" },
              { value: "🛒", icon: "🛒" }, { value: "🏠", icon: "🏠" },
            ]}
          />
        </AppSection>

        <AppSection title="List">
          <List inset>
            <ListItem icon={<Text>👤</Text>} title="个人资料" showArrow onClick={() => setDetailOpen(true)} />
            <ListItem icon={<Text>🔔</Text>} title="通知" extra={<Switch checked={sw} onChange={setSw} />} divider={false} />
          </List>
        </AppSection>

        <AppSection title="RankRow">
          <RankRow
            icon={<Text>🍚</Text>}
            label="餐饮"
            amount="¥1,280"
            totalAmount="/ ¥2,000"
            progress={64}
            meta="本月已用 64%"
            type="expense"
          />
        </AppSection>

        <AppSection title="ReportRankList">
          <ReportRankList
            items={[
              { icon: "🍚", label: "餐饮", amount: "¥3,200", type: "expense" },
              { icon: "🚗", label: "交通", amount: "¥1,200", type: "expense" },
              { icon: "💰", label: "工资", amount: "¥12,000", type: "income" },
            ]}
          />
        </AppSection>

        <AppSection title="Pagination">
          <Pagination page={1} totalPages={5} info="第 1/5 页 · 共 80 条" onChange={() => {}} />
        </AppSection>

        <AppSection title="MenuList">
          <MenuList
            items={[
              { key: "1", label: "设置", icon: "settings", onClick: () => {} },
              { key: "2", label: "退出登录", icon: "logout", danger: true },
            ]}
          />
        </AppSection>

        <AppSection title="MetricGrid">
          <MetricGrid
            columns={2}
            items={[
              { label: "本月支出", value: "¥3,200", tone: "expense" },
              { label: "本月收入", value: "¥12,000", tone: "income" },
            ]}
          />
        </AppSection>

        <AppSection title="弹窗/抽屉">
          <View className="demo__row">
            <Button variant="outline" onClick={() => setModalOpen(true)}>Modal 表单</Button>
            <Button variant="outline" onClick={() => setDetailOpen(true)}>Detail 详情</Button>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>Drawer</Button>
          </View>
        </AppSection>

        <View style={{ height: "200rpx" }} />
      </ScrollView>

      <FloatingAction onClick={() => setConfirmOpen(true)} />

      <GlobalModal type="modal" open={modalOpen} onClose={() => setModalOpen(false)} title="编辑信息" size="sm"
        footer={<Button variant="primary" block onClick={() => setModalOpen(false)}>保存</Button>}>
        <Input label="名称" placeholder="输入名称" />
      </GlobalModal>

      <GlobalModal type="detail" open={detailOpen} onClose={() => setDetailOpen(false)} title="详情"
        footer={<><Button onClick={() => setDetailOpen(false)}>关闭</Button><Button variant="primary" onClick={() => setDetailOpen(false)}>编辑</Button></>}>
        <Text>这里是详情内容。展示底部 sheet 形态的详情弹窗。</Text>
      </GlobalModal>

      <GlobalModal type="confirm" open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title="确认删除" description="此操作不可撤销，确定继续吗？"
        confirmText="确认删除" confirmDanger onConfirm={() => setConfirmOpen(false)} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="筛选条件"
        footer={<Button variant="primary" block onClick={() => setDrawerOpen(false)}>应用筛选</Button>}>
        <SegControl value={seg} onChange={setSeg}
          options={[{ value: "all", label: "全部" }, { value: "income", label: "收入" }, { value: "expense", label: "支出" }]} />
        <View style={{ height: "40rpx" }} />
        <Text>这里放更多筛选选项，可滚动。</Text>
      </Drawer>
    </View>
  );
}
```

- [ ] **Step 2: 创建演示页样式**

Create `taro/src/pages/_ui-demo/index.scss`:

```scss
.demo {
  min-height: 100vh;
  background: var(--bg);
  &__scroll { height: 100vh; box-sizing: border-box; }
  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    align-items: center;
    margin-bottom: 16rpx;
  }
  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rpx;
    margin-bottom: 16rpx;
  }
}
```

- [ ] **Step 3: 注册页面到 app.config.ts**

Edit `taro/src/app.config.ts`，在 `pages` 数组末尾追加演示页（不加入 `tabBar.list`）。现有 pages 数组最后一项是 `"pages/Map/index"`：

把
```ts
    "pages/Calendar/index",
    "pages/Map/index",
  ],
```
改为
```ts
    "pages/Calendar/index",
    "pages/Map/index",
    "pages/_ui-demo/index",
  ],
```

（tabBar.list 保持不变，演示页不进 tab。）

- [ ] **Step 4: 验证编译**

Run: `cd taro && npm run build:h5 2>&1 | tail -15`
Expected: BUILD SUCCESSFUL。若有 TS 报错（如 props 类型不匹配），逐个修正。

- [ ] **Step 5: Commit**

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add taro/src/pages/_ui-demo taro/src/app.config.ts
git commit -m "feat(taro): Spec1 _ui-demo 组件演示页（验收所有组件 variant）"
```

---

## Task 22: 最终验证 + weapp 编译

**Files:** 无修改

- [ ] **Step 1: h5 编译**

Run: `cd taro && npm run build:h5 2>&1 | tail -20`
Expected: BUILD SUCCESSFUL，无 ERROR。

- [ ] **Step 2: weapp 编译**

Run: `cd taro && npm run build:weapp 2>&1 | tail -20`
Expected: BUILD SUCCESSFUL，无 ERROR。

- [ ] **Step 3: 人工视觉验收（h5）**

在 h5 dev server 打开 `_ui-demo` 页面，逐项检查：
- Button 各 variant/size 视觉对齐 PC（主色绿 `#2D9D8A`、支出红 `#E06055`）
- Card 圆角 24rpx、阴影 sh1
- GlobalModal confirm 居中卡片、detail/modal 底部 sheet、动画正常
- DropdownSelect 弹出底部 sheet、搜索可用
- Input onChange 正常（输入即更新）
- SegControl 切换态白底高亮
- 无硬编码颜色残留（全走 CSS 变量）

- [ ] **Step 4: 确认无回归**

Run: `cd taro && npm run build:h5 2>&1 | grep -i error | head`
Expected: 无输出（无 error）。

现有页面因旧 token 兼容映射，应零回归。若发现某页面视觉异常，检查是否遗漏了工具类对齐（Task 1 Step 2）。

- [ ] **Step 5: 最终 Commit（如有修正）**

```bash
cd "/Users/zhaolong/前端/family-bookkeeping"
git add -A taro/
git commit -m "chore(taro): Spec0+1 最终验证修正"
```

---

## 完成标志

Spec 0 + Spec 1 完成的判定：
1. ✅ `app.scss` token 对齐 PC 命名，旧名兼容映射存在
2. ✅ 22 个通用组件全部在 `components/ui/` 并统一导出
3. ✅ `_ui-demo` 演示页可运行，展示所有组件 variant
4. ✅ h5 + weapp 双端编译通过
5. ✅ 现有页面零回归（兼容映射保证）

完成后，即可进入 **Spec 2（核心高频页面：Home + Transactions + AddTransaction）** 的设计。届时会基于这套组件库逐页重写，消除内联 View/Text 结构。
