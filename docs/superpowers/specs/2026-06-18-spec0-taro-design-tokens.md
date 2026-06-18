# Spec 0：设计 Token 对齐

> 日期：2026-06-18
> 依赖：无（地基）
> 关联：总体设计 `2026-06-18-taro-ui-alignment-overview.md`

## 1. 目标

将 taro 端 `src/app.scss` 的设计 Token 体系全量对齐 PC 端 `frontend/src/styles/design-tokens.css`：
- **采用 PC 端极简命名**（`--pr` / `--srf` / `--inc` / `--exp` / `--rs` / `--rm` 等），两端完全一致。
- **数值换算**：PC 用 px，taro 用 rpx（1px ≈ 2rpx），保持视觉比例一致。
- **补齐缺失体系**：阴影（4 档）、动画缓动 + 时长（3 档）、z-index 层级（含弹窗 3 层）、深色模式、全局 keyframes。
- **向后兼容**：保留旧命名映射，避免现有页面一次性全坏。

## 2. 现状对比

| 维度 | PC 端（design-tokens.css） | taro 端（app.scss） | 差距 |
|------|---------------------------|---------------------|------|
| 主色 | `--pr: #2D9D8A` 等 6 个 | `--primary: #2d9d8a` 等 | 数值一致，命名不同 |
| 中性色 | `--srf/--fg/--bd` 等 8 个 | `--surface/--fg/--border` 等 | 命名不同 |
| 语义色 | `--inc/--exp/--warn/--info` + 背景对 | `--income/--expense/--warn` | 命名不同，缺 info |
| 圆角 | `--rs/--rm/--rl/--rx` (8/12/18/24px) | `--radius-sm/md/lg/xl` (16/24/32/40rpx) | 数值对，命名不同 |
| 阴影 | `--sh1~4` | ❌ 缺失 | 仅 app.scss 有硬编码 box-shadow |
| 动画 | `--ease/--sp` + `--df/--dn/--ds` + keyframes | ❌ 缺失 | 各组件硬编码 transition |
| z-index | `--z-detail/modal/critical/toast` 等 | ❌ 缺失 | 硬编码 z-index 散落 |
| 深色模式 | `[data-theme="dark"]` 完整覆盖 | ❌ 缺失 | 无 |

## 3. 设计

### 3.1 新 Token 体系（写入 `app.scss`，page 选择器内）

完全对齐 PC 端，px → rpx 换算（×2）：

```scss
page {
  /* ═══ 主色（绿色） ═══ */
  --pr:    #2D9D8A;
  --prH:   #248B78;
  --prD:   #1A7A6A;
  --prBg:  #E7F5F2;
  --prBd:  #C4E5DE;
  --prGr:  linear-gradient(135deg, #2D9D8A 0%, #45B7A7 100%);

  /* ═══ 中性色 ═══ */
  --bg:    #F6F7F4;
  --srf:   #FFFFFF;
  --srfH:  #F9FAF8;
  --srfSoft: #FAFAF7;   /* taro 特有：表面柔色，对应旧 --surface-soft，保留 */
  --fg:    #1A1C19;
  --fg2:   #5A5D58;
  --fg3:   #8B8E89;
  --bd:    #E0E2DD;
  --bdL:   #EDEEE9;
  --bdH:   #D0D2CD;      /* hover 边框，PC 隐含，taro 显式补 */

  /* ═══ 语义色 ═══ */
  --inc:    #3BA272;
  --incBg:  #EAF7F0;
  --exp:    #E06055;
  --expBg:  #FCEEED;
  --warn:   #E8A838;
  --warnBg: #FDF6E8;
  --info:   #4A90D9;
  --infoBg: #ECF3FB;

  /* ═══ 遮罩 ═══ */
  --ov: rgba(0, 0, 0, 0.35);

  /* ═══ 圆角（px→rpx ×2） ═══ */
  --rs:  16rpx;   /* 8px */
  --rm:  24rpx;   /* 12px */
  --rl:  36rpx;   /* 18px */
  --rx:  48rpx;   /* 24px */

  /* ═══ 阴影（PC 数值直接套用，px→rpx） ═══ */
  --sh1: 0 2rpx 4rpx rgba(0, 0, 0, 0.04);
  --sh2: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  --sh3: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
  --sh4: 0 32rpx 96rpx rgba(0, 0, 0, 0.12);

  /* ═══ Z-Index 层级（与 PC 一致） ═══ */
  --z-baseline:  0;
  --z-1:         1;
  --z-5:         5;
  --z-10:       10;
  --z-30:       30;
  --z-50:       50;
  --z-100:     100;
  --z-200:     200;
  --z-400:     400;
  --z-detail:  1000;
  --z-modal:   1500;
  --z-critical: 2500;
  --z-toast:   3000;

  /* ═══ 缓动函数 ═══ */
  --ease: cubic-bezier(0.25, 0, 0, 1);
  --sp:   cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ═══ 过渡时长 ═══ */
  --df: 0.15s;
  --dn: 0.25s;
  --ds: 0.35s;

  /* ═══ 字体（小程序降级：去 DM Sans，用系统字体） ═══ */
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC",
    "Helvetica Neue", "Microsoft YaHei", sans-serif;
  --fm: ui-monospace, "SF Mono", Menlo, monospace;  /* 金额等宽 */

  font-size: 28rpx;
  color: var(--fg);
  background-color: var(--bg);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

### 3.2 向后兼容映射（旧 → 新，过渡期保留）

```scss
page {
  /* 旧命名兼容 —— 后续页面重构时逐步移除 */
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
}
```

> 说明：保留兼容映射后，**现有页面无需任何改动即可继续运行**。页面重构时（Spec 2~5）逐步替换为新命名，最终移除兼容映射。

### 3.3 全局动画 keyframes（对齐 PC `@keyframes`）

新增到 `app.scss` 末尾：

```scss
@keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp  { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn   { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes slideUp   { from { transform: translateY(40rpx); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(40rpx); opacity: 0; } }
@keyframes spin      { to { transform: rotate(360deg); } }

/* 聚焦高亮（详情返回列表定位） */
@keyframes spotlightPulse {
  0%, 100% { box-shadow: 0 0 0 2rpx rgba(45, 157, 138, 0.45), 0 0 28rpx rgba(45, 157, 138, 0.18); }
  50%      { box-shadow: 0 0 0 4rpx rgba(45, 157, 138, 0.7),  0 0 48rpx rgba(45, 157, 138, 0.32); }
}
```

### 3.4 深色模式（对齐 PC `[data-theme="dark"]`）

小程序无 `data-theme` 属性，改用 **page 上的 class 或 CSS 变量切换**。方案：

```scss
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
  --pr:    #45B7A7;
  --prH:   #52C4B4;
  --prD:   #2D9D8A;
  --prBg:  #1A3A35;
  --prBd:  #2A5A52;
  --inc:    #52C494;
  --incBg:  #1A3528;
  --exp:    #F08075;
  --expBg:  #3A2020;
  --warn:   #F0C040;
  --warnBg: #3A3020;
  --info:   #60A5FA;
  --infoBg: #1A2A40;
  --ov: rgba(0, 0, 0, 0.55);
  --sh1: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  --sh2: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  --sh3: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
  --sh4: 0 32rpx 96rpx rgba(0, 0, 0, 0.5);
}
```

> 切换机制：通过在页面根节点动态添加 `theme-dark` 类实现。本期**只定义变量和 class，不实现切换逻辑**（切换逻辑随 Spec 5 设置页一起做）。这样深色模式基础设施就位，不阻塞当前。

### 3.5 工具类整理

现有 `app.scss` 的 Tailwind 风格工具类（`.flex`/`.mt-2`/`.px-4` 等）**保留不动**，它们与新 token 体系不冲突，且重构期间仍有用。仅做一处调整：

- 颜色工具类对齐新命名语义：
  ```scss
  .text-primary { color: var(--pr); }      /* 原 var(--primary) */
  .text-secondary { color: var(--fg2); }   /* 原 var(--fg-2) */
  .text-danger { color: var(--exp); }      /* 原 var(--expense) */
  .text-hint { color: var(--fg3); }        /* 原 var(--fg-3) */
  ```

## 4. 验收标准

1. `app.scss` 包含完整的 PC 对齐 token（主色/中性/语义/圆角/阴影/z-index/动画/缓动/时长）。
2. 旧命名兼容映射存在，**现有页面无任何回归**（编译通过 + 视觉不变）。
3. 深色模式变量 + `.theme-dark` class 就位（切换逻辑本期不做）。
4. 全局 keyframes（fadeIn/fadeInUp/scaleIn/slideUp/spin/spotlightPulse）就位。
5. 编译 `npm run build:weapp` 与 `build:h5` 均通过。

## 5. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 改 token 导致现有页面视觉错乱 | 保留旧命名兼容映射，新旧 token 共存 |
| `--bg` 值微调（taro 旧 `#f5f6f1` → PC `#F6F7F4`）| 差异极小（几乎不可见），可接受；若担心可保持旧值 |
| 深色模式变量定义了但没切换入口 | 明确"本期只定义不切换"，入口随 Spec 5 |

## 6. 不在本 Spec 范围

- 组件实现（→ Spec 1）
- 页面重构（→ Spec 2~5）
- 深色模式切换逻辑与入口（→ Spec 5）
- 旧命名兼容映射的移除（所有页面重构完成后统一清理）
