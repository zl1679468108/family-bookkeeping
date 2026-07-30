# 财猫家庭记账

一个基于 React 的家庭记账应用，支持多人协作、图片识别、数据分析、地图定位和响应式设计。

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS + SCSS
- **后端**: NestJS（部署在腾讯云 CVM，域名 `zlspace.site`）
- **数据库访问**: 通过 NestJS REST API（非直连数据库）
- **数据管理**: React Query（@tanstack/react-query）
- **图表**: ECharts
- **地图**: 高德地图 JS API 2.0
- **图片识别**: Tesseract.js
- **构建工具**: Create React App

## 项目结构

```
frontend/
├── public/                          # 静态文件
├── src/
│   ├── components/                  # 通用组件（17 个目录）
│   │   ├── AuthLayout/              # 认证布局
│   │   ├── FilterBar/               # 筛选栏
│   │   ├── FilterChip/              # 筛选标签
│   │   ├── GlobalModal/             # 全局弹窗
│   │   ├── NoBooksRequiredModal/    # 无需账本提示弹窗
│   │   ├── PageProgressBar/         # 页面进度条
│   │   ├── Sidebar/                 # 侧边栏导航
│   │   ├── SwitchAccountModal/      # 切换账号弹窗
│   │   └── ui/                      # 基础 UI 组件
│   │       ├── Button/              # 按钮
│   │       ├── Card/                # 卡片
│   │       ├── DetailItem/          # 详情项
│   │       ├── Dropdown/            # 下拉菜单
│   │       ├── Drawer/              # 抽屉
│   │       ├── EmptyState/          # 空状态
│   │       ├── IconGrid/            # 图标网格
│   │       ├── Input/               # 输入框
│   │       ├── LocationDisplay/     # 位置展示
│   │       ├── Pagination/          # 分页
│   │       ├── RankList/            # 排行榜
│   │       ├── SegControl/          # 分段控制
│   │       ├── Skeleton/            # 骨架屏
│   │       ├── Space/               # 间距
│   │       ├── StatCard/            # 统计卡片
│   │       └── Textarea/            # 文本域
│   ├── pages/                       # 页面组件（19 个路由）
│   │   ├── Dashboard/               # 仪表盘
│   │   ├── Transactions/            # 交易记录
│   │   ├── AddTransaction/          # 添加交易（含图片识别、位置选择）
│   │   ├── Reports/                 # 统计报表
│   │   ├── AnnualReport/            # 年度报告
│   │   ├── Calendar/                # 日历视图
│   │   ├── Categories/              # 分类管理
│   │   ├── Books/                   # 账本管理
│   │   ├── Templates/               # 模板管理
│   │   ├── Budgets/                 # 预算管理
│   │   ├── Map/                     # 地图视图
│   │   ├── Admin/                   # 管理后台
│   │   │   ├── AdminDashboard/      # 管理仪表盘
│   │   │   ├── AdminUsers/          # 用户管理
│   │   │   ├── AdminTransactions/   # 交易管理
│   │   │   └── AdminLayout/         # 管理后台布局
│   │   └── User/                    # 用户模块
│   │       ├── Login/               # 登录
│   │       ├── Register/            # 注册
│   │       ├── ForgotPassword/      # 忘记密码
│   │       └── Profile/             # 个人资料
│   ├── services/                    # API 服务层（11 个文件）
│   │   ├── api.ts                   # 基础 API 封装
│   │   ├── booksApi.ts              # 账本相关 API
│   │   ├── categoriesApi.ts         # 分类相关 API
│   │   ├── transactionsApi.ts       # 交易相关 API
│   │   ├── reportsApi.ts            # 报表相关 API
│   │   ├── statisticsApi.ts         # 统计相关 API
│   │   ├── budgetsApi.ts            # 预算相关 API
│   │   ├── templatesApi.ts          # 模板相关 API
│   │   ├── iconsApi.ts              # 图标相关 API
│   │   ├── adminApi.ts              # 管理后台 API
│   │   ├── mapApi.ts                # 地图相关 API
│   │   └── amapManager.ts           # 高德地图管理
│   ├── utils/                       # 工具函数
│   ├── styles/                      # 全局样式
│   └── App.tsx                      # 应用入口
├── .env.development                 # 开发环境变量
├── .env.production                  # 生产环境变量
├── .env.example                     # 环境变量示例
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 功能特性

- 多人协作记账（支持多账本、成员邀请）
- 图片识别（Tesseract.js OCR）
- 数据可视化（ECharts 图表）
- 地图视图（高德地图）
- 日历视图（含农历）
- 年度报告生成
- 预算管理
- 模板快速记账
- 管理后台
- 响应式设计

## 本地开发

### 环境要求

- Node.js >= 20.0.0

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.development`，并填写：

```bash
# 后端 API 地址（NestJS 服务）
REACT_APP_API_BASE_URL=http://localhost:3000/api

# 高德地图 API Key
REACT_APP_AMAP_KEY=your-amap-key
REACT_APP_AMAP_SECRET=your-amap-secret
```

### 启动开发服务器

```bash
npm start
```

开发服务器运行在 `http://127.0.0.1:3001`。

### 构建生产版本

```bash
npm run build
```

### 其他命令

```bash
npm run lint          # 代码检查
npm run lint:fix      # 自动修复
npm run test          # 运行测试
```

## 部署

项目前端构建后通过 Nginx 托管于腾讯云 CVM（详见 `docs/deployment.md`），后端 NestJS 服务同样部署在 CVM。
