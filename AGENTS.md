# 静记 (Family Bookkeeping) Agent Guide

新对话开始时，先读取本文件。

## 1. 文档优先级

所有 AI 开发决策按以下优先级裁决：

| 优先级 | 文档 | 用途 |
|---|---|---|
| 1 | [docs/PRD.md](./docs/PRD.md) | 产品需求规范：功能定义、模块边界、交互/视觉规范 |
| 2 | [docs/TASKS.md](./docs/TASKS.md) | 当前任务状态：仅包含未完成的待办任务 |
| 3 | [docs/database-init.sql](./docs/database-init.sql) | 数据库表结构：表名、字段、约束、索引 |
| 4 | 当前代码 | 实现细节：以实际代码为准，先读代码再修改 |

不要把长篇部署步骤、产品说明或数据库 SQL 复制回 `AGENTS.md`。本文件只保留 agent 开发时必须遵守的规则和索引。

## 2. 项目概览

家庭记账应用「静记」，三端独立架构，共享同一 Supabase (PostgreSQL) 数据库。

| 子项目 | 路径 | 技术栈 | 开发端口 |
|--------|------|--------|----------|
| **frontend** | `frontend/` | React 18 + CRA + TypeScript + Tailwind + SCSS | 3001 |
| **backend** | `backend/` | NestJS 10 + TypeScript + Supabase JS SDK | 3000 |
| **taro** | `taro/` | Taro 4 + React 18 + TypeScript + SCSS + weapp-tailwindcss | weapp/H5 |

**不是 monorepo**：三个子项目各自独立，有各自的 `package.json`、`node_modules`，无共享包。包管理器为 npm。

**Node 要求**：>= 20.0.0

### 数据流

```
[frontend / taro] → HTTP REST → [backend NestJS] → Supabase JS SDK (PostgREST) → Supabase PostgreSQL
```

前端不直接访问 Supabase，所有数据操作通过后端 API。

### API 响应格式

所有响应被 `ResponseInterceptor` 统一包装：

```json
{ "success": true, "message": "...", "data": ... }
```

时间戳字段（`created_at`、`updated_at`、`date` 等）被自动转换为北京时间格式 `YYYY-MM-DD HH:mm:ss.SSS`。

前端的 `request<T>()` 函数会自动解包，直接返回 `data`。

### 认证机制

**不是 JWT**，是自定义 token session 系统：

- Token：`crypto.randomBytes(32).toString('hex')` 生成 64 字符 hex
- 存储：SHA-256 hash 存入 `user_sessions` 表，原始 token 发给客户端
- TTL：3 天
- 客户端用 `Authorization: Bearer <token>` 传递
- 后端 `TokenAuthGuard` 校验，通过后 `@CurrentUser()` 装饰器取用户信息

### 账本（Book）多租户

- 用户可创建/加入多个账本，通过 `book_members` 表关联（role: owner | member）
- `@BookId()` 装饰器从 `request.user.current_book_id` 取当前账本 ID
- Owner 可见账本内所有成员的交易，member 仅可见自己的
- 所有 API 请求自动携带 `x-book-id` 头（前端/Taro 自动附加）

### 数据库

**`docs/database-init.sql` 是数据库 schema 的唯一真相源**（12 张表）。无 ORM、无 migration 框架。

表清单：`users`、`user_sessions`、`password_resets`、`categories`、`books`、`book_members`、`transactions`、`budgets`、`transaction_templates`、`member_locations`、`book_invitations`、`custom_icons`。

DDL 变更必须手动在 Supabase SQL Editor 执行。直连 DB 和 Pooler 从本机均不可用，只能通过 REST API (PostgREST) 或 SQL Editor。

**Supabase 区域**：Singapore (ap-southeast-1)。

## 3. 常用命令

```bash
# 后端
cd backend && npm run start          # 开发模式（watch）
cd backend && npm run build:prod     # 生产构建

# 前端（PC Web）
cd frontend && npm run start         # 开发模式，端口 3001
cd frontend && npm run build:prod    # 生产构建

# 小程序
cd taro && npm run dev:weapp         # 微信小程序开发构建
cd taro && npm run dev:h5            # H5 开发构建
cd taro && npm run build:weapp       # 微信小程序生产构建

# 类型检查
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

## 4. 目录索引

```text
frontend/
  src/
    pages/           页面（每个页面含 components/ hooks/ 子目录）
    components/      共享组件（ui/ 为原子组件）
    services/        API 服务层
    hooks/           共享 hooks
    utils/           工具函数 + Context Providers
    types/           TypeScript 类型定义
    styles/          全局样式、设计令牌、SCSS partials
    routes/          路由配置

backend/
  src/
    auth/            认证模块
    transaction/     交易模块
    books/           账本模块
    categories/      分类模块
    budgets/         预算模块
    statistics/      统计模块
    templates/       模板模块
    reports/         报表模块
    export/          导出模块
    map/             地图模块
    icons/           图标模块
    admin/           管理员模块
    mail/            邮件模块
    common/          公共模块
      supabase/      Supabase 客户端
      pipes/         管道（文件验证等）
      interceptors/  拦截器（响应包装）
      filters/       过滤器（异常处理）

taro/
  src/
    pages/           页面（18 页）
    services/        API 服务层
    components/      公共组件
    context/         React Context
    hooks/           自定义 Hooks
    types/           TypeScript 类型
    utils/           工具函数

docs/
  PRD.md             产品需求文档
  TASKS.md           任务看板（仅未完成任务）
  database-init.sql  数据库初始化脚本（权威建表基准）
```

## 5. AI 工作分工

### 5.1 跨文档协作规则

修改任何功能时，按以下顺序更新文档：

1. 先确认 `PRD.md` 中是否有该功能的定义
2. 查看 `database-init.sql` 确认表结构
3. 查看 `TASKS.md` 确认任务状态
4. 读当前代码确认实现细节
5. 修改代码后同步更新受影响的文档

### 5.2 代码修改分工

| 改动范围 | 需要修改的文件 |
|---|---|
| 新增/修改后端 API | controller + service + module + 注册到 app.module.ts |
| 新增/修改数据库字段 | database-init.sql + 前端 types/ + 后端 service/controller + 前端 API |
| 新增/修改前端页面 | 页面文件 + routes/routes.tsx + services/ API 文件 |
| 新增/修改 Taro 页面 | 页面文件 + app.config.ts 注册 + services/ API 文件 |
| 新增/修改 UI 组件 | components/ui/ |
| 新增/修改业务逻辑 | 对应 service/controller + 前端 hooks/ 或 services/ |

### 5.3 验证分工

| 角色 | 负责验证 |
|---|---|
| TypeScript | `npx tsc --noEmit`（所有改动） |
| 前端构建 | `npm run build:prod`（涉及前端） |
| 后端构建 | `npm run build:prod`（涉及后端） |
| 小程序构建 | `npm run build:weapp`（涉及 Taro） |
| 关键接口 | 浏览器 Network 或 `curl` 验证响应结构 |
| 数据库改动 | 先在 Supabase SQL Editor 验证 SQL 语法，再本地测试 |

### 5.4 文档维护分工

| 文档 | 维护时机 | 维护内容 |
|---|---|---|
| PRD.md | 新增/修改功能后 | 同步更新功能详述、模块矩阵 |
| TASKS.md | 任务开始/完成/阻塞时 | 更新任务状态 |
| database-init.sql | 表结构变化后 | 同步增删改字段、索引 |
| AGENTS.md | 项目规则/结构变化后 | 同步更新目录索引、规范、流程 |

## 6. Frontend（PC Web）规则

- 路由使用 `react-router-dom` v6 HashRouter，19 条路由，全部 `React.lazy()` 懒加载。路由配置在 `src/routes/routes.tsx`。
- 状态管理：服务端用 `@tanstack/react-query` v5，客户端用 React Context。无 Redux / Zustand。
- API 层：`src/services/api.ts` 导出 `request<T>()` 函数（基于原生 fetch），无 Axios。
- 样式：SCSS + Tailwind CSS + CSS 设计令牌（`design-tokens.css`）。非 CSS Modules，所有样式为全局类名。主色调 green `#2D9D8A`。
- 组件：全自研 UI 库（无 antd/MUI），在 `src/components/ui/`。
- 环境变量前缀：`REACT_APP_`（CRA 约定）。

## 7. Taro（小程序）规则

- 构建：Webpack 5，设计宽度 375px，输出 rpx 单位。
- 页面：18 页，配置在 `src/app.config.ts`。底部 TabBar 4 个 tab（首页/流水/报表/我的），自定义实现。
- 数据获取：`useManualQuery`（自研 hook）替代 `useQuery`（Taro 兼容性问题）；写操作用 `useMutation`，需在 `onSuccess` 手动 `refetch()`。
- API 层：`src/services/api.ts` 基于 `Taro.request`（非 fetch）。
- 样式：SCSS 为主，`app.scss` 中定义了 Tailwind 风格的工具类（手写）。`weapp-tailwindcss` 提供部分 Tailwind 兼容。
- 限制：不支持 `atob`/`btoa`、不支持 inline SVG、WXSS 不支持部分 CSS 选择器。
- 环境变量前缀：`TARO_APP_`
- Provider 层级：`QueryClientProvider > AuthProvider > BookProvider > AuthGuard > Pages`

## 8. Backend（NestJS）规则

- 模块（13 个）：Auth、Transaction、Books、Categories、Budgets、Statistics、Templates、Reports、Export、Map、Icons、Admin、Mail。`SupabaseModule` 为 `@Global()`。
- REST API 基础路径为 `/api`。
- 每个模块保持三件套：`controller`、`service`、`module`。
- 全局中间件：
  - `ValidationPipe`：whitelist + transform + forbidNonWhitelisted
  - `ResponseInterceptor`：统一响应包装 + 时间戳转北京时间
  - `HttpExceptionFilter`：统一错误处理
- DTO 验证：`class-validator` + `class-transformer`。Query 参数用 `@Type(() => Number)` 做字符串→数字转换。
- 认证装饰器：
  - `@UseGuards(TokenAuthGuard)` — 校验 token
  - `@UseGuards(TokenAuthGuard, AdminGuard)` — 管理员接口
  - `@CurrentUser()` / `@CurrentUser('id')` — 取当前用户
  - `@BookId()` — 取当前账本 ID
- 文件上传：`FileValidationPipe` 校验 MIME（jpeg/png/webp）和大小（≤5MB）。Supabase Storage 存储。
- TypeScript 配置：target ES2021, module CommonJS, `strictNullChecks: false`, `noImplicitAny: false`（较宽松）。
- Prettier：singleQuote, trailingComma all, printWidth 100, tabWidth 2, semi, arrowParens always。

## 9. 时间规则

项目所有时间字段遵循同一规则：

- 后端 `ResponseInterceptor` 自动将所有时间戳转为北京时间字符串：`YYYY-MM-DD HH:mm:ss.SSS`
- 前端如需 Date 对象做计算，注意解析北京时间字符串格式
- 数据库存储使用 UTC

## 10. 数据库规则

- 开发和生产共用 Supabase 表，修改表结构必须谨慎。
- 初始化和迁移参考 [docs/database-init.sql](./docs/database-init.sql)。
- DDL 变更必须手动在 Supabase SQL Editor 执行。
- 修改表结构时，同步更新：
  - `docs/database-init.sql`
  - 前端 `src/types/`
  - Taro `src/types/index.ts`
  - 后端 service/controller

## 11. 常见开发流程

新增业务模块：

1. 更新 PRD 或确认已有需求。
2. 设计/更新数据库表（database-init.sql）。
3. 后端新增 module/controller/service。
4. 前端新增 types → services API → pages → routes。
5. Taro 新增 pages → services API → app.config.ts 注册。
6. 更新 `docs/TASKS.md`。

新增 UI 组件：

1. 放到 `src/components/ui/`。
2. 使用 SCSS + Tailwind 样式。
3. 检查三端样式一致性。

## 12. 验证要求

改动完成后按风险选择验证：

- TypeScript：`npx tsc --noEmit`
- 前端构建：`npm run build:prod`
- 后端构建：`npm run build:prod`
- 小程序构建：`npm run build:weapp`
- 关键接口：用浏览器 Network 或 `curl` 验证请求次数和响应结构。

如果验证失败，说明是本次改动导致还是项目已有问题。

## 13. 注意事项

- 敏感信息只放环境变量，不要硬编码。
- 保持代码简洁，能用现有模式就不要造新抽象。
- 不要重构无关文件。
- 修改共享模块（store、API、主题、路由等）时要检查影响面。
- 文档职责分明：产品写 PRD，任务写 TASKS，数据库写 SQL，本文件只写 agent 必读规则。

## 14. 部署

**平台**：腾讯云开发 (CloudBase)

- 后端：CloudBase CloudRun（容器服务），服务名 `family-bookkeeping-api-prod`
- 前端：CloudBase 静态网站托管

**部署脚本**（在 `scripts/` 目录）：
- `deploy-backend.sh` — 构建 + 部署后端
- `deploy-frontend.sh` — 构建 + 部署前端
- `deploy-all.sh` — 全量部署

也可通过 CloudBase MCP (`@cloudbase/cloudbase-mcp`) 进行自动化部署。

**无 CI/CD**：无 GitHub Actions 或其他自动化流水线。

## 15. 重要注意事项（Gotchas）

1. **数据库变更不能自动化**：无 migration 工具，DDL 必须手动在 Supabase SQL Editor 执行。修改 `docs/database-init.sql` 后提醒用户手动同步。

2. **前端类型不共享**：三端的 TypeScript 类型各自独立定义，改了一处需手动同步其他两处。

3. **Taro 的 React Query 不完全兼容**：读操作用 `useManualQuery`（无缓存、无自动重取），写操作 `useMutation` 需在 `onSuccess` 手动调 `refetch()`。

4. **时间戳格式**：后端 `ResponseInterceptor` 会自动将所有时间戳转为北京时间字符串。如果前端需要 Date 对象做计算，注意解析格式。

5. **`switchByToken` 场景**：切换账号时必须用 `queryClient.removeQueries()` 而非 `queryClient.clear()`，否则 `clear()` 会触发 profile 自动重取与 `setQueryData` 产生竞态。

6. **DNS 问题**：macOS 下 Node.js 默认 IPv6 DNS 解析有延迟，启动脚本已加 `NODE_OPTIONS=--dns-result-order=ipv4first`。

7. **Supabase 冷启动**：Free Nano 实例有冷启动延迟，首次请求可能 pending 数秒。

8. **小程序限制**：无 `atob`/`btoa`、无 inline SVG、WXSS 不支持部分 CSS 选择器（有自定义 PostCSS 插件处理）。

9. **`.env` 文件**：各子项目的 `.env.development` / `.env.production` 包含实际密钥，已被 `.gitignore` 排除。修改配置时只改 `.env.example` 模板。

10. **测试**：项目目前无自动化测试。后端配了 Jest 但未写测试用例。
