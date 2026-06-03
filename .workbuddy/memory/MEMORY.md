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
