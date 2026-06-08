# 家庭记账项目 - 自动注入记忆

> 本文件在每个新对话中自动注入，无需手动加载。

## 架构

```
前端 React 18 (CRA) :3001/dev :3002/prod
    ↕ axios HTTP
后端 NestJS 10 :3000, 路由前缀 /api
    ↕ Supabase SDK
Supabase PostgreSQL (10张表, 无ORM)

移动端: mobile/ (Vite + React)
```

部署: 前端→CloudBase | 后端→Docker(CloudBase) | 数据库→Supabase

## 技术栈

| 层 | 框架 | 语言 | 关键依赖 |
|---|---|---|---|
| 前端 | React 18 (CRA) | TS | Tailwind v3, react-query v5, React Router v6(HashRouter), ECharts |
| 移动端 | React + Vite | TS | Tailwind, Capacitor(?) |
| 后端 | NestJS 10 | TS | Supabase SDK, JWT(bcryptjs), exceljs, pdfkit |
| 数据库 | Supabase PostgreSQL | SQL | 10张表, 直接 SDK 操作, 无 ORM |

## 端口和启动

- 前端 dev: `HOST=127.0.0.1 PORT=3001 npm start` (frontend/)
- 后端 dev: `npm run start:dev` → :3000 (backend/)
- 前端 prod: `PORT=3002 npm start`

## 后端模块 (backend/src/)

**业务模块 (12个):**
Supabase → Auth → Transaction → Categories → Statistics → Export → Budgets → Books → Map → Reports → Templates, 以及 health/

**辅助:** mail/, common/(异常过滤器+响应拦截器), utils/

## 前端目录 (frontend/src/)

components/ (Layout,Sidebar,Header,ChartCard,TransactionsList,StatCard,ImageUploader,Form,FilterBar,ui,BookSwitcher,DateRangeFilter,MapCanvas,LocationPicker,MerchantList,TransactionHistoryModal,MemberFilter,...)
pages/ (Dashboard,Transactions,Reports,AddTransaction,Categories,Budgets,Books,Map,Calendar,AnnualReport,TemplateManager,User/Login,Register)
services/ (api.ts,categoriesApi.ts,statisticsApi.ts,budgetsApi.ts,booksApi.ts,amapManager.ts,mapApi.ts)
hooks/ (useCategories.ts,useFocusItem.ts,useBook.tsx,useMapInstance.ts,useMemberColors.ts,useLocationSharing.ts)

## 地图模块 (2026-05-28新增，2026-05-29重构，2026-05-30池化)
- 地图 API: 高德地图 JS API 2.0, **原生 AMap API**（已脱离 @uiw/react-amap）
- 实例池化: AmapManager(单类，SDK加载+实例池化) → useMapInstance(React Hook)
- 后端: backend/src/map/ (module/controller/service/dto)
- 前端: pages/Map.tsx + components/MapCanvas + LocationPicker + MerchantList + TransactionHistoryModal, 路由 /map
- API: GET /api/map/transactions, GET /api/map/merchants, GET /api/map/merchants/transactions
- 数据库: transactions 新增 latitude/longitude/location_name/poi_id
- 子功能: 足迹(商户聚合+交易历史弹窗) / 热力 / 列表

## 报表 & 模板模块
- **Reports**: backend/src/reports/ — 年度报告(AnnualReport)，前端 pages/AnnualReport
- **Templates**: backend/src/templates/ — 交易模板管理，数据库表 transaction_templates，前端 pages/TemplateManager
- **Calendar**: 前端 pages/Calendar — 日历视图
- **成员位置**: 数据库表 member_locations，前端 useLocationSharing hook

## P2 需求状态

| 编号 | 需求 | 状态 |
|------|------|------|
| P2-1 | 收据上传 | ✅ 已完成 |
| P2-2 | 年度报告 | ✅ 已完成 |
| P2-3 | 周期交易/自动记账 | 📋 已定义 (新增 recurring_transactions + recurring_logs 表) |
| P2-4 | 账单提醒 | 📋 已定义 (新增 notifications + notification_preferences 表) |
| P2-5 | 多账本 | ✅ 已完成 |
| P2-6 | 储蓄目标 | 📋 已定义 (新增 savings_goals 表) |
| P2-7 | 家庭转账/AA记账 | 📋 已定义 (新增 settlements 表) |

## 数据库表 (当前10张 + P2新增6张待实现)

**现有**: users, password_resets, user_sessions, transactions, budgets, categories(用户级预设), books, book_members, member_locations, transaction_templates

**P2 新增(待实现)**: recurring_transactions, recurring_logs, notifications, notification_preferences, savings_goals, settlements

初始化: docs/database-init.sql
文档: docs/01-项目结构.md ~ 04-项目需求.md

## 环境变量

前端: .env.development → API_BASE_URL=http://localhost:3000/api
后端: .env.development/.env.production → SUPABASE_URL/KEY, JWT_SECRET, 邮件配置

## 执行规范

**每次对话启动时，自动同步 docs/ 目录中以下 5 个文件的状态，确保与 MEMORY.md 一致。其他文件不做校验。**

### docs/ 文档同步清单

| 文件 | 用途 | 同步要求 |
|------|------|---------|
| database-init.sql | 数据库初始化脚本（含建表、索引、触发器、分类数据） | ⚠️ **重点监控** |
| 01-项目结构.md | 项目结构说明 | 文件存在性校验 |
| 02-项目功能.md | 项目功能说明 | 文件存在性校验 |
| 03-数据模型.md | 数据模型设计 | 文件存在性校验 |
| 04-项目需求.md | 项目需求文档 | 文件存在性校验 |

### ⚠️ database-init.sql 数据库变更同步规则

**此 SQL 文件是数据库的唯一真实来源（Source of Truth）。一旦涉及下列数据库结构变动，必须在当天的工作日志中明确记录变更内容，提醒用户同步执行 SQL：**

- 新增/删除/重命名 **表 (CREATE TABLE / DROP TABLE / ALTER TABLE RENAME)**
- 新增/删除/修改 **列 (ADD COLUMN / DROP COLUMN / ALTER COLUMN)**
- 新增/删除/修改 **约束 (CHECK / UNIQUE / FOREIGN KEY)**
- 新增/删除/修改 **索引 (CREATE INDEX / DROP INDEX)**
- 新增/删除/修改 **触发器 (CREATE TRIGGER / DROP TRIGGER)**
- 新增/删除/修改 **函数 (CREATE FUNCTION)**
- 修改默认分类数据 (INSERT / UPDATE / DELETE ON categories)

**执行方式：**
- 变更记录格式：`⚠️ 数据库变更提醒：[变更类型] - [具体变更描述] - 请执行 docs/database-init.sql`
- 变更记录写入当天日志 `.workbuddy/memory/YYYY-MM-DD.md`，同时更新本文件中「数据库表」章节和下方的变更日志

### 数据库变更日志

> 每次 SQL 有结构变更时，在此追加记录。按时间倒序排列。

| 日期 | 变更类型 | 描述 |
|------|---------|------|
| 2026-06-03 | 需求文档 | P2-3~P2-7 需求 PRD 已定义，新增 6 张表设计（待实现） |
| 2026-06-01 | 新增表 | 新增 member_locations(成员位置共享) + transaction_templates(交易模板) |
| 2026-05-29 | 重构 | transactions/budgets 的 category 字段从 code/name 改为 UUID 外键关联 categories(id) |
| 2026-05-28 | 新增表 | P2-5: 新增 books(账本表) + book_members(成员表), transactions/budgets 增加 book_id 列和索引 |
| 2026-05-28 | 新增模块 | P2-1+P2-5: 后端新增 BooksModule (4文件) + YoY comparison API, 前端新增 BookSwitcher+BookProvider+BooksPage |
| 2026-05-26 | 新增表 + 迁移 | 新增 categories 表（自定义分类功能），支持 ALTER 兼容旧表结构 |
| 2026-05-26 | 初始化 | 首次创建 6 张表（users, password_resets, user_sessions, transactions, budgets, categories）

---

## Taro 项目开发规范

> 以下规范在 2026-06-07 整理确定，所有 Taro 端代码必须遵守。

### 1. 样式：统一 SCSS，禁止 .css

- 全局样式：`app.scss` 负责设计系统（CSS 变量、工具类、动画、全局组件样式）
- 组件样式：每个组件目录下的 `index.scss` 负责自身样式
- 页面样式：每个页面目录下的 `index.scss` 负责页面特有的布局和覆盖
- **禁止**新建 `.css` 文件，存量必须迁移

### 2. Pages 命名：大驼峰，与 components 一致

```
pages/
├── Home/              ✅ 大驼峰
├── AddTransaction/    ✅ 大驼峰
├── ForgotPassword/    ✅ 大驼峰
├── home/              ❌ 禁止小写
├── add-transaction/   ❌ 禁止 kebab-case
```

- 页面内部跳转路径跟随命名：`Taro.navigateTo({ url: '/pages/AddTransaction/index' })`
- `app.config.ts` 中页面注册路径同步保持大驼峰

### 3. 日期选择：统一 Picker 弹选，禁止左右箭头

- 年月选择 → `<Picker mode="date" fields="month">`（参考 `MonthPicker`）
- 日期选择 → `<Picker mode="date">`（参考 `DatePicker`）
- **禁止**在筛选栏/日历面板中使用 `{'<'}` `{'>'}` 左右箭头切换月份
- 所有日期/月份交互必须通过弹出原生 Picker 完成

### 4. 组件归属原则

| 场景 | 位置 |
|------|------|
| 被 2 个及以上页面/组件使用 | `src/components/` ✅ |
| 仅被 1 个页面使用 | `src/pages/模块/components/` ✅ |
| 仅被 1 个组件内部使用 | 内联或放入该组件目录 |

```
src/
├── components/           ← 公共：PageLayout, NavHeader, Icon, EmptyState, TabBar, TransactionItem, MonthPicker, ConfirmDialog, PullRefresh, ProgressBar, SegmentedControl, Skeleton, Toast
├── hooks/                ← 公共：useCategories, useMonthSelector, useTransactions, useBook
├── utils/                ← 公共：format.ts, categoryColors.ts
├── pages/
│   ├── AddTransaction/components/  ← 专属：DatePicker, NumberPad, LocationPicker, CategoryGrid
│   ├── Books/components/           ← 专属：BookCard
│   └── Calendar/index.tsx          ← 模块内拆分
```

### 5. 弹窗：统一 ConfirmDialog

- 所有确认/删除/退出等双按钮弹窗，统一使用 `components/ConfirmDialog`
- Props: `visible, title, message, confirmText, cancelText, confirmLoading, onCancel, onConfirm`
- **禁止**页面内各自实现固定遮罩 + 居中卡片的弹窗结构

### 6. 导航栏：统一使用 NavHeader 公共组件

> 2026-06-07 设计 v3.0，2026-06-08 封装为公共组件，2026-06-09 增加胶囊避让。

**NavHeader Props**：`title`, `leftContent?`, `rightContent?`
- 三栏布局：左(80rpx) | 中(标题居中) | 右（动态胶囊避让）
- 固定高度 88rpx，自动处理 safe area
- 右侧 slot 通过 `Taro.getMenuButtonBoundingClientRect()` 计算偏移，自动避开胶囊按钮
- 所有 `custom` 导航栏页面统一使用

| 页面类型 | navigationStyle | 导航组件 | 示例 |
|---------|:---:|------|------|
| 一级有 TabBar | `custom` | `<PageLayout title="首页" tabBar>` | Home, Transactions, Statistics, Profile |
| 一级无 TabBar | `custom` | `<NavHeader title="记一笔" leftContent={✕} rightContent={模板} />` | AddTransaction |
| 二三级无 TabBar | `default` | 系统默认导航栏（per-page index.config.ts 设标题） | Budgets, Categories, Books, TemplateManager, Calendar |

- **禁止**页面内手写导航栏 HTML/CSS
- **禁止**使用默认系统导航栏的页面上叠加自定义导航栏

### 6.1 颜色规则（2026-06-09 明确）

> 严格对齐设计稿 quiet-bookkeeping-design-v4.html

- **收入/支出颜色（红/绿）仅用于金额展示**，如交易金额、统计数值等
- **分类选中、按钮、标签等交互元素的激活色统一使用绿色系**（`--color-primary` / `--color-primary-bg`）
- **交易图标背景统一为 `--color-subtle`**，不按收入/支出区分
- 记一笔页使用系统原生键盘，无自定义数字键盘

### 7. Taro 端功能对齐 PC 端原则

> 2026-06-07 新增

- **小程序端以移动端界面交互形式，一个不差地实现 PC 端全部功能**
- 开发前必须先过一遍 PC 端对应模块的代码，确认所有功能点和交互逻辑
- 移动端适配原则：
  - PC 的 hover 操作 → 移动端改为点击/长按/左滑
  - PC 的内联编辑 → 移动端改为底部弹窗编辑
  - PC 的拖拽排序 → 移动端改为长按拖拽（MovableView）
  - PC 的多选批量操作 → 移动端改为左滑单选或长按多选

### 8. 代码组织规范（Taro 端强化）

> 2026-06-07 新增，2026-06-08 补充 hooks + PageLayout + 拆分规范

**组件拆分原则**：

| 场景 | 位置 | 文件结构 |
|------|------|---------|
| 被 ≥2 个页面/模块引用 | `src/components/组件名/` | `index.tsx` + `index.scss` |
| 仅被 1 个模块使用 | `src/pages/模块名/components/子组件名/` | `index.tsx` + `index.scss` |
| 页面本身 | `src/pages/页面名/` | `index.tsx` + `index.scss` + `index.config.ts` |

**文件长度限制**：
- 单文件（`.tsx`）不得超过 **200 行**，超过则拆分子组件（从严）
- 单文件（`.scss`）不得超过 **150 行**，超过则拆分样式文件

**强制使用的公共模块**（2026-06-08）：
- **PageLayout**：所有 TabBar 页面外层容器（统一 NavHeader + 内容 + TabBar）
- **useMonthSelector**：5 个页面共用的月份选择 hook
- **useCategoryLookup**：分类名称/图标查询（替代手写 cmap）
- **fmtAmount / fmtDate / fmtFriendlyDate**：金额和日期格式化统一从 `utils/format.ts` 导入

**样式存放规则**：
- 全局设计系统（CSS 变量、工具类、动画）→ `src/app.scss`
- 组件/页面自身样式 → 同目录 `index.scss`
- **禁止**新建 `.css` 文件，统一使用 SCSS
- **禁止**大段 inline styles（`style={{}}`），优先 SCSS class

### 8a. Hooks 拆分原则

> 2026-06-08 新增

**何时封装 Hook**：
- 同一个 state + useEffect + useMemo 组合在 **≥2 个页面**中使用 → 封装为 hook
- 示例：`useMonthSelector`（5 页），`useCategoryLookup`（3 页）

**Hook 命名和位置**：
- 通用 hook → `src/hooks/useXxx.ts`
- 模块专属 hook → `src/pages/模块名/hooks/useXxx.ts`
- 命名统一 `use` 前缀 + 驼峰

**禁止**：
- 跨页面复制粘贴相同逻辑（DRY 违反）
- 页面内定义可复用的数据转换函数

### 9. 骨架屏 & 空状态公共组件规范

> 2026-06-07 新增

`Skeleton` 和 `EmptyState` 是公共组件（放在 `src/components/`），但必须支持各模块的不同形态：

**Skeleton Props**：
```
type?: 'list' | 'card' | 'chart' | 'circle'
count?: number           // 骨架行数/个数，默认 3
```

各模块用法示例：
- 交易列表：`<Skeleton type="list" count={5} />`（5 行交易骨架）
- 分类卡片：`<Skeleton type="card" count={6} />`（6 个卡片骨架）
- 统计图表：`<Skeleton type="chart" />`（图表占位骨架）

**EmptyState Props**：
```
icon?: string            // emoji 图标，默认 '📝'
title: string            // 主文字，如 '暂无交易' / '暂无数据' / '暂无分类'
description?: string     // 副文字
actionText?: string      // 操作按钮文字
onAction?: () => void    // 操作按钮回调
mode?: 'empty' | 'error' // 模式：空数据 / 错误
```

各模块用法示例：
- 首页：`<EmptyState title="暂无交易记录" description="点击下方 + 开始记账" actionText="记一笔" />`
- 统计：`<EmptyState icon="📊" title="暂无数据" description="添加交易后可查看统计" />`
- 分类：`<EmptyState icon="📋" title="暂无分类数据" />`
- 错误：`<EmptyState mode="error" title="加载失败" description="请检查网络后重试" actionText="重试" />`

### 10. WXSS 兼容性

- **禁止**使用 `*` 通配符选择器（如 `.depth-stagger > *:nth-child(n)`），改用明确的标签选择器（如 `view`）
- **禁止**使用 CSS 转义符 `\`
- `!important` 格式需为 `! important`（带空格，WXSS 要求）
- 需要时参考 `config/strip-wxss-plugin.js` 自动处理兼容问题

### 11. 代码风格

- 样式优先使用 SCSS class 引用，减少 `style={{}}` 内联样式（与 v3.0 设计规范一致）
- 所有组件和页面使用 TypeScript + JSX
- 每个页面必须包含 `index.config.ts` 配置文件
- 全局 CSS 变量（颜色/字号/间距/边框）定义在 `app.scss` 中，通过 `var(--xxx)` 引用
