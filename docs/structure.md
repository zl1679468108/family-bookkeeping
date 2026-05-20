# 家庭记账应用项目结构

## 整体架构

项目采用前后端分离架构：

```
family-bookkeeping/
├── frontend/              # 前端应用（React）
├── backend/               # 后端服务（NestJS）
└── docs/                  # 文档
```

---

## 前端结构（frontend）

```
frontend/
├── public/                # 静态资源
├── src/                   # 源代码
│   ├── components/         # React 组件
│   │   ├── Button/        # 按钮组件
│   │   ├── ChartCard/     # 图表卡片
│   │   ├── FilterBar/     # 筛选栏
│   │   ├── Form/          # 表单组件
│   │   ├── Header/        # 头部组件
│   │   ├── ImageUploader/ # 图片上传
│   │   ├── Layout/        # 布局组件
│   │   ├── Sidebar/       # 侧边栏
│   │   ├── StatCard/      # 统计卡片
│   │   ├── TransactionsList/ # 交易列表
│   │   └── ui/            # UI 基础组件
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.tsx   # 仪表板
│   │   ├── Transactions.tsx # 交易记录
│   │   ├── Reports.tsx    # 统计报表
│   │   └── AddTransaction.tsx # 添加交易
│   ├── services/           # 服务层
│   │   ├── supabase.ts    # Supabase 客户端（直连模式）
│   │   └── api.ts         # 后端 API 调用
│   ├── routes/            # 路由配置
│   ├── utils/             # 工具函数
│   └── styles/            # 样式文件
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vercel.json
├── .gitignore
└── .env.*                # 环境变量配置
```

**前端技术栈**：
- React 18
- TypeScript
- Tailwind CSS
- React Query
- React Router

## 文档结构（docs）

```
docs/
├── requirements.md         # 需求文档
├── modules.md             # 模块文档
├── structure.md           # 项目结构文档
└── design.html            # 设计稿
```

---

```
backend/
├── src/                   # 源代码
│   ├── main.ts            # 应用入口
│   ├── app.module.ts      # 根模块
│   ├── supabase/          # Supabase 服务
│   │   ├── supabase.module.ts
│   │   └── supabase.service.ts
│   ├── transaction/       # 交易模块
│   │   ├── transaction.module.ts
│   │   ├── transaction.controller.ts
│   │   └── transaction.service.ts
│   ├── export/            # 导出模块
│   │   ├── export.module.ts
│   │   ├── export.controller.ts
│   │   └── export.service.ts
│   └── health/            # 健康检查模块
│       ├── health.module.ts
│       └── health.controller.ts
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example          # 环境变量示例
```

**后端技术栈**：
- NestJS
- TypeScript
- Supabase SDK
- ExcelJS
- PDFKit

---

## 部署架构

### 开发环境

```
┌──────────────┐     HTTP      ┌──────────────┐     SQL      ┌───────────┐
│  前端 React  │ ────────────> │  NestJS API  │ ──────────> │ Supabase  │
│  localhost   │ <──────────── │  localhost   │ <────────── │ PostgreSQL│
└──────────────┘               └──────────────┘             └───────────┘
```

### 生产环境

```
┌──────────────┐              ┌──────────────┐              ┌───────────┐
│   用户浏览器   │ ───────────> │ CloudBase    │ ──────────> │ Supabase  │
│              │              │ 云托管(NestJS)│              │ PostgreSQL│
└──────────────┘              └──────────────┘              └───────────┘
     │                             │
     │ HTTPS                        │ HTTPS
     ▼                             ▼
┌──────────────┐              ┌──────────────┐
│  CDN/静态托管 │              │ CloudBase    │
│  (前端 React) │              │ 容器服务     │
└──────────────┘              └──────────────┘
```

---

## 环境变量配置

### 前端环境变量

```bash
# .env.development
REACT_APP_API_BASE_URL=http://localhost:3000/api

# .env.production
REACT_APP_API_BASE_URL=https://你的CloudBase域名/api
```

### 后端环境变量

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
NODE_ENV=production
```

---

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm start
```

### 后端开发

```bash
cd backend
npm install
npm run start:dev
```

### Docker 部署

```bash
cd backend
docker build -t family-bookkeeping-api .
docker run -p 3000:3000 --env-file .env family-bookkeeping-api
```
