# 家庭记账项目 — 静记

> 自动注入记忆，每个新对话加载。

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
- **TabBar**: selectedColor 对齐 app.config.ts，4 Tab（首页/流水/报表/我的），移除中间 FAB
- **品牌**: 全局 "家庭记账"→"静记"，Logo "家"→"静"
- **记账入口**: 首页右下角悬浮 FAB 按钮（navigateTo 代替 switchTab）
- **构建**: weapp + h5 双平台零错误 ✅
