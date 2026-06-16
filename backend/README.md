# 静记后端

基于 NestJS 的后端 API 服务，提供交易数据的增删改查和 Excel/PDF 导出功能。

## 技术栈

- **框架**: NestJS
- **数据库**: Supabase (PostgreSQL)
- **Excel 生成**: ExcelJS
- **PDF 生成**: PDFKit
- **部署**: Docker + 腾讯云 CloudBase 云托管

## 项目结构

```
backend/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── app.module.ts              # 根模块
│   ├── supabase/                  # Supabase 服务
│   │   ├── supabase.module.ts
│   │   └── supabase.service.ts
│   ├── transaction/                # 交易模块
│   │   ├── transaction.module.ts
│   │   ├── transaction.controller.ts
│   │   └── transaction.service.ts
│   ├── export/                    # 导出模块
│   │   ├── export.module.ts
│   │   ├── export.controller.ts
│   │   └── export.service.ts
│   └── health/                     # 健康检查模块
│       ├── health.module.ts
│       └── health.controller.ts
├── Dockerfile                     # Docker 配置
├── docker-compose.yml              # Docker Compose 配置
├── package.json
├── tsconfig.json
└── .env.example                   # 环境变量示例
```

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
