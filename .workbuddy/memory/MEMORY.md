# 家庭记账项目 — 静记

> 自动注入记忆，每个新对话加载。

## ⚠️ 当前重心（2026-07-06 起）

**Taro 微信小程序功能完善。** PC 端 & 后端功能已稳定，新需求优先在 Taro 端落地。
TASKS.md 已精简为仅 3 个非阻塞遗留项（H2/M8/L7），不再作为活跃看板。

## 架构 & 技术栈

```
前端 React 18 (CRA) :3001/dev :3002/prod  →  axios  →  后端 NestJS :3000  →  Supabase PostgreSQL
Taro 小程序端 taro/ (Vite + React + SCSS)
```
- 前端 PC：Tailwind v3, react-query v5, React Router v6(HashRouter), ECharts, DM Sans
- 后端：Supabase SDK, bcryptjs, exceljs, pdfkit；数据库 10 张表直接 SDK 操作，无 ORM
- 启动：前端 dev `HOST=127.0.0.1 PORT=3001 npm start`；后端 `npm run start:dev` → :3000

## PC 端设计系统

- 主色 `#2D9D8A` 绿；字体 DM Sans + DM Mono；品牌 "静记"
- ⚠️ **主操作按钮 & 选中激活态统一用 `--pr` 绿**：禁止用 `--fg` 做填充背景

## 数据库

- 现有 10 张：users, password_resets, user_sessions, transactions, budgets, categories, books, book_members, member_locations, transaction_templates
- P2 待实现 6 张：recurring_transactions, recurring_logs, notifications, notification_preferences, savings_goals, settlements
- 权威 schema：`docs/database-init.sql`（DDL 变更须手动在 Supabase SQL Editor 执行）

## Taro 规范速查

- **SCSS only**（禁 .css）；**Pages 大驼峰**；**Picker 弹选日期**，禁左右箭头
- 组件归属：≥2 处用→`components/`，1 处→页面内 `components/`
- **统一 BottomSheet** 做工作台详情/表单弹窗；**统一 ConfirmDialog** 删确认；**NavHeader** 导航栏
- 单文件 ≤200 行（tsx）/ ≤150 行（scss）；禁止 `*` 通配符、CSS 转义符
- TabBar 4 tab（首页/流水/工作台/我的），custom-tab-bar **JS 内联 style** 驱动主题色（绕过样式隔离）
- 构建目录隔离：`dev:*` → `dist/`，`build:*` → `dist-prod/`（勿同时跑）
- **页面间距标准（2026-07-13 统一）**：横向 32rpx，顶部 `calc(18rpx + safe-area-inset-top)`，底部 `calc(32rpx + safe-area-inset-bottom)`。由 PageContainer/PageLayout 默认 padding 提供，子页面不再各自写 padding；固定操作栏场景用 `bottomSpace` prop

## 全局页面容器（2026-07-13 新增，核心封装）

- **`PageContainer`**（`components/PageContainer/index.tsx`）= 语义化封装，收敛绝大多数页面共性：统一间距 + loading 遮罩 + 下拉刷新(onRefresh/refreshing) + 上拉加载(onLoadMore/hasMore/loadingMore) + 吸顶 header + 整页空状态(empty/emptyTitle/emptyDesc/emptyAction) + 底部留白(bottomSpace)
- 基于 **`PageLayout`**（`components/PageLayout/index.tsx`）：锁 `height:100vh; overflow:hidden`、渲染 ScrollView、保留系统导航栏
- 用法：`<PageContainer loading={loading} empty={list.length===0} emptyTitle="暂无交易记录">...</PageContainer>`
- 已迁移 15 个页面（Home/Transactions/Workbench/Profile/Books/BookMembers/Categories/TemplateManager/Budgets/EditProfile/CategoryEdit/TemplateEdit/About/BookSettings 等）
- ⚠️ **header 插槽在 ScrollView 外部，不受 `.page-layout-scroll` 的 32rpx 水平 padding 管辖**。header 内内容需自行补 `padding: ... 32rpx` 才能与下方内容区左右对齐（流水页 filter-card 即此坑）

## ⚠️⚠️⚠️ Taro/微信致命坑（最高优先级）

### 🔴 真因：软键盘弹起时 `setData` 重渲染会冻死整页触摸（2026-07-14 确认）
- **现象**：表单提交后接口已响应（Network 见 200/404），但按钮 loading 卡死、BottomSheet 的 X/取消全点不动，**只有原生 `<Input>` 还能收字符**。
- **根因**：微信 WebView 已知坑——**软键盘弹起（输入框聚焦）状态下触发 `setData` 重渲染（如 `setX(true)` 显示 loading），会概率性冻死整页触摸事件派发**。逻辑线程没死，但 tap 事件到不了按钮，故 X/取消/提交全失效；输入框因走原生通道仍能打字。
- **之前误判**：曾以为是 `useMutation`/`.finally` 不结算导致 loading 不复位——**那是表象，不是根因**（回调里 `setJoining(false)` 其实执行了，只是页面已冻住看不出变化）。
- **正解（已落地全工作台表单页）**：提交前先 `Taro.hideKeyboard()` 收起键盘，再 `setX(true)` 重渲染 → 不再冻。
  ```ts
  if (saving) return;
  Taro.hideKeyboard();   // ← 关键：先收键盘
  setSaving(true);
  ```
- **适用场景**：任何「提交时输入框聚焦」的表单（分类/账本/模板/预算/成员邀请/交易/登录等）都要在 loading `setState` 前加 `Taro.hideKeyboard()`。无键盘时是空操作，安全。
- `Taro.hideKeyboard()` 须在**提交处理逻辑开头**调用（早于首个可能触发重渲染的 setState），给键盘收起留时间。

### 弃用 `useMutation`（Taro 端已全量移除，作为防御性规范保留）
- `useMutation` 状态机虽最终确认**非冻结真因**，但其在 Taro/微信下的结算偶发不可靠仍属事实，故保留"不用它驱动 UI loading"的规范。
- 2026-07 已将 Taro 端全部 9 个工作台表单页 + `useTransactions` hook 改为**手动 Promise 链**（`.then`/`.catch` 双路显式复位 + `setTimeout` 3.5~4s 兜底），`taro/src` 内已无 `useMutation` 残留。
- 读操作继续用 `useManualQuery`（已对 regenerator 做规避），不在此限。

### 防御性规范（仍有效）
- 微信 regenerator 下 Promise 链 `.finally()` **偶发不执行** → loading/弹窗偶发卡死。关键状态复位写在 `.then`/`.catch` 内**同步显式**，不依赖 `.finally`；`showToast` 不 await；加 `setTimeout` 兜底(3–5s)。
- 参考实现：`useManualQuery.ts` 第 81–86 行。

### 暗色模式
- `ThemeContext` 存 theme；PageLayout 根 View 挂 `theme-dark`；app.scss `.theme-dark` 块重绑所有别名(`--surface: var(--srf)`等)
- 导航栏：`useNavBarTheme.ts` mount+useDidShow+themeChange 无条件 `setNavigationBarColor`
- TabBar：JS 内联 style 驱动；不用 PageLayout 的页面须手动挂 `theme-dark`

### 页面滚动/吸顶
- `.page-layout` 必须 `height:100vh; overflow:hidden`（绝不用 min-height→ScrollView 失高、吸顶失效）
- 吸顶内容放 PageLayout **header 插槽**（ScrollView 外部），不用 position:sticky
