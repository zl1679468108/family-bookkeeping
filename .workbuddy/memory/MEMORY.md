# 家庭记账项目 — 财猫家庭记账

> 自动注入记忆，每个新对话加载。

## ⚠️ 当前重心（2026-07-06 起）

**Taro 微信小程序功能完善。** PC 端 & 后端功能已稳定，新需求优先在 Taro 端落地。
TASKS.md 已精简为仅 3 个非阻塞遗留项（H2/M8/L7），不再作为活跃看板。

## 架构 & 技术栈

```
前端 React 18 (CRA) :3001/dev :3002/prod  →  axios  →  后端 NestJS :3000  →  Supabase PostgreSQL
Taro 小程序端 taro/ (Vite + React + SCSS)
```
- 前端 PC：Tailwind v3, react-query v5, React Router v6(HashRouter), ECharts, DM Sans
- 后端：Supabase SDK, bcryptjs, exceljs, pdfkit；数据库 10 张表直接 SDK 操作，无 ORM
- 启动：前端 dev `HOST=127.0.0.1 PORT=3001 npm start`；后端 `npm run start:dev` → :3000

## PC 端设计系统

- 主色 `#2D9D8A` 绿；字体 DM Sans + DM Mono；品牌 "财猫家庭记账"
- ⚠️ **主操作按钮 & 选中激活态统一用 `--pr` 绿**：禁止用 `--fg` 做填充背景

## 数据库

- 现有 10 张：users, password_resets, user_sessions, transactions, budgets, categories, books, book_members, member_locations, transaction_templates
- P2 待实现 6 张：recurring_transactions, recurring_logs, notifications, notification_preferences, savings_goals, settlements
- 权威 schema：`docs/database-init.sql`（DDL 变更须手动在 Supabase SQL Editor 执行）

## 生产部署（CVM 子路径，2026-07-21 起）

- **生产服务器**：腾讯云 CVM `ins-hrd4vrbd`（上海二区，Ubuntu 24.04，公网 `121.4.84.120`）
- 技术栈：Nginx（80/443）+ Node 22 + PM2（`family-bookkeeping-api` 跑 `npm run start:prod`，端口 3000）+ 沿用 Supabase 数据库
- 目录：后端 `/opt/family-bookkeeping/backend`，前端静态 `/var/www/family-bookkeeping`
- **域名**：`zlspace.site` / `www.zlspace.site`（DNSPod A 记录指向 `121.4.84.120`）
  - HTTPS：Let's Encrypt 正式证书（DNS-01 验证，绕过腾讯云 HTTP 拦截），Nginx 80 自动 301→443
  - 前端 API 基址：`/api` 相对路径（IP/域名通用）
- **子路径路由（2026-07-21 加入）**：本项目挂在 `https://zlspace.site/bookkeeping/`，接口 `/bookkeeping/api`。后续其他项目可各占独立子路径（如 /blog/）。
  - nginx 配置：`config/nginx/zlspace.site.conf`（sites-available 软链到 sites-enabled）；`/bookkeeping/` alias→/var/www/family-bookkeeping/，`/bookkeeping/api/`→127.0.0.1:3000/api/（strip 前缀）；根 `/` 301→/bookkeeping/；保留 `/api` 向后兼容（Taro 等）。
  - 前端：`package.json` 的 `homepage: "/bookkeeping/"` 控制静态资源前缀；API base 由 deploy-cvm.sh 的 `REACT_APP_API_BASE_URL=/$SUBPATH/api` 注入。
  - 前端 token 重置：`/reset-password` 路由（`ResetPassword` 页，User/ResetPassword）读 `?token=` 调 `resetPasswordByToken`（POST `/auth/reset-password`），与邮件 token 链接闭环；验证码流程仍走 `/forgot-password`。
  - 部署脚本：`scripts/deploy-cvm.sh`（全量部署）、`scripts/cvm-setup.sh`（初始化）、`scripts/renew-cert.sh`（证书续期，DNS-01）
  - ⚠️ 本地构建/打包坑（已固化进脚本）：tar 必须用 `--format=ustar --no-mac-metadata`（否则 macOS bsdtar 的 pax xattr 头让 Linux GNU tar 解包失败）；远程前端解包用 `sudo tar`（/var/www 属 root）。
- 证书续期：`./scripts/renew-cert.sh`（DNS-01 自动管理 DNSPod TXT 记录并 reload）
- 本地 tccli 装在 `/Users/zhaolong/.workbuddy/binaries/python/envs/tccli`；CVM 登录密码存于本机 `/tmp/cvm_pass.txt`（SSH 用户 `ubuntu`）；本机已生成 ed25519 密钥并 `ssh-copy-id` 到服务器（免密）

## Taro 规范速查

- **SCSS only**（禁 .css）；**Pages 大驼峰**；**Picker 弹选日期**，禁左右箭头
- 组件归属：≥2 处用→`components/`，1 处→页面内 `components/`
- **统一 BottomSheet** 做工作台详情/表单弹窗；**统一 ConfirmDialog** 删确认；**NavHeader** 导航栏
- 单文件 ≤200 行（tsx）/ ≤150 行（scss）；禁止 `*` 通配符、CSS 转义符
- TabBar 4 tab（首页/流水/工作台/我的），custom-tab-bar **JS 内联 style** 驱动主题色（绕过样式隔离）
- 构建目录隔离：`start:weapp`(watch 开发) → `dist/`；`build:weapp`(生产) → `dist-prod/`（勿同时跑）
- ⚠️ **DevTools 预览/上传指向 `dist/`（由 `start:weapp` 生成）。改完要在 DevTools 看到效果，必须跑 `npm run start:weapp`（或确保 watch 在跑），而不是 `build:weapp`——后者只写 `dist-prod/`，DevTools 看不到。2026-07-18 曾因此反复"还是老样子"。**
- **页面间距标准（2026-07-13 统一）**：横向 32rpx，顶部 `calc(18rpx + safe-area-inset-top)`，底部 `calc(32rpx + safe-area-inset-bottom)`。由 PageContainer/PageLayout 默认 padding 提供，子页面不再各自写 padding；固定操作栏场景用 `bottomSpace` prop

## 全局页面容器（2026-07-13 新增，核心封装）

- **`PageContainer`**（`components/PageContainer/index.tsx`）= 语义化封装，收敛绝大多数页面共性：统一间距 + loading 遮罩 + 下拉刷新(onRefresh/refreshing) + 上拉加载(onLoadMore/hasMore/loadingMore) + 吸顶 header + 整页空状态(empty/emptyTitle/emptyDesc/emptyAction) + 底部留白(bottomSpace)
- 基于 **`PageLayout`**（`components/PageLayout/index.tsx`）：锁 `height:100vh; overflow:hidden`、渲染 ScrollView、保留系统导航栏
- 用法：`<PageContainer loading={loading} empty={list.length===0} emptyTitle="暂无交易记录">...</PageContainer>`
- 已迁移 15 个页面（Home/Transactions/Workbench/Profile/Books/BookMembers/Categories/TemplateManager/Budgets/EditProfile/CategoryEdit/TemplateEdit/About/BookSettings 等）
- ⚠️ **header 插槽在 ScrollView 外部，不受 `.page-layout-scroll` 的 32rpx 水平 padding 管辖**。header 内内容需自行补 `padding: ... 32rpx` 才能与下方内容区左右对齐（流水页 filter-card 即此坑）

## ⚠️⚠️⚠️ Taro/微信致命坑（最高优先级）

### 🔴 真因：软键盘弹起时 `setData` 重渲染会冻死整页触摸（2026-07-14 确认）
- **现象**：表单提交后接口已响应（Network 见 200/404），但按钮 loading 卡死、BottomSheet 的 X/取消全点不动，**只有原生 `<Input>` 还能收字符**。
- **根因**：微信 WebView 已知坑——**软键盘弹起（输入框聚焦）状态下触发 `setData` 重渲染（如 `setX(true)` 显示 loading），会概率性冻死整页触摸事件派发**。逻辑线程没死，但 tap 事件到不了按钮，故 X/取消/提交全失效；输入框因走原生通道仍能打字。
- **之前误判**：曾以为是 `useMutation`/`.finally` 不结算导致 loading 不复位——**那是表象，不是根因**（回调里 `setJoining(false)` 其实执行了，只是页面已冻住看不出变化）。
- **正解（已落地全工作台表单页）**：提交前先 `Taro.hideKeyboard()` 收起键盘，再 `setX(true)` 重渲染 → 不再冻。
  ```ts
  if (saving) return;
  Taro.hideKeyboard();   // ← 关键：先收键盘
  setSaving(true);
  ```
- **适用场景**：任何「提交时输入框聚焦」的表单（分类/账本/模板/预算/成员邀请/交易/登录等）都要在 loading `setState` 前加 `Taro.hideKeyboard()`。无键盘时是空操作，安全。
- `Taro.hideKeyboard()` 须在**提交处理逻辑开头**调用（早于首个可能触发重渲染的 setState），给键盘收起留时间。

### 弃用 `useMutation`（Taro 端已全量移除，作为防御性规范保留）
- `useMutation` 状态机虽最终确认**非冻结真因**，但其在 Taro/微信下的结算偶发不可靠仍属事实，故保留"不用它驱动 UI loading"的规范。
- 2026-07 已将 Taro 端全部 9 个工作台表单页 + `useTransactions` hook 改为**手动 Promise 链**（`.then`/`.catch` 双路显式复位 + `setTimeout` 3.5~4s 兜底），`taro/src` 内已无 `useMutation` 残留。
- 读操作继续用 `useManualQuery`（已对 regenerator 做规避），不在此限。

### 防御性规范（仍有效）
- 微信 regenerator 下 Promise 链 `.finally()` **偶发不执行** → loading/弹窗偶发卡死。关键状态复位写在 `.then`/`.catch` 内**同步显式**，不依赖 `.finally`；`showToast` 不 await；加 `setTimeout` 兜底(3–5s)。
- 参考实现：`useManualQuery.ts` 第 81–86 行。

### 暗色模式
- `ThemeContext` 存 theme；PageLayout 根 View 挂 `theme-dark`；app.scss `.theme-dark` 块重绑所有别名(`--surface: var(--srf)`等)
- 导航栏：`useNavBarTheme.ts` mount+useDidShow+themeChange 无条件 `setNavigationBarColor`
- TabBar：JS 内联 style 驱动；不用 PageLayout 的页面须手动挂 `theme-dark`

### 页面滚动/吸顶
- `.page-layout` 必须 `height:100vh; overflow:hidden`（绝不用 min-height→ScrollView 失高、吸顶失效）
- 吸顶内容放 PageLayout **header 插槽**（ScrollView 外部），不用 position:sticky

## 生产部署（2026-07-20 起，脱离 CloudBase）

- **生产服务器**：腾讯云 CVM `ins-hrd4vrbd`（上海二区，Ubuntu 24.04，公网 `121.4.84.120`）
- 技术栈：Nginx（80/443）+ Node 22 + PM2（`family-bookkeeping-api` 跑 `npm run start:prod`，端口 3000）+ 沿用 Supabase 数据库
- 目录：后端 `/opt/family-bookkeeping/backend`，前端静态 `/var/www/family-bookkeeping`
- **域名**：`zlspace.site` / `www.zlspace.site`（DNSPod 已加 A 记录指向 `121.4.84.120`）
  - `zisparent.site` 不在当前 tccli 授权账号，改用 `zlspace.site`。
- **HTTPS**：Let's Encrypt 正式证书，DNS-01 验证（绕过腾讯云 HTTP 拦截），有效期至 2026-10-18；Nginx 80 自动 301 跳转 443
- 前端 API 基址：`/api`（相对路径，IP/域名访问通用）
- 后端 `.env`：`FRONTEND_URL=https://zlspace.site`
- Nginx `/api` 反代 127.0.0.1:3000，前端 SPA fallback
- 证书续期：`./scripts/renew-cert.sh`（DNS-01 自动管理 DNSPod TXT 记录并上传 reload）
- 本地 tccli 装在 `/Users/zhaolong/.workbuddy/binaries/python/envs/tccli`；CVM 登录密码存于本机 `/tmp/cvm_pass.txt`（SSH 用户 `ubuntu`）
- 部署脚本：`scripts/cvm-setup.sh`（初始化）、`scripts/deploy-cvm.sh`（全量部署）、`scripts/renew-cert.sh`（证书续期）
