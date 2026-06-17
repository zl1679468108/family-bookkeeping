# 静记后端

基于 NestJS 10 + TypeScript 5 的家庭记账后端 API 服务，使用 Supabase (PostgreSQL) 作为数据库，部署在腾讯云 CloudBase 云托管。

## 技术栈

- **框架**: NestJS 10
- **语言**: TypeScript 5
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT
- **文件存储**: Supabase Storage
- **邮件服务**: 邮件模板系统
- **部署**: Docker + 腾讯云 CloudBase 云托管

## 项目结构

```
backend/
├── src/
│   ├── main.ts                     # 应用入口
│   ├── app.module.ts               # 根模块
│   ├── config/                     # 配置模块
│   ├── auth/                       # 认证模块
│   ├── books/                      # 账本模块
│   ├── transactions/               # 交易记录模块
│   ├── statistics/                 # 统计分析模块
│   ├── budgets/                    # 预算模块
│   ├── categories/                 # 分类模块
│   ├── templates/                  # 交易模板模块
│   ├── map/                        # 地图模块
│   ├── reports/                    # 报表模块
│   ├── admin/                      # 管理后台模块
│   ├── icons/                      # 图标模块
│   ├── export/                     # 导出模块
│   ├── mail/                       # 邮件模块
│   ├── health/                     # 健康检查模块
│   └── supabase/                   # Supabase 服务
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
```

必填环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJI...` |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key` |
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |

### 本地开发

```bash
npm run start:dev
```

服务默认运行在 `http://localhost:3000/api`。

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm run start:prod
```

## API 接口文档

所有接口统一前缀：`/api`

---

### 1. 认证模块 (AuthController)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 用户登录 |
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/captcha` | 发送验证码 |
| POST | `/auth/forgot-password` | 忘记密码 |
| POST | `/auth/reset-password` | 重置密码 |
| GET | `/auth/profile` | 获取当前用户信息 |
| PUT | `/auth/profile` | 更新用户信息 |
| POST | `/auth/change-password` | 修改密码 |
| POST | `/auth/switch-account` | 切换账本 |

---

### 2. 交易记录模块 (TransactionController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/transactions` | 获取交易列表（支持分页、筛选） |
| POST | `/transactions` | 创建交易记录 |
| PUT | `/transactions/:id` | 更新交易记录 |
| DELETE | `/transactions/:id` | 删除交易记录 |
| POST | `/transactions/batch` | 批量删除交易 |
| POST | `/transactions/:id/receipt` | 上传凭证图片 |
| DELETE | `/transactions/:id/receipt` | 删除凭证图片 |

**查询参数**：`type`（income/expense）、`category`、`startDate`、`endDate`、`bookId`、`page`、`limit`

---

### 3. 统计分析模块 (StatisticsController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/statistics/summary` | 收支汇总 |
| GET | `/statistics/monthly-trend` | 月度趋势 |
| GET | `/statistics/category-breakdown` | 分类占比 |
| GET | `/statistics/member-comparison` | 成员对比 |
| GET | `/statistics/year-over-year` | 同比分析 |

---

### 4. 账本模块 (BooksController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/books` | 获取账本列表 |
| POST | `/books` | 创建账本 |
| PUT | `/books/:id` | 更新账本 |
| DELETE | `/books/:id` | 删除账本 |
| GET | `/books/:id/members` | 获取账本成员 |
| POST | `/books/:id/invite` | 邀请成员 |
| POST | `/books/join` | 加入账本 |
| POST | `/books/leave/:id` | 退出账本 |
| POST | `/books/transfer/:id` | 转让账本 |

---

### 5. 预算模块 (BudgetsController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/budgets` | 获取预算列表 |
| POST | `/budgets` | 创建预算 |
| PUT | `/budgets/:id` | 更新预算 |
| DELETE | `/budgets/:id` | 删除预算 |
| GET | `/budgets/status` | 预算执行状态 |
| POST | `/budgets/copy` | 复制预算 |

---

### 6. 分类模块 (CategoriesController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/categories` | 获取分类列表 |
| POST | `/categories` | 创建分类 |
| PUT | `/categories/:id` | 更新分类 |
| DELETE | `/categories/:id` | 删除分类 |
| PUT | `/categories/reorder` | 分类排序 |

---

### 7. 交易模板模块 (TemplatesController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/templates` | 获取模板列表 |
| POST | `/templates` | 创建模板 |
| PUT | `/templates/:id` | 更新模板 |
| DELETE | `/templates/:id` | 删除模板 |
| POST | `/templates/:id/execute` | 执行模板（快速记账） |
| PUT | `/templates/reorder` | 模板排序 |

---

### 8. 地图模块 (MapController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/map/transactions` | 获取交易地理分布 |
| GET | `/map/merchants` | 获取商户列表 |
| GET | `/map/members` | 获取成员位置 |
| POST | `/map/locations` | 添加地点 |
| GET | `/map/locations` | 获取地点列表 |

---

### 9. 报表模块 (ReportsController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/reports/annual` | 生成年度报表 |

---

### 10. 管理后台模块 (AdminController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/stats` | 获取系统统计 |
| GET | `/admin/users` | 获取用户列表 |
| PUT | `/admin/users/:id/role` | 修改用户角色 |
| PUT | `/admin/users/:id/status` | 启用/禁用用户 |
| GET | `/admin/transactions` | 查看所有交易 |

---

### 11. 图标模块 (IconsController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/icons` | 获取图标列表 |
| POST | `/icons` | 上传图标 |
| DELETE | `/icons/:id` | 删除图标 |

---

### 12. 导出模块 (ExportController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/export/transactions` | 导出交易记录（支持 Excel/PDF） |

---

### 13. 邮件模块 (MailController)

内部模块，不对外暴露接口。

---

## Docker 部署

### 构建镜像

```bash
docker build -t family-bookkeeping-backend .
```

### 运行容器

```bash
docker run -p 3000:3000 --env-file .env family-bookkeeping-backend
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 腾讯云 CloudBase 部署

### 环境信息

- **EnvId**: `family-bookkeeping-d7c9caa78340e`
- **CloudRun 服务名**: `family-bookkeeping-api-prod`
- **后端 API 地址**: https://family-bookkeeping-api-prod-259958-6-1305761531.sh.run.tcloudbase.com
- **前端访问地址**: https://family-bookkeeping-d7c9caa78340e-1305761531.tcloudbaseapp.com/
- **CloudBase 控制台**: https://tcb.cloud.tencent.com/dev?envId=family-bookkeeping-d7c9caa78340e#/platform-run/service/detail?serverName=family-bookkeeping-api-prod&tabId=overview&envId=family-bookkeeping-d7c9caa78340e

### 部署步骤

```bash
# 1. 构建前端
cd frontend && npm run build:prod && cd ..

# 2. 部署后端
npx mcporter call --stdio 'npx' --stdio-arg '@cloudbase/cloudbase-mcp@latest' --cwd . manageCloudRun --args '{"action":"deploy","serverName":"family-bookkeeping-api-prod","targetPath":"backend"}'

# 3. 部署前端
npx mcporter call --stdio 'npx' --stdio-arg '@cloudbase/cloudbase-mcp@latest' --cwd . manageHosting --args '{"action":"upload","localPath":"frontend/build","cloudPath":"/"}'
```

## 测试 API

### 健康检查

```bash
curl http://localhost:3000/api/health
```

### 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'
```

### 使用 Token 调用接口

```bash
TOKEN="your-jwt-token"
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN"
```

## 许可证

MIT

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

配置项：

- `SUPABASE_URL`: Supabase 项目 URL
- `SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `PORT`: 服务端口（默认 3000）
- `NODE_ENV`: 运行环境（development/production）

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run start:dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm run start:prod
```

## Docker 部署

### 构建镜像

```bash
docker build -t family-bookkeeping-backend .
```

### 运行容器

```bash
docker run -p 3000:3000 --env-file .env family-bookkeeping-backend
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## API 接口

### 健康检查

```
GET /api/health
```

### 交易记录

```
GET    /api/transactions           # 获取所有交易
GET    /api/transactions/:id       # 获取单个交易
POST   /api/transactions           # 创建交易
PUT    /api/transactions/:id       # 更新交易
DELETE /api/transactions/:id       # 删除交易
```

#### 查询参数

- `type`: 交易类型（income/expense）
- `category`: 分类
- `startDate`: 开始日期（YYYY-MM-DD）
- `endDate`: 结束日期（YYYY-MM-DD）

### 导出功能

```
GET /api/export/excel               # 导出 Excel
GET /api/export/pdf                 # 导出 PDF
```

#### 查询参数

与交易记录查询参数相同，支持筛选导出范围。

## 腾讯云 CloudBase 部署

### 环境信息

- **EnvId**: `family-bookkeeping-d7c9caa78340e`
- **CloudRun 服务名**: `family-bookkeeping-api-prod`
- **后端 API 地址**: https://family-bookkeeping-api-prod-259958-6-1305761531.sh.run.tcloudbase.com
- **前端访问地址**: https://family-bookkeeping-d7c9caa78340e-1305761531.tcloudbaseapp.com/
- **CloudBase 控制台**: https://tcb.cloud.tencent.com/dev?envId=family-bookkeeping-d7c9caa78340e#/platform-run/service/detail?serverName=family-bookkeeping-api-prod&tabId=overview&envId=family-bookkeeping-d7c9caa78340e

### 通过 MCP 部署

```bash
# 配置 mcporter
mkdir -p config && cat > config/mcporter.json << 'EOF'
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "description": "CloudBase MCP",
      "lifecycle": "keep-alive"
    }
  }
}
EOF

# 登录
npx mcporter call cloudbase.auth 'action=start_auth'

# 部署后端（从项目根目录）
npx mcporter call --stdio 'npx' --stdio-arg '@cloudbase/cloudbase-mcp@latest' --cwd . manageCloudRun --args '{"action":"deploy","serverName":"family-bookkeeping-api-prod","targetPath":"backend"}'

# 构建并部署前端
cd frontend && npm run build:prod && cd ..
npx mcporter call --stdio 'npx' --stdio-arg '@cloudbase/cloudbase-mcp@latest' --cwd . manageHosting --args '{"action":"upload","localPath":"frontend/build","cloudPath":"/"}'
```

## 测试 API

### 健康检查

```bash
curl http://localhost:3000/api/health
```

### 获取交易列表

```bash
curl http://localhost:3000/api/transactions
```

### 导出 Excel

```bash
curl -O http://localhost:3000/api/export/excel
```

### 导出 PDF

```bash
curl -O http://localhost:3000/api/export/pdf
```

## 许可证

MIT
