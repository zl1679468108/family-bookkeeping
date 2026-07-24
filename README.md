# 静记 (Family Bookkeeping)

家庭记账应用，三端独立架构，共享同一 Supabase (PostgreSQL) 数据库。

## 技术栈

| 子项目 | 路径 | 技术栈 |
|---|---|---|
| 前端 PC Web | `frontend/` | React 18 + CRA + TypeScript + Tailwind + SCSS |
| 后端 API | `backend/` | NestJS 10 + TypeScript + Supabase JS SDK |
| 小程序 | `taro/` | Taro 4 + React 18 + TypeScript + SCSS（微信 / H5） |
| 数据库 | — | Supabase PostgreSQL（region: `ap-southeast-1` 新加坡） |
| 生产托管 | — | 腾讯云 CVM + Nginx + PM2 + Let's Encrypt |

不是 monorepo：三个子项目各自独立 `package.json` / `node_modules`，包管理器均为 npm。Node 要求 `>= 20`。

## 访问地址

> 完整部署流程见 [docs/deployment.md](./docs/deployment.md)；本表是"现在在哪能访问到"的速查。

### 生产环境（腾讯云 CVM，上海二区，公网 `121.4.84.120`）

| 用途 | 地址 | 说明 |
|---|---|---|
| 主站点（HTTPS） | `https://zlspace.site` | 根路径 301 → `/portfolio/`（作品集） |
| 静记 PC Web | `https://zlspace.site/bookkeeping/` | Hash 路由，如 `#/transactions` |
| 静记 API | `https://zlspace.site/bookkeeping/api/` | Nginx 反代 → NestJS `/api` |
| 兼容旧 API | `https://zlspace.site/api` | 小程序等仍可用 |
| 带 www | `https://www.zlspace.site` | 同上 |
| HTTP（自动 301→HTTPS） | `http://zlspace.site` | 访问即跳转 |
| IP 直访（无域名） | `http://121.4.84.120/bookkeeping/` | 不受域名备案限制，临时验证用 |
| 后端直连（调试） | `http://121.4.84.120:3000` | PM2 进程 `family-bookkeeping-api` |

- **服务器**：腾讯云 CVM `ins-hrd4vrbd`，Ubuntu 24.04，SSH 用户 `ubuntu`
- **前端静态目录**：`/var/www/family-bookkeeping`
- **后端目录**：`/opt/family-bookkeeping/backend`

### DNS（DNSPod，当前腾讯云账号）

| 主机记录 | 类型 | 值 | 说明 |
|---|---|---|---|
| `@` | A | `121.4.84.120` | 指向 CVM 公网 IP |
| `www` | A | `121.4.84.120` | — |

> `zisparent.site` 不在当前授权账号下，未使用。

### 数据库（Supabase）

- PostgreSQL，区域 `ap-southeast-1`（新加坡）
- 从本机**无法**直连 DB / Pooler，只能通过 REST API (PostgREST) 或 Supabase SQL Editor 操作
- schema 权威源：[docs/database-init.sql](./docs/database-init.sql)

### 本地开发

| 子项目 | 端口 | 启动命令 | 访问示例 |
|---|---|---|---|
| 前端 PC Web | 3001 | `cd frontend && npm run start` | `http://127.0.0.1:3001/#/transactions`（`base=/`） |
| 后端 API | 3000 | `cd backend && npm run start` | `http://127.0.0.1:3000/api` |
| 小程序（微信） | — | `cd taro && npm run dev:weapp`（微信开发者工具指向 `dist/`） | — |
| 小程序（H5） | — | `cd taro && npm run dev:h5` | — |

> 生产前端挂在子路径 `/bookkeeping/`，本地开发默认根路径。生产构建：`VITE_API_BASE_URL=/bookkeeping/api` + `base=/bookkeeping/`（见 `scripts/deploy-cvm.sh`）。

## 部署

三端部署脚本与详细步骤见 [docs/deployment.md](./docs/deployment.md)：

- `scripts/cvm-setup.sh` — 服务器初始化（装 nginx / node / pm2 / certbot）
- `scripts/deploy-cvm.sh` — 一键部署**后端 + 前端 PC Web** 到 CVM
- `scripts/deploy-taro.sh` — 一键构建**小程序**（微信 `dist-prod/` + 可选 H5 上传 CVM）
- `scripts/renew-cert.sh` — Let's Encrypt 证书续期（DNS-01 验证，绕过 ICP 拦截）

## 目录与文档

```
frontend/   前端 PC Web
backend/    后端 NestJS API
taro/       小程序（微信 / H5）
docs/       PRD / TASKS / database-init.sql / deployment.md
scripts/    部署与初始化脚本
```

关键文档：

- [docs/PRD.md](./docs/PRD.md) — 产品需求
- [docs/TASKS.md](./docs/TASKS.md) — 任务看板（仅未完成任务）
- [docs/database-init.sql](./docs/database-init.sql) — 数据库表结构（权威）
- [docs/deployment.md](./docs/deployment.md) — 部署手册
- [AGENTS.md](./AGENTS.md) — AI 开发agent必读规则
