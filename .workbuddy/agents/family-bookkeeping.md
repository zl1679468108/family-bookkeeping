# 家庭记账 (Family Bookkeeping) - 项目 Agent

## 项目概述

一个前后端分离的家庭记账 Web 应用，支持交易记录管理、统计报表、数据导出等功能。

## 技术栈

### 前端 (frontend/)

| 技术 | 版本/说明 |
|------|----------|
| 框架 | React 18 + TypeScript |
| 构建工具 | Create React App (react-scripts 5.0.1) |
| 路由 | react-router-dom v6.22.3 (HashRouter) |
| 状态管理/数据请求 | @tanstack/react-query v5.20 |
| 样式方案 | Tailwind CSS v3.3.3 + SCSS/SASS |
| UI 图标 | lucide-react |
| 日期处理 | date-fns |
| OCR 识别 | tesseract.js (用于票据识别) |

### 后端 (backend/)

| 技术 | 版本/说明 |
|------|----------|
| 框架 | NestJS v10.3.0 |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | 自建 JWT (bcryptjs + SHA256) |
| 导出 | ExcelJS + PDFKit |
| 邮件 | nodemailer |

## 目录结构

```
family-bookkeeping/
├── frontend/                    # 前端 React 应用
│   └── src/
│       ├── components/          # 通用组件
│       │   ├── ChartCard/       # 图表卡片（ECharts 真图表）
│       │   ├── CategoryRanking/ # 分类排行表
│       │   ├── DateRangeFilter/ # 时间范围筛选器
│       │   ├── Header/          # 页面头部
│       │   ├── Layout/          # 旧版布局（已废弃）
│       │   ├── Sidebar/         # 侧边栏导航
│       │   └── StatCard/        # 统计卡片
│       ├── pages/               # 页面组件（懒加载）
│       │   ├── Dashboard.tsx    # 仪表板/首页
│       │   ├── Transactions.tsx # 交易记录
│       │   ├── Reports.tsx      # 统计报表（前端后端联动）
│       │   ├── AddTransaction.tsx # 添加交易
│       │   └── User/            # 登录/注册/忘记密码
│       ├── routes/              # 路由配置
│       ├── services/            # API 服务层
│       │   ├── api.ts           # 通用请求 + 交易/认证 API
│       │   └── statisticsApi.ts # 统计报表 API
│       ├── types/               # TypeScript 类型定义
│       │   └── statistics.ts    # 统计相关类型
│       ├── utils/               # 工具函数
│       │   ├── auth.tsx         # 认证上下文 (AuthProvider/useAuth)
│       │   ├── common.ts        # 通用工具
│       │   ├── commonDic.ts     # 分类字典（食品/交通/购物等）
│       │   └── notifications.tsx # 通知/Toast 工具（notify 函数）
│       └── App.tsx              # 根组件
├── backend/                     # 后端 NestJS 应用
│   └── src/
│       ├── auth/                # 认证模块
│       ├── transaction/         # 交易模块
│       ├── statistics/          # 统计模块（聚合查询 + 环比计算）
│       ├── export/              # 导出模块 (Excel/PDF)
│       ├── health/              # 健康检查
│       ├── supabase/            # Supabase 数据库服务
│       └── common/              # 公共工具 (拦截器/过滤器)
└── docs/
    ├── database-init.sql        # 数据库初始化脚本（单一真实来源）
    ├── 01-项目结构.md            # 项目结构文档
    ├── 02-项目功能.md            # 功能说明文档
    ├── 03-数据模型.md            # 数据模型文档
    ├── 04-项目迭代.md            # 迭代历史记录
    └── 05-statistics-system-design.md  # 统计模块系统设计
```

## 路由表

| 路径 | 页面 | 需登录 | 说明 |
|------|------|--------|------|
| `/login` | Login | 否 | 登录页 |
| `/register` | Register | 否 | 注册页 |
| `/forgot-password` | ForgotPassword | 否 | 忘记密码 |
| `/` | Dashboard | 是 | 概览仪表板 |
| `/transactions` | Transactions | 是 | 交易记录列表 |
| `/reports` | Reports | 是 | 统计报表 |
| `/add` | AddTransaction | 是 | 添加交易 |

## 后端 API 端点

基路径: `/api`，统一响应格式: `{ success, message, data }`

### 认证 (`/api/auth`)
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录 |
| POST | `/auth/logout` | 退出登录 |
| GET | `/auth/profile` | 获取用户信息 |
| PUT | `/auth/profile` | 更新用户信息 |

### 交易 (`/api/transactions`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/transactions` | 列表（支持 ?type/category/startDate/endDate） |
| GET | `/transactions/:id` | 单条详情 |
| POST | `/transactions` | 创建 |
| PUT | `/transactions/:id` | 更新 |
| DELETE | `/transactions/:id` | 删除 |

### 导出 (`/api/export`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/export/excel` | 导出 Excel |
| GET | `/export/pdf` | 导出 PDF |

### 统计 (`/api/statistics`)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/statistics/summary?startDate=&endDate=` | 收支汇总 + 环比变化 |
| GET | `/statistics/monthly-trend?months=6&type=expense` | 月度趋势（按月聚合） |
| GET | `/statistics/category-breakdown?startDate=&endDate=&type=expense` | 分类占比（Top 7 + 其他） |

## 数据库表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户 | id(UUID), email, username, password_hash |
| `transactions` | 交易记录 | id(serial), amount, category, type(income/expense), date, user_id |
| `user_sessions` | 会话 | id, user_id, token_hash |
| `password_resets` | 密码重置 | id, user_id, token, code |
| `budgets` | 预算 | id, user_id, category, amount, month |

## 分类体系

### 支出分类
| key | 名称 | 图标 |
|-----|------|------|
| food | 食品 | 🛒 |
| food_delivery | 餐饮 | 🍜 |
| transport | 交通 | 🚗 |
| shopping | 购物 | 🛍️ |
| utilities | 通讯 | 📱 |
| housing | 居住 | 🏠 |
| entertainment | 娱乐 | 🎮 |
| medical | 医疗 | 💊 |
| education | 教育 | 📚 |
| other | 其他 | 📌 |

### 收入分类
| key | 名称 | 图标 |
|-----|------|------|
| salary | 工资 | 💼 |
| bonus | 奖金 | 🎁 |
| investment | 投资 | 📈 |
| freelance | 兼职 | 💻 |
| gift | 礼金 | 🎁 |
| other_income | 其他收入 | 💰 |

## 编码规范

### 前端
- 组件使用 React.FC 类型声明
- 路由页面使用 React.lazy 懒加载
- API 调用统一通过 `services/api.ts` 的 `request()` 函数
- 认证状态通过 `useAuth()` hook 获取
- 样式优先使用 Tailwind CSS，特殊样式用 SCSS Module
- 侧边栏在移动端切换为顶部导航
- **用户提示统一使用 `notify()`**（`utils/notifications.ts`），严禁使用 `alert()` / `confirm()` 等浏览器原生弹窗

### 后端
- 模块化架构：每个功能独立 Module
- 认证通过 TokenAuthGuard + @CurrentUser 装饰器
- 数据库操作统一通过 SupabaseService
- 全局响应拦截器统一包装 `{ success, message, data }`
- 全局异常过滤器处理 HTTP 异常

### 通用
- 金额使用 `formatAmount()` 格式化
- 分类使用 `commonDic.ts` 中的字典映射
- API Token 存储在 localStorage (`auth_token`)
- 启动端口：前端 3001，后端 3000

## 项目维护规范

### 数据库变更
- **凡是涉及数据库结构变更（新增表、修改字段、新增索引等），必须将 SQL 写入 `docs/database-init.sql`**
- 该文件是数据库的单一真实来源，保持与 Supabase 实际结构同步
- 变更时标注日期和原因

### 文档同步（CRITICAL）
- **功能新增/变更后，必须同步更新 `docs/` 目录下的对应文档：**
  - `01-项目结构.md` — 新增组件/模块、目录结构变更、依赖新增
  - `02-项目功能.md` — 新增功能描述、模块功能变更、前后端交互图更新
  - `03-数据模型.md` — 数据表/字段变更、ER 关系图更新
  - `04-项目需求.md` — 每次新迭代前，思考和补充产品需求池
- **本 `agent.md` 也需保持同步**（端点、组件、已知问题等）

## 已知问题 / 待办

1. **budgets 表已建但无后端 API** — 预算管理功能未实现
2. **导出功能需适配统计时间范围** — 报表导出按钮尚未实现（P1）
3. **饼图点击下钻** — 点击分类跳转交易列表并自动筛选尚未实现（P1）
4. **收入分析 Tab** — Reports 页面目前仅展示支出侧，收入侧分析尚未开发（P1）

## 启动命令

```bash
# 后端
cd backend && npm run start:dev    # 开发模式，端口 3000

# 前端
cd frontend && npm start           # 开发模式，端口 3001
```
