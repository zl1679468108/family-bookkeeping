# 静记 (Family Bookkeeping) Agent Guide

新对话开始时先读本文件。本文件只保留 **硬规则、真坑、索引**；长篇说明见外链文档，不要回写到这里。

## 1. 文档优先级

| 优先级 | 文档 | 用途 |
|---|---|---|
| 1 | [docs/PRD.md](./docs/PRD.md) | 功能定义、模块边界、交互/视觉 |
| 2 | [docs/TASKS.md](./docs/TASKS.md) | 未完成任务 |
| 3 | [docs/database-init.sql](./docs/database-init.sql) | 表结构唯一真相源 |
| 4 | 当前代码 | 实现细节；先读再改 |

补充文档：

- 部署手册：[docs/deployment.md](./docs/deployment.md)
- 访问地址 / 总览：[README.md](./README.md)

## 2. 架构硬约束

家庭记账「静记」：三端独立工程，共享同一 Supabase PostgreSQL。**不是 monorepo / npm workspace**；包管理器用 npm；Node `>= 20`。

| 子项目 | 路径 | 技术栈 | 端口 |
|--------|------|--------|------|
| frontend | `frontend/` | React 18 + Vite + TS + Tailwind + SCSS | 3001 |
| backend | `backend/` | NestJS 10 + Supabase JS SDK | 3000 |
| taro | `taro/` | Taro 4 + React 18 + TS + SCSS | weapp/H5 |
| shared-types | `shared-types/` | 三端共享实体类型 | — |
| shared-utils | `shared-utils/` | 双端共享纯函数 / 文案 | — |

```text
[frontend / taro] → HTTP REST /api → [backend NestJS] → Supabase JS SDK → PostgreSQL
```

必须遵守：

1. **前端 / Taro 不直连 Supabase**，数据一律走后端 API。
2. **认证不是 JWT**：自定义双 token（Access ~2h + Refresh ~14d）；hash 存 `user_sessions`，客户端带 `Authorization: Bearer <accessToken>`；401 用 refresh 单飞换发。
3. **账本多租户**：`@BookId()` 取 `current_book_id`；请求自动带 `x-book-id`；owner 看全员交易，member 只看自己。
4. **无 ORM / 无 migration**：DDL 只改 `docs/database-init.sql`，并提醒用户在 Supabase SQL Editor 手动执行。本机直连 DB / Pooler 不可用，只走 PostgREST 或 SQL Editor。
5. **API 统一包装**：`{ success, message, data }`；前端 `request<T>()` 自动解包 `data`。
6. **时间**：DB 存 UTC；响应经 `ResponseInterceptor` 转北京时间 `YYYY-MM-DD HH:mm:ss.SSS`。
7. **共享包**：实体类型改 `shared-types/`；双端同构文案/纯函数改 `shared-utils/`（端侧多为 re-export）。改接口形状时检查三端调用处。
8. **密钥**：只放各端 `.env.*`（已 gitignore）；模板改 `.env.example`，禁止硬编码。

## 3. 三端最小规则

### Frontend（PC Web）

- HashRouter + `React.lazy`；路由在 `frontend/src/routes/routes.tsx`
- 服务端状态：React Query v5；客户端：Context（无 Redux/Zustand）
- API：`frontend/src/services/api.ts` 原生 `fetch`；环境变量前缀 `VITE_`
- UI：自研 `components/ui/` + SCSS/Tailwind；主色 `#2D9D8A`

### Taro（小程序）

- 页面注册：`taro/src/app.config.ts`；自定义 TabBar 4 项
- 读：`useManualQuery`（无缓存/无自动重取）；写：`useMutation`，`onSuccess` 手动 `refetch()`
- API：`Taro.request`；环境变量前缀 `TARO_APP_`
- Provider：`QueryClientProvider > AuthProvider > BookProvider > AuthGuard`
- **构建隔离**：`dev:* → dist/`，`build:* → dist-prod/`；禁止 watch 与生产构建同时跑
- 限制：无 `atob`/`btoa`、无 inline SVG；部分 WXSS 选择器不可用

### Backend（NestJS）

- 基础路径 `/api`；模块三件套 `controller + service + module`，注册到 `app.module.ts`
- 全局：`ValidationPipe`（whitelist/transform/forbidNonWhitelisted）、`ResponseInterceptor`、`HttpExceptionFilter`
- 鉴权：`TokenAuthGuard`；管理员加 `AdminGuard`；`@CurrentUser()` / `@BookId()`
- DTO：`class-validator` + `class-transformer`；Query 数字用 `@Type(() => Number)`
- 上传：`FileValidationPipe`（jpeg/png/webp，≤5MB）→ Supabase Storage

## 4. 改动速查

| 改动 | 改哪里 |
|------|--------|
| 后端 API | module/controller/service + `app.module.ts` |
| 表字段 | `database-init.sql` → shared-types → 后端 → frontend/Taro services |
| 前端页面 | `pages/` + `routes/routes.tsx` + `services/` |
| Taro 页面 | `pages/` + `app.config.ts` + `services/` |
| 共享类型 / 文案 | `shared-types/` 或 `shared-utils/`，再检查 re-export 与调用方 |
| UI 原子组件 | `frontend/src/components/ui/` |

流程：确认 PRD → 看 SQL / TASKS → 读现有代码 → 改代码 → 同步受影响文档。  
不要重构无关文件；共享模块（API、主题、路由、store）改前先看影响面。

## 5. 常用命令

```bash
cd backend && npm run start            # 后端 watch
cd frontend && npm run start           # PC Web :3001
cd taro && npm run dev:weapp           # 小程序 dev → dist/
cd taro && npm run build:weapp         # 小程序 prod → dist-prod/

cd backend && npx tsc --noEmit && npm test
cd frontend && npx tsc --noEmit
cd taro && npx tsc --noEmit && npm test
```

验证按改动范围选：`tsc` / `build:prod` / `build:weapp` / Network 或 `curl`。  
集成测试（依赖 Supabase）：`cd backend && npm run test:integration`（不进默认 `npm test`）。

## 6. 部署硬门禁

完整步骤见 [docs/deployment.md](./docs/deployment.md)。生产：腾讯云 CVM + Nginx + PM2；地址以 [README.md](./README.md) 为准。

脚本：

- `scripts/deploy-cvm.sh` — 后端 + PC Web
- `scripts/deploy-taro.sh` — 小程序 / 可选 H5
- `scripts/renew-cert.sh` — 证书续期

**部署前（不可跳过）**

1. 更新 `shared-utils/src/version.ts`：`APP_VERSION`、`APP_BUILD_DATE`，`CHANGELOG` 顶部加本版条目
2. `frontend` / `backend` / `taro` 的 `package.json#version` 与 `APP_VERSION` 一致
3. About 页只从 `config/version` re-export 读版本，禁止页面内硬编码
4. 前端 API 用相对路径 `/api`；Taro 生产 `TARO_APP_API_BASE_URL=https://zlspace.site/api`
5. 后端生产 env 真相源：`backend/.env.production` → 服务器 `/opt/family-bookkeeping/backend/.env`

**部署后冒烟**

- 打开 `/#/about`，确认版本徽章、发布日期、更新日志首条
- 再按 `docs/deployment.md` 验证清单检查站点 / API / PM2

**部署成功后回填作品集（不可跳过）**

- 目标：`/Users/zhaolong/前端/vibe-coding-project/portfolio`（同级仓，非本仓子目录）
- 仅公网部署真正成功后回填；本地构建 / 失败部署不回填
- 必改：
  1. `portfolio/src/data/projects.ts` → `id: 'family-bookkeeping'` 的 `status`、`version`（= `APP_VERSION`）、`lastDeployed`（北京时间 `YYYY-MM-DD HH:mm`）；必要时同步 `features` / `access` / `screenshots`
  2. `portfolio/src/data/profile.ts` → `lastUpdated`（`YYYY-MM-DD`）
  3. 状态/入口变化时同步 `portfolio/README.md`；素材待办变化时同步 `portfolio/docs/tasks.md`
- 作品集上线需用户明确要求后再跑 portfolio 的 `npm run deploy`；不要在静记部署脚本里隐式改作品集
- 禁止把密钥、服务器密码、内部运维细节写进 portfolio

CI（`.github/workflows/ci.yml`）只做质量检查与构建，**无自动部署**。

## 7. Gotchas

1. DDL 不能自动化；改 SQL 后必须提醒用户手动同步 Supabase。
2. Taro 读操作用 `useManualQuery`；写后手动 `refetch()`。
3. 切换账号 `switchByToken` 必须 `queryClient.removeQueries()`，禁止 `clear()`（会与 profile 重取竞态）。
4. 前端解析时间戳时注意是北京时间字符串，不是 ISO UTC。
5. macOS Node DNS 可能偏慢；启动脚本已加 `NODE_OPTIONS=--dns-result-order=ipv4first`。
6. Supabase Free 有冷启动，首请求可能 pending 数秒。
7. 小程序无 `atob`/`btoa`、无 inline SVG；部分 CSS 选择器不可用。
8. `backend/src/app.spec.ts` 是集成测试，只走 `npm run test:integration`。
