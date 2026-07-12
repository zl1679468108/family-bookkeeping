# 空状态组件规范（EmptyState）

> 跨端对齐基准：PC 端 `frontend/src/components/ui/EmptyState` 与小程序端 `taro/src/components/ui/EmptyState` 必须遵循本规范，保持组件契约与视觉一致。

适用场景：任意模块「数据为空 / 无结果 / 未选择」等占位展示，统一使用该组件，**禁止**各页面手写「暂无数据」提示。

---

## 1. 组件契约（两端必须一致）

| Prop | 类型 | 必填 | 说明 |
|---|---|:---:|---|
| `icon` | `ReactNode` | 否 | 自定义图标（emoji 或节点）。**不传则自动渲染全局统一的空盒子图标**。 |
| `title` | `ReactNode` | 否 | 标题文案，由各模块自定（核心可定制项）。 |
| `description` | `ReactNode` | 否 | 补充说明。 |
| `action` | `ReactNode` | 否 | 操作区（如「去记一笔」按钮）。 |
| `variant` | `'default' \| 'compact' \| 'full'` | 否 | 尺寸变体，默认 `default`。 |
| `iconSize` | `number` | 否 | 默认图标尺寸，不传按 variant 取默认值（见 §3）。 |
| `className` | `string` | 否 | 透传类名。 |

PC 端额外保留 `style?: React.CSSProperties`（PC 组件惯例，小程序端无）。

**行为约束：**
- 不传 `icon` → 渲染全局统一默认图标（两端图形一致，见 §2）。
- 传 `icon` → 覆盖默认图标（emoji / 任意节点）。
- `variant` 三态语义一致：`default`（常规居中）、`compact`（紧凑，列表内嵌）、`full`（整屏留白）。

---

## 2. 默认图标（统一「空盒子」线形图标）

两端使用**同一套 SVG 路径**（托盘主体 + 托盘内折线）：

```
M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z
M22 12h-6l-2 3h-4l-2-3H2
```

viewBox `0 0 24 24`，`stroke-width 1.5`，`fill none`，`stroke-linecap/linejoin round`。

**实现机制差异（由平台能力决定，符合各自最佳实践，非缺陷）：**

| | 小程序端 (Taro) | PC 端 (frontend) |
|---|---|---|
| 渲染方式 | `data:image/svg+xml` URL + `<Image src>` | 内联 `<svg>` React 元素 |
| 原因 | 微信小程序**不支持内联 SVG** | React 原生支持 SVG，无需 data URL |
| 颜色 | 硬编码 `#A6A9A4`（中性灰，固定值） | `currentColor` → `var(--fg3)`，暗色自动适配 |
| 代码位置 | `taro/src/utils/emptyIcons.ts` 的 `getEmptyIconDataUrl()` | `EmptyState/index.tsx` 内 `EmptyBoxIcon` |

> ⚠️ 小程序端因 data-URL 无法读取 CSS 变量，颜色为固定值；PC 端用 `currentColor` 自动跟随明暗主题。这是有意的平台差异，勿强行统一为某一种机制。

---

## 3. 尺寸规范

默认图标尺寸（不传 `iconSize` 时）：

| variant | 小程序 (rpx) | PC (px，rpx 等效) |
|---|---|---|
| `default` | 96 | 48 |
| `compact` | 64 | 32 |
| `full` | 120 | 60 |

> rpx 以 750 设计宽、2x 换算为 px：`1rpx = 0.5px`。两端比例 `1 : 0.667 : 1.25` 一致。

**间距 / 字号（按平台惯例，可不逐像素相等）：**
- 小程序：padding `64/32/—` rpx，标题 28rpx，说明 24rpx（compact 22rpx），emoji 回退 96rpx。
- PC：padding `40/24/80` px，标题 14px，说明 12px（compact 13px），emoji 回退 32px。

---

## 4. 用法示例

```tsx
// 默认统一图标 + 标题（最常见的空状态）
<EmptyState title="暂无数据" description="添加第一笔交易开始记账" />

// 覆盖默认图标（emoji）
<EmptyState icon="📭" title="暂无数据" description="当前时间段内没有交易记录" />

// 紧凑 + 操作按钮
<EmptyState variant="compact" title="暂无结果" action={<Button>重置筛选</Button>} />
```

---

## 5. 维护约定

- 修改默认图标图形 / props 契约 / 尺寸比例 → **两端同步修改**并回读本规范。
- 新增模块需展示空状态时，必须引用本组件，不得自建占位 UI。
- 本规范为两端对齐的**唯一基准**，优先级高于各自代码内注释。
