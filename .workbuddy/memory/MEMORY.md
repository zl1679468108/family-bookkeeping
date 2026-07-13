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

| 层 | 关键依赖 |
|---|---------|
| 前端 PC | Tailwind v3, react-query v5, React Router v6(HashRouter), ECharts, DM Sans |
| 后端 | Supabase SDK, JWT(bcryptjs), exceljs, pdfkit |
| 数据库 | 10张表直接 SDK 操作，无 ORM |

## 启动 & 端口

- 前端 dev: `HOST=127.0.0.1 PORT=3001 npm start`
- 后端 dev: `npm run start:dev` → :3000
- 前端 prod: `PORT=3002 npm start`

## 项目结构

```
frontend/src/
├── components/ (Sidebar,AuthLayout,StatCard,ChartCard,TransactionsList,FilterBar,BookSwitcher,ConfirmDialog,ui/...)
├── pages/ (Dashboard,Transactions,AddTransaction,Reports,Budgets,Calendar,Books,Categories,TemplateManager,AnnualReport,Map,User/Login|Register|ForgotPassword|Profile,Admin)
├── services/ (api.ts,statisticsApi,budgetsApi,booksApi,categoriesApi,mapApi,templatesApi,reportsApi,amapManager.ts)
├── hooks/ (useBook,useCategories,useMemberColors,useMapInstance,useLocationSharing,useFocusItem,useBudgetNavigation...)
├── utils/ (auth,theme,notifications,common,memberColors,categoryColors,emojiPresets)
└── styles/ (design-tokens.css,globals.css,layout.scss)

backend/src/
├── 业务: Supabase,Auth,Transaction,Categories,Statistics,Export,Budgets,Books,Map,Reports,Templates
└── 辅助: mail/,common/(异常过滤器+响应拦截器),utils/
```

## PC 端设计系统 (2026-06-10 完成)

- 主色: `#2D9D8A` 绿色系（48 CSS 变量 + 深色模式）
- 字体: DM Sans + DM Mono（@fontsource 本地托管）
- 品牌: "静记"，Logo "静" 字渐变方块
- 认证页: 左右分栏（AuthLayout + SVG 插画 React 组件）
- 按钮: 5 级（primary/secondary/outline/ghost/danger）
- 设计令牌: `frontend/src/styles/design-tokens.css`
- 实施计划: `docs/05-PC端设计大调整实施计划.md`
- ⚠️ **主操作按钮 & 选中激活态统一用 `--pr` 绿**：禁止用 `--fg` 做填充背景（2026-07-12 修复 Transactions/AddTransaction/Profile/Admin 原生 `btn btn-primary` 及 `.form-tabs/.seg-opt/.filter-chip/.rprs` 的 `.active` 误用 `--fg` 黑底）。`Button` 组件(`ui-btn--primary`) 与 `SegControl`/图标网格本已正确。tooltip 浮层气泡黑底白字为合理语义，保留。

## 地图 & 报表

- **地图**: 高德地图 JS API 2.0, AmapManager 实例池化, 足迹/热力/商户聚合
- **报表**: 年度报告(8子模块)+ECharts趋势图, 交易模板管理
- **日历**: CSS Grid 月视图 + 月度汇总

## P2 需求状态

| 编号 | 需求 | 状态 |
|------|------|:---:|
| P2-1 | 收据上传 | ✅ |
| P2-2 | 年度报告 | ✅ |
| P2-3 | 周期交易/自动记账 | 📋 |
| P2-4 | 账单提醒 | 📋 |
| P2-5 | 多账本 | ✅ |
| P2-6 | 储蓄目标 | 📋 |
| P2-7 | 家庭转账/AA记账 | 📋 |

## 数据库 (10 张表 + P2 待实现 6 张)

现有: users, password_resets, user_sessions, transactions, budgets, categories, books, book_members, member_locations, transaction_templates

P2: recurring_transactions, recurring_logs, notifications, notification_preferences, savings_goals, settlements

SQL 初始化: `docs/database-init.sql`

## 环境变量

前端: `.env.development` → `API_BASE_URL=http://localhost:3000/api`
后端: `.env.development/.env.production` → `SUPABASE_URL/KEY, JWT_SECRET, 邮件`

## 执行规范

### 文档同步
每次对话启动自动校验 `docs/` 目录下 5 个文件存在性: database-init.sql(⚠️重点), 01~04-项目*.md

### DB 变更提醒
涉及表结构变更(SQL DDL/约束/索引/触发器)时写入当天日志并提醒用户执行 SQL。

## Taro 规范速查

详见 Taro 项目 `.workbuddy/memory/` 或 `docs/` 中的完整规范。核心要点：

- **SCSS only**，禁止 .css
- **Pages 大驼峰**（AddTransaction, Home, ForgotPassword）
- **Picker 弹选日期**，禁止左右箭头
- 组件归属：≥2 处使用→`components/`，1 处→页面内 `components/`
- **统一 ConfirmDialog** 做删除确认
- **统一 BottomSheet**（`taro/src/components/BottomSheet`）做工作台各模块的详情/表单弹窗：封装遮罩+滑入动画+SheetHeader(左返回/中标题/右关闭)+内容区+footer(顶边+安全区)+整屏 loading。`visible?:boolean`(可选，父用 `{cond && <BottomSheet/>}` 挂载)，`footer` 传 `null` 表示无操作区。各页 scss 只需保留业务内容样式，基础结构(圆角/边框/安全区)一律交给 BottomSheet。**删除流程统一先 `closeDetail()` 再弹 ConfirmDialog**（否则 Sheet 关闭后名称丢失）。
- **NavHeader 公共组件** 做导航栏
- **颜色**: 收入/支出仅用于金额，交互激活色用绿色系
- 对齐 PC 端全部功能，hover→点击/长按、拖拽→MovableView
- 单文件 ≤200 行（tsx）/ ≤150 行（scss）
- 禁止 `*` 通配符、CSS 转义符；`!important` → `! important`

## Taro 端设计对齐 (2026-06-10) ✅

- **设计系统版本**: v5.0，对齐 PC 端绿色主题 (#2D9D8A)
- **改动方式**: 令牌级——app.scss 变量 + SVG 图标批量替换，无需改动组件
- **颜色**: Primary #5B9A7A→#2D9D8A, Expense #D4785C→#E06055, Income 独立 #3BA272, Bg #F5F2ED→#F6F7F4
- **SVG 图标**: 20+ 文件 stroke 色对齐（#5B9A7A→#2D9D8A, #B0ADA6→#8B8E89）
- **TabBar**: selectedColor 对齐 app.config.ts，4 Tab（首页/流水/工作台/我的）；工作台=账本/分类/模板/预算入口页；流水页含记一笔 FAB；报表/日历/地图/年报模块已移除（小程序不做，复用同一后端）
- **品牌**: 全局 "家庭记账"→"静记"，Logo "家"→"静"
- **记账入口**: 首页右下角悬浮 FAB 按钮（navigateTo 代替 switchTab）
- **构建**: weapp + h5 双平台零错误 ✅；`npx tsc --noEmit` 亦零错误（2026-07-06 清理历史报错 + 删孤儿 lunarUtils.ts）
- **TemplateManager 样式缺陷(2026-07-06 修复)**: tsx 类名 `tpl-card`/`tpl-pill`/`tpl-fab`/`tpl-mask` 及 sheet `__` 子类曾与 scss 不匹配，整页无样式，已重写 `pages/TemplateManager/index.scss` 补齐
- **Onboarding 引导页 (2026-07-06)**: `pages/Onboarding/index`（choice/create/join 三模式），`app.tsx` 的 `OnboardingGate` 守卫在「已登录+账本加载完+无账本」时 reLaunch 到引导页；`BookContext.refetchBooks()` 创建/加入后刷新账本列表（修复 PC 端创建后缓存不失效导致的引导循环）

## Taro 暗色模式实现要点（2026-07-07 修复）

- **主题切换机制**：`ThemeContext` 存 `theme` 到 Storage；`PageLayout` 根 View 挂 `theme-dark` class（`isDark ? "theme-dark" : ""`），组件用 `useTheme()` 读 `isDark`
- **⚠️ 暗色失效根因**：兼容别名（`--surface`/`--fg-3`/`--border`/`--fg-2`/`--primary`/`--income-*`/`--expense-*` 等）只在 `app.scss` 的 `page {}` 内用 `var()` 定义一次；而 `.theme-dark` 只挂在 PageLayout 的**后代 View** 上。微信小程序里 `page{}` 内的 `var()` 别名**不会随后代 `.theme-dark` 动态重解析**，导致暗色下这些别名仍取浅色值（"浅卡+浅字看不清"）
- **✅ 修复方式**：在 `app.scss` 的 `.theme-dark` 块内**重新绑定所有兼容别名**指向暗色基础变量（如 `--surface: var(--srf)`），后代组件即可正确取暗色值
- **接入约束**：凡是不用 `PageLayout` 的页面（记一笔/引导/登录/注册/忘记密码）必须**手动在根 View 挂 `theme-dark` class**，否则暗色模式对该页完全无效
- **硬编码禁忌**：颜色一律走 CSS 变量；禁止 `#ffffff`/`#f5f6f3`/`rgba(255,255,255,…)` 等硬编码表面色（用 `--surface`/`--bg`/`--bdL`），白字 `color:#fff` 在彩色/绿色背景上保留
- **⚠️ 原生导航栏(标题栏)不吃 CSS 变量**：`app.config.ts` 中 `navigationBarBackgroundColor`/`navigationBarTextStyle` 是原生组件配置，切暗色后不会自动变。**TabBar 也需 JS 驱动**（见下方 custom-tab-bar 条目）；标题栏需在主题变化时用 `Taro.setNavigationBarColor()` JS 驱动
- **✅ 修复方式（第三版）**：`hooks/useNavBarTheme.ts` 在 **mount + useDidShow + themeChange 事件时无条件调用** `Taro.setNavigationBarColor({ frontColor, backgroundColor })`（无 animation 参数）；暗色 `#ffffff`/`#1A1C19`，亮色 `#000000`/`#FFFFFF`。已在 `PageLayout` + 5 个独立页面调用
- **⚠️ custom-tab-bar 在页面组件树外部 + 样式隔离**：Taro 的 `custom-tab-bar/index.tsx` 渲染的 TabBar 处于**特殊独立层**，PageLayout 上的 `.theme-dark` class 无法到达。且 custom-tab-bar 是微信**原生自定义组件**，存在**组件样式隔离**——即使挂了 `theme-dark` class，`app.scss .theme-dark` 下的 CSS 变量也**无法穿透到组件内部**
- **✅ TabBar 最终方案（2026-07-07 确认）**：背景/边框/文字色全部通过 **JS 内联 style** 设置（`components/TabBar/index.tsx` 的 `containerStyle()`/`labelStyle()`），完全绕过 SCSS 样式隔离和 CSS 变量继承链；主题来源为初始读 Storage + 监听 `themeChange` 全局事件
- **✅ 导航栏防闪烁方案（第三版）**：**不用任何幂等**——每次 mount + `useDidShow` 都无条件调用 `setNavigationBarColor()`（无 animation）。因为 **switchTab 时微信一定重置导航栏为 app.config 默认色**，必须每次补设；同值重复调用开销 ≈ 0
- **验证**：`npx tsc --noEmit` 零错误 + `npm run build:weapp` 编译通过

## Taro 构建产物目录（⚠️ 极易踩坑，已因此误判过构建失败）

- `build:weapp` / `build:h5` 等 `build:*` 命令 = 生产构建，`config/index.ts` 设 `OUTPUT_ROOT = isProd ? "dist-prod" : "dist"`，**产物输出到 `taro/dist-prod/`**（不是 `dist/`）。
- `start:weapp` / `start:h5` 等 `start:*` = 开发 watch 构建（⚠️ 脚本名是 `start` 不是 `dev`！），输出到 `taro/dist/`。package.json 实际只有 `build:weapp`/`build:h5`/`start:weapp`/`start:h5`，**没有 `dev:weapp`**。
- **微信开发者工具导入/刷新预览时，build 产物请用 `dist-prod` 目录**。检查构建是否成功应 `ls taro/dist-prod/...`，而非 `ls dist/`（否则会误判构建失败、反复重 build）。
- `npm run build:weapp` 用 `| cat` / `| tail` 管道时 npm 进程可能不退出（task 长期 running 假死）；改用 `> /tmp/build.log 2>&1` 重定向可令其正常 exit。

## Taro 页面滚动/吸顶布局坑（2026-07-08 确认）

- **PageLayout 根容器必须锁死高度**：`.page-layout` 用 `height:100vh; overflow:hidden`，**绝不用 `min-height:100vh`**。否则长列表撑开容器 → ScrollView 无确定高度 → 退化成页面整体滚动 → header 吸顶失效、随列表滚走。
- **吸顶标准做法**：需固定的头部放进 `PageLayout` 的 `header` 插槽（渲染在 ScrollView 外部、天然固定），配合 `onScroll` prop 切换阴影类；**绝不用 `position:sticky`**（ScrollView 内部不生效）。
- **组件样式去向**：Taro 把组件 .scss 合并进 `dist-prod/common.wxss`（全局共享），不在 `dist-prod/components/<Name>/` 单文件；验证改动是否编入应 grep `common.wxss`。
