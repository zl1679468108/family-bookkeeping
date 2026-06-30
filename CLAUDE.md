# AGENTS.md — 静记 (Family Bookkeeping)

## 项目概览

家庭记账应用「静记」，三端独立架构，共享同一 Supabase (PostgreSQL) 数据库。

| 子项目 | 路径 | 技术栈 | 开发端口 |
|--------|------|--------|----------|
| **frontend** | `frontend/` | React 18 + CRA + TypeScript + Tailwind + SCSS | 3001 |
| **backend** | `backend/` | NestJS 10 + TypeScript + Supabase JS SDK | 3000 |
| **taro** | `taro/` | Taro 4 + React 18 + TypeScript + SCSS + weapp-tailwindcss | weapp/H5 |

**不是 monorepo**：三个子项目各自独立，有各自的 `package.json`、`node_modules`，无共享包。包管理器为 npm。

**Node 要求**：>= 20.0.0

## 启动命令

```bash
# 后端
cd backend && npm run start          # 开发模式（watch），自动清理端口 3000，强制 IPv4 DNS
cd backend && npm run build:prod     # 生产构建
cd backend && npm run start:prod     # 运行生产构建

# 前端（PC Web）
cd frontend && npm run start         # 开发模式，端口 3001
cd frontend && npm run build:prod    # 生产构建（REACT_APP_ENV=production）

# 小程序
cd taro && npm run dev:weapp         # 微信小程序开发构建
cd taro && npm run dev:h5            # H5 开发构建
cd taro && npm run build:weapp       # 微信小程序生产构建
```

## 架构要点

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

DDL 变更必须手动在 Supabase SQL Editor 执行。直连 DB (`db.*.supabase.co`) 和 Pooler 从本机均不可用（DNS 无法解析），只能通过 REST API (PostgREST) 或 SQL Editor。

**Supabase 区域**：正在从 Tokyo (ap-northeast-1) 迁移到 Singapore (ap-southeast-1)。

### SupabaseService 关键设计

- `@Global()` 模块，所有模块可直接注入
- `withRetry<T>()`：最多 3 次重试，指数退避（200/400/800ms），单次 10s 超时
- `global.fetch` 加 `AbortSignal.timeout(12s)` 防僵尸连接
- `switchByToken` 场景用 `removeQueries()` 替代 `clear()` 避免竞态

## 各子项目约定

### Frontend（PC Web）

**路由**：`react-router-dom` v6 HashRouter，19 条路由，全部 `React.lazy()` 懒加载。路由配置在 `src/routes/routes.tsx`。

**状态管理**：
- 服务端状态：`@tanstack/react-query` v5（核心数据获取方式）
- 客户端状态：React Context（`AuthProvider`、`BookProvider`、`ThemeProvider`、`NotificationProvider`）
- 无 Redux / Zustand

**API 层**：`src/services/api.ts` 导出 `request<T>()` 函数（基于原生 fetch），各业务 API 文件（`booksApi.ts`、`categoriesApi.ts` 等）调用它。无 Axios。

**样式**：SCSS + Tailwind CSS + CSS 设计令牌（`design-tokens.css`）。非 CSS Modules，所有样式为全局类名。每个页面有 `index.scss` 与 `index.tsx` 并列。主色调 green `#2D9D8A`。

**组件**：全自研 UI 库（无 antd/MUI），在 `src/components/ui/`。

**目录结构**：
```
src/
  pages/           # 页面（每个页面含 components/ hooks/ 子目录）
  components/      # 共享组件（ui/ 为原子组件）
  services/        # API 服务层
  hooks/           # 共享 hooks
  utils/           # 工具函数 + Context Providers
  types/           # TypeScript 类型定义
  styles/          # 全局样式、设计令牌、SCSS partials
  routes/          # 路由配置
```

**环境变量前缀**：`REACT_APP_`（CRA 约定）

### Taro（小程序）

**构建**：Webpack 5，设计宽度 375px，输出 rpx 单位。

**页面**：18 页，配置在 `src/app.config.ts`。底部 TabBar 4 个 tab（首页/流水/报表/我的），自定义实现。

**数据获取**：混合模式——
- `useManualQuery`（自研 hook）替代 `useQuery`（Taro 兼容性问题）
- `useMutation`（react-query）用于写操作，需在 `onSuccess` 手动 `refetch()`
- 很多页面直接 `useState` + `useEffect` + 服务调用

**API 层**：`src/services/api.ts` 基于 `Taro.request`（非 fetch）。

**样式**：SCSS 为主，`app.scss` 中定义了 Tailwind 风格的工具类（手写，非 Tailwind 编译）。`weapp-tailwindcss` 提供部分 Tailwind 兼容。自定义 PostCSS 插件 `config/strip-wxss-plugin.js` 去除 WXSS 不支持的 CSS。

**注意**：小程序不支持 `atob`/`btoa`，`savedAccounts.ts` 使用自定义 Base64 编解码。不支持 inline SVG，图标用 `<Image>` 组件加载 SVG 文件。

**环境变量前缀**：`TARO_APP_`

**Provider 层级**：`QueryClientProvider > AuthProvider > BookProvider > AuthGuard > Pages`

### Backend（NestJS）

**模块**（13 个）：Auth、Transaction、Books、Categories、Budgets、Statistics、Templates、Reports、Export、Map、Icons、Admin、Mail。`SupabaseModule` 为 `@Global()`。

**全局中间件**：
- `ValidationPipe`：whitelist + transform + forbidNonWhitelisted
- `ResponseInterceptor`：统一响应包装 + 时间戳转北京时间
- `HttpExceptionFilter`：统一错误处理（区分 Supabase 错误、HttpException、未知错误）

**DTO 验证**：`class-validator` + `class-transformer`。Query 参数用 `@Type(() => Number)` 做字符串→数字转换。

**认证装饰器**：
- `@UseGuards(TokenAuthGuard)` — 校验 token，注入 `request.user`
- `@UseGuards(TokenAuthGuard, AdminGuard)` — 管理员接口
- `@CurrentUser()` / `@CurrentUser('id')` — 取当前用户
- `@BookId()` — 取当前账本 ID

**导出功能**：`exceljs`（Excel）+ `pdfkit`（PDF，需中文字体支持）。

**文件上传**：`FileValidationPipe` 校验 MIME（jpeg/png/webp）和大小（≤5MB）。Supabase Storage 存储：`receipts` 桶（交易凭证）、`icons` 桶（自定义图标）。

**TypeScript 配置**：target ES2021, module CommonJS, `strictNullChecks: false`, `noImplicitAny: false`（较宽松）。

**Prettier**：singleQuote, trailingComma all, printWidth 100, tabWidth 2, semi, arrowParens always。

## 编码规范

### 通用

- 语言：TypeScript everywhere
- 缩进：2 空格
- 引号：单引号（backend prettier 规定），前端跟随项目配置
- 尾逗号：all
- 命名：camelCase 变量/函数，PascalCase 类/组件/类型，UPPER_SNAKE 常量

### 新增功能时的检查清单

1. **后端**：新建 Module → Controller → Service → DTO，在 `AppModule` 注册
2. **前端**：新建 Page（含 `index.tsx` + `index.scss`）→ Service API 函数 → 路由注册（lazy import）
3. **Taro**：新建 Page → 在 `app.config.ts` 注册 → Service API 函数
4. **数据库**：在 `docs/database-init.sql` 追加 DDL → 手动在 Supabase SQL Editor 执行
5. **类型同步**：前端 `src/types/` 和 Taro `src/types/index.ts` 手动保持一致（标注"对齐 PC 端"）

### 提交信息格式

项目无强制 commit lint，建议遵循 conventional commits：
```
feat: 添加年度账单报告
fix: 修复交易列表分页错误
refactor: 重构 SupabaseService 重试逻辑
```

## 部署

**平台**：腾讯云开发 (CloudBase)

- 后端：CloudBase CloudRun（容器服务），服务名 `family-bookkeeping-api-prod`
- 前端：CloudBase 静态网站托管

**部署脚本**（在 `scripts/` 目录）：
- `deploy-backend.sh` — 构建 + 部署后端
- `deploy-frontend.sh` — 构建 + 部署前端
- `deploy-all.sh` — 全量部署

也可通过 CloudBase MCP (`@cloudbase/cloudbase-mcp`) 进行自动化部署。

**无 CI/CD**：无 GitHub Actions 或其他自动化流水线。

## 重要注意事项（Gotchas）

1. **数据库变更不能自动化**：无 migration 工具，DDL 必须手动在 Supabase SQL Editor 执行。修改 `docs/database-init.sql` 后提醒用户手动同步。

2. **前端类型不共享**：三端的 TypeScript 类型各自独立定义，改了一处需手动同步其他两处。

3. **Taro 的 React Query 不完全兼容**：读操作用 `useManualQuery`（无缓存、无自动重取），写操作 `useMutation` 需在 `onSuccess` 手动调 `refetch()`。

4. **时间戳格式**：后端 `ResponseInterceptor` 会自动将所有时间戳转为北京时间字符串。如果前端需要 Date 对象做计算，注意解析格式。

5. **`switchByToken` 场景**：切换账号时必须用 `queryClient.removeQueries()` 而非 `queryClient.clear()`，否则 `clear()` 会触发 profile 自动重取与 `setQueryData` 产生竞态。

6. **DNS 问题**：macOS 下 Node.js 默认 IPv6 DNS 解析有延迟，启动脚本已加 `NODE_OPTIONS=--dns-result-order=ipv4first`。

7. **Supabase 冷启动**：Free Nano 实例有冷启动延迟，首次请求可能 pending 数秒。

8. **小程序限制**：无 `atob`/`btoa`、无 inline SVG、WXSS 不支持部分 CSS 选择器（有自定义 PostCSS 插件处理）。

9. **`.env` 文件**：各子项目的 `.env.development` / `.env.production` 包含实际密钥（Supabase key、SMTP 密码），已被 `.gitignore` 排除。修改配置时只改 `.env.example` 模板。

10. **测试**：项目目前无自动化测试。后端配了 Jest 但未写测试用例。`docs/测试用例.md` 有 107 条手动测试用例可供参考。
