# 静记

一个基于 React 的现代化记账应用，支持图片识别、数据分析和响应式设计。

## 功能特性

- 📱 **响应式设计** - 适配手机、平板和桌面设备
- 📊 **数据可视化** - 收支趋势、分类统计
- 📸 **图片识别** - 上传收据图片自动识别金额和分类
- 🔐 **用户认证** - 基于 Supabase 的安全认证
- 📱 **现代界面** - 现代极简设计风格

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **后端**: Vercel Serverless Functions
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel
- **图片存储**: Supabase Storage

## 项目结构

```
family-bookkeeping/
├── public/                 # 静态文件
│   └── index.html          # 主入口文件
├── src/                    # 源代码
│   ├── components/         # React 组件
│   │   ├── Button/         # 按钮组件
│   │   ├── ChartCard/      # 图表卡片组件
│   │   ├── FilterBar/      # 筛选栏组件
│   │   ├── Form/           # 表单组件
│   │   ├── Header/         # 头部组件
│   │   ├── ImageUploader/  # 图片上传组件
│   │   ├── Layout/         # 布局组件
│   │   ├── Sidebar/        # 侧边栏组件
│   │   ├── StatCard/       # 统计卡片组件
│   │   ├── TransactionsList/# 交易列表组件
│   │   └── ui/             # UI 基础组件
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.tsx   # 仪表板页面
│   │   ├── Transactions.tsx # 交易记录页面
│   │   ├── Reports.tsx     # 统计报表页面
│   │   └── AddTransaction.tsx # 添加交易页面
│   ├── services/           # 服务层
│   │   └── supabase.ts     # Supabase 客户端
│   ├── utils/              # 工具函数
│   │   ├── auth.tsx        # 认证工具
│   │   ├── common.ts       # 通用工具函数（金额格式化、日期格式化）
│   │   └── commonDic.ts    # 字典配置（分类、类型、图标映射）
│   └── styles/             # 样式文件
│       └── globals.css     # 全局样式
├── api/                    # Vercel Serverless Functions
│   └── transactions.js     # 交易 API
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
├── tailwind.config.js      # Tailwind 配置
└── vercel.json             # Vercel 配置
```

## 核心数据结构

### 数据库存储格式

**重要**: 数据库只存储字典键值，不存储图标！图标通过字典动态获取。

```sql
-- transactions 表结构
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,    -- 金额（数字）
  category VARCHAR(50) NOT NULL,     -- 分类键（如 'food', 'transport'）
  type VARCHAR(10) NOT NULL,         -- 类型键（'income' 或 'expense'）
  date DATE NOT NULL,                -- 日期
  description TEXT,                  -- 备注
  image_url TEXT,                    -- 图片URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 部署指南

### 1. 创建 Supabase 账户

1. 访问 [Supabase](https://supabase.com/) 并创建免费账户
2. 创建新项目（例如命名为 `family-bookkeeping`）
3. 在项目设置中获取以下信息：
   - `SUPABASE_URL` - 项目 URL
   - `SUPABASE_ANON_KEY` - 匿名 API 密钥

### 2. 创建数据库表

在 Supabase 的 SQL 编辑器中执行以下 SQL：

```sql
-- 创建 transactions 表
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### 3. 配置环境变量

#### 开发环境

在项目根目录创建 `.env.local` 文件：

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 生产环境（Vercel）

在 Vercel 项目设置中添加环境变量：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 4. 本地开发

```bash
# 克隆项目
git clone your-repo-url
cd family-bookkeeping

# 安装依赖
npm install

# 启动开发服务器
npm start
```

访问 `http://localhost:3000` 查看应用。

### 5. 部署到 Vercel

#### 方式一：使用 Vercel CLI

```bash
# 安装 Vercel CLI（如果未安装）
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

#### 方式二：使用 GitHub 自动部署

1. 将代码推送到 GitHub 仓库
2. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "Add New Project"
4. 选择你的 GitHub 仓库
5. 配置项目设置（环境变量在 Settings -> Environment Variables 中添加）
6. 点击 "Deploy"

### 6. 配置图片存储（可选）

如果需要使用图片识别功能：

1. 在 Supabase 中创建存储桶（如 `receipts`）
2. 设置存储桶权限为公开可读
3. 在 API 中配置上传逻辑

## 开发指南

```bash
# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行类型检查
npm run typecheck

# 格式化代码
npm run format
```
