# TASKS.md — 任务清单

> 更新日期：2026-07-24
> 状态说明：🔄 进行中 / ⏳ 待处理 / ✅ 已完成 / ❌ 阻塞
> 当前重心：Taro 微信小程序功能完善与质量收尾。

---

## 本轮目标：Taro 端结构对齐已完成，进入质量收尾与功能深度对齐

已完成（2026-07-06）：
- 删除报表/日历/地图/年报 4 模块 + 孤儿页；TabBar 重构为 首页/流水(含记一笔FAB)/工作台(账本·分类·模板·预算)/我的；新增 Onboarding 引导页（含 BookContext.refetchBooks，顺带修复 PC 端创建账本后缓存不刷新的循环隐患）
- 清理 tsc 报错：`tsc --noEmit` 零错误；删除孤儿 `lunarUtils.ts`；修复 `Skeleton`/`Books`/`Transactions` 未用引用；修复 `AuthContext` 切换账号未持久化 token 的隐患（改用 `setAccountToken`）
- 双平台构建验证：`build:weapp` ✅、`build:h5` ✅
- 工作台模块对齐：Books 详情补 `updated_at`/`owner_id`；TemplateManager 新增「复制模板」；**修复 TemplateManager 整页样式缺失缺陷**（tsx 用的 `tpl-card`/`tpl-pill`/`tpl-fab`/`tpl-mask` 及 sheet `__` 子类在 scss 中几乎全缺失，已重写 scss 对齐现有设计令牌）

---

## 双 Token 认证改造（已实现 · 2026-07-08）

> 状态：✅ 已实现 · 后端 + 前端 PC + Taro 三端落地，三端 `tsc --noEmit` 与 `build` 均通过
> 目标：单 token（3 天）→ 短 Access Token（~2h，请求携带）+ 长 Refresh Token（~14d，仅用于刷新）
> 选型：**全不透明 token**（沿用现有 `jj_user_sessions` 哈希存储，**不做 JWT**），与现状架构、即时吊销、会话上限一致，迁移成本最低。
> 📝 术语对齐（用户口径）：**短 token（请求携带、过期即用长 token 刷新）= Access Token**；**长 token（仅用于 /auth/refresh 换发短 token）= Refresh Token**。
> ⚠️ 破坏性变更：登录/注册/切换账号返回结构由 `{ user, token }` 改为 `{ user, accessToken, refreshToken }`，**后端 + 前端 PC + Taro 须同步发布**。
> 🗄️ **DB 迁移必做**：部署前在 Supabase SQL Editor 执行 `docs/database-migration-dual-token.sql`（幂等），并同步更新了 `docs/database-init.sql` 权威 schema。

### 方案要点

1. Access Token 仍存 `jj_user_sessions.token_hash` + `expires_at`，`TokenAuthGuard` **无需改动**（全项目 `@UseGuards(TokenAuthGuard)` 不受影响）。
2. 新增 `refresh_token_hash` + `refresh_expires_at` 列（同一行 = 一个登录会话，同时持有 access/refresh）。
3. 新增 `POST /auth/refresh`：用长 token(refresh) 校验 → 发新短 token(access) → 返回 `{ user, accessToken, refreshToken }`。**默认 refresh 长期 token 不强制轮换（保持稳定，符合"长token"语义）**；轮换失效 + 复用检测（吊销全部会话）作为可选安全加固见 S 系列。
4. 客户端：401 时自动用 refresh 换发（single-flight 锁 + 重试队列），刷新失败才清理并跳登录。
5. 老单行 token（无 refresh）兼容：access 仍可用至 `expires_at`，之后 401 触发重登；不做回填（无法还原明文）。

### 数据库变更（B 系列前置）✅ 已实现

- **B0. 迁移 SQL（Supabase SQL Editor 执行）**
  - `jj_user_sessions` 增加 `refresh_token_hash VARCHAR(255)`、`refresh_expires_at TIMESTAMPTZ`；建 `UNIQUE` 索引（nullable 允许多 NULL，老行无碍）。
  - 更新 `fn_cleanup_expired_sessions`：`WHERE COALESCE(refresh_expires_at, expires_at) < NOW()`（按 refresh 真正过期才清理，避免 access 过期即删导致 refresh 孤儿）。
  - 同步更新 `docs/database-init.sql`（权威 schema）。
  - 受影响：无 ORM，需手动执行；提醒用户执行并记录到当日日志。

### 后端（backend/src/auth/）✅ 已实现

- **B1. TokenService**：拆分 TTL 常量（`ACCESS_TTL_MS=2h`、`REFRESH_TTL_MS=14d`，可走 env）；新增 `generateRefreshToken()`、`getAccessExpiresAt()`、`getRefreshExpiresAt()`。
- **B2. AuthService.createSessionInternal**：生成 access+refresh 双 token，写一行（token_hash + expires_at + refresh_token_hash + refresh_expires_at），返回两者。
- **B3. login / register**：返回 `{ user, accessToken, refreshToken }`（breaking）。
- **B4. 新增 refreshAuth(refreshToken)**：用长 token(refresh)（hash + refresh_expires_at）校验 → 发新短 token(access) 并返回；**默认不轮换长 token（保持稳定，符合"长token"语义）**。轮换失效 + 复用检测（旧 refresh 被复用→吊销该 user 全部 session）列为可选安全加固，见 S 系列。
- **B5. 新增 `POST /auth/refresh`**：`RateLimitGuard`（防刷新令牌爆破），**不挂** `TokenAuthGuard`；新增 `refresh.dto.ts` 校验 `refreshToken` 非空。
- **B6. switch-account**：复用 refresh token 跳过验证码（语义同现"免验证码"）；返回新双 token（旧账号 session 保留，多账号并存）。
- **B7. logout**：按 access `token_hash` 删除该行（access+refresh 同时失效），逻辑不变。
- **B8. change-password / reset-password**：仍删除该 user 全部 session（含 refresh），逻辑不变。
- **B9. 清理/上限函数复核**：`fn_limit_user_sessions` 计数不变（一行=一会话）；`fn_cleanup_expired_sessions` 见 B0。

### 前端 PC（frontend/src/）✅ 已实现

- **F1. services/api.ts**：`storeToken` 拆为 `storeAccess/storeRefresh`；新增 `refresh()` 调 `/auth/refresh`；`login/register/switchAccount` 适配新返回。
- **F2. request() 自动刷新**：401 触发 single-flight 刷新（并发请求共享同一个刷新 Promise + 重试队列）；刷新失败 → `clearStoredToken()` + 跳登录。
- **F3. utils/auth.tsx（AuthContext）**：登录成功持久化双 token；logout 清理两者；冷启动 hydrate。
- **F4. utils/savedAccounts.ts / SwitchAccountModal**：消费新返回结构（双 token）。
- **F5. 类型**：新增 `TokenPair` 类型；`UserProfile` 不变。

### Taro（taro/src/）✅ 已实现

- **T1. services/api.ts**：同 F1（双 token 存储 + `refresh()` 函数；`storeToken` 拆为 access/refresh，`hydrateAuthFromStorage` 回填两者）。
- **T2. request() 自动刷新**：401 触发 single-flight 刷新 + 重试队列；刷新失败 → `clearStoredToken()` + `reLaunch` 登录。
- **T3. context/AuthContext.tsx**：登录持久化双 token；logout 清理。
- **T4. utils/savedAccounts.ts**：消费新返回结构（双 token）。

### 测试与迁移（X 系列）✅ 已实现（X3 三端 tsc/build 通过；X1/X2 运行时联调待部署后验证）

- **X1. 本地手动验证**：登录拿双 token → access 过期后用 refresh 换发成功 → 轮换后旧 refresh 失效 → 复用旧 refresh 触发全量吊销 → logout 同时失效。
- **X2. 老会话兼容**：无 refresh 的老 token，access 仍可用至 `expires_at`，之后 401 重登（客户端已有该兜底）。
- **X3. 三端校验**：`npx tsc --noEmit`（前端/后端/Taro）、`npm run build:prod`（前端）、`npm run build:weapp`（Taro）。
- **X4. 上线协同**：后端与两前端必须同批次发布（返回结构 breaking）；灰度顺序建议 后端 → 前端 PC → Taro。

### 安全加固（S 系列）部分完成（2026-07-23）

- **S1.** ✅ 折中：PC refresh 改存 `sessionStorage`（关标签失效）；完整 httpOnly Cookie 待评估多账号。
- **S2.** ✅ `/auth/refresh` 限流 5 次/分钟 + IP/UA 审计日志。
- **S3.** ✅ 轻量：刷新时记录 UA/IP 日志（不做硬绑定，避免误杀）。

---

### ✅ 已完成

#### 2026-07-24 shared-utils 双端纯函数/文案包
- 新增 `@family-bookkeeping/shared-utils`：form/success/error/action/confirm/empty/entity/sort/invite/frequency/roles/userDisplay/validation/upload/errorMessage/emoji/transactionType/date/month/budget 等同源实现。
- `frontend/src/utils/*` 与 `taro/src/utils/*` 对应文件改为 re-export 门面，消除双端漂移。
- 统一 `EMPTY_BUDGET_NO_EXPENSE_CATEGORIES`；budget 补 `formatMoneyByType`；date 兼容 Taro `fmtDate`/`fmtFriendlyDate`。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 entityCopy 实体名 + 空态/定位文案收口
- 双端 `entityCopy`：`ENTITY_CATEGORY/TEMPLATE/BOOK/TRANSACTION/BUDGET`；列表标题、创建按钮、成功 toast 实体名统一。
- 双端 `emptyCopy`：当天流水/成员/平台用户/商户空态；Dashboard、Map、Calendar、BookMemberList、Admin、MerchantDrawer 接线。
- 双端 `formCopy` 定位文案 + `uploadCopy.IMAGE_SELECT_FAILED_SHORT`；LocationPicker / ImageUpload / IconGrid 隐私与选图提示收口。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 emptyCopy 扩展 + sortCopy 排序提示 + Dropdown 箭头 Icon
- 双端 `emptyCopy`：流水/首页/预算/成员对比/Admin 等高频空态描述收口。
- 双端 `sortCopy`：`SORT_NOTHING`/`SORT_UNCHANGED`；Taro `useReorder` 接线。
- 记一笔附件失败文案走 `ERROR_RECEIPTS_*`；隐私协议 toast 走 `FORM_PRIVACY_REQUIRED`。
- PC `Dropdown` chevron → `Icon chevron-down`。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 校验默认文案 + actionCopy 扩展 + 公共 Icon 收口
- 双端 `formCopy`：密码/邮箱校验默认文案 + 返回/返回登录；`validation.ts` 默认值同源。
- 双端 `actionCopy`：`ACTION_PROCESSING`/`ACTION_SWITCHING`/`processingLabel`；ConfirmDialog/useSubmit/BookCreateModal/Spinner/Map aria 收口。
- 双端 `errorCopy`/`successCopy`：Admin 角色状态、切换账本、年报导出、刷新提示。
- Taro 公共 UI Icon 收口：Input 清除、IconGrid 删除、DropdownSelect、List/MenuList 箭头、FieldRow/LocationField、ImageUpload；页面级 Profile/Books/About/Onboarding/MonthPicker 等。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 模板 payload / 记一笔草稿 shared
- `templatePayload`：build/validate/toForm/copy/empty/applyToTransaction/resolveCategoryDisplay
- `addTransactionDraft`：key/parse/serialize 纯函数；PC 仍用 sessionStorage 适配
- 双端模板页与记一笔应用模板已接线

#### 2026-07-24 交易 payload / 表单校验 / 分类色 / 剪贴板
- `buildTransactionPayload`、`validateTransactionFormFields`、`validateInviteCode` 抽入 shared-utils
- `categoryColors` tone/class/cssVar 共用；clipboard `normalizeClipboardText` 共用
- 双端记一笔提交、邀请码加入、Taro Onboarding 已接线

#### 2026-07-24 savedAccounts / categories 纯逻辑 shared
- `savedAccounts`：解析/序列化/upsert/patch/legacy 迁移与 token key 抽入 shared-utils；端侧仅保留 Storage 适配
- `categories`：filter/lookup/options/sort 纯函数 shared；双端 useCategories/useCategoryLookup 接线
- 附：`frontend|taro/src/utils/categories.ts` facade

#### 2026-07-24 图标纯数据 shared + fmtAmount
- `bookIcons` / `platformIcons` 纯数据与 SVG 工具抽入 `shared-utils`；PC 保留 React 渲染，Taro 保留 data URL 别名
- `fmtAmount` 并入 shared budget；双端 `renderCategoryIcon` 统一 `isIconUrl/isPlatformIcon/isBookIconKey` 判定
- 附：PC 暗色第六轮与 sortOrder 已在上一提交

#### 2026-07-24 PC 暗色第六轮（硬编码色 + 图表 chrome）
- 无效 token 收口：`--bg-card/--line/--bg-elevated/--bg-soft` → `--srf/--bd/--srfH`；补 `--expBd` 令牌
- ECharts canvas 主题：新增 `getEchartsChrome()`，Trend/分类饼/成员对比坐标轴·图例·tooltip 随 `resolvedTheme` 刷新
- EmptyState 插画运行时按令牌重着色；RankList 渐变 `white`→`var(--srf)`；spotlight 暗色脉冲改 `color-mix(var(--pr))`
- Tailwind 色板/阴影映射 CSS 变量；记一笔删除按钮 oklch → exp color-mix
- 附：排序纯函数 shared-utils（sortOrder/parseImageList）+ 双端 useSort/useReorder 对齐 skip-unchanged

#### 2026-07-24 errorCopy / 筛选文案接线 + 暗色第五轮 + Icon 收口
- 新增双端 `utils/errorCopy`：操作失败/CRUD/邀请/预算/OCR/会话失效等统一；`failEntityUpsert` / `failUpdateOrSave`；`errorMessage`/`notifyError`/`toastError` 默认 fallback 走 `ERROR_OP_FAILED`。
- 双端接线：Categories/Books/Templates/Budgets/记一笔/Auth/Profile/流水等 errorMessage 与 toast 改常量；`formCopy`/`successCopy` 补转移拥有者、注销、OCR、重发验证码等。
- 流水筛选：`FILTER_ALL_*` + `TRANSACTION_TIME_FILTER_LABELS` 双端复用（PC Transactions/Map + Taro Transactions）。
- PC 暗色第五轮：年报图表阴影 `--sh2`、Auth 插图 drop-shadow 随 `--fg`、Dashboard 进度渐变 `white`→`var(--srf)`、地图 marker 阴影随主题 `fg`。
- Icon 收口：Onboarding 箭头 `chevron-right`；Taro 流水搜索清除/筛选箭头、自定义图标删除、模板选择关闭等 `×/✕` → `Icon close`。
- 验证：frontend / taro `tsc --noEmit` 通过。


#### 2026-07-24 上传限制/实体标题/鉴权按钮复用
- 双端 `uploadCopy`：5MB/MIME/失败文案与 `isAllowedImageMime`/`isWithinUploadSize`/`maxImagesMessage`；IconGrid/头像/记一笔附件收口。
- 双端 `entityCopy`：新建/编辑标题与「+ 新建X」按钮文案；分类/模板/账本列表与表单。
- `formCopy`/`successCopy` 补上月预算、当前账号/账本、隐私协议、头像/模板应用等；Auth 主按钮样式收敛到 `ui-btn--primary lg block`，去掉 `btn-submit` class。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 表单/空态/成功文案扩展与剪贴板复用
- 双端 `formCopy`：名称/金额/分类/模板/邮箱/验证码等高频校验与 placeholder。
- 双端 `emptyCopy`：模板/账本/分类/预算/报表空态描述统一。
- `successCopy` 扩展邀请/账本/成员/登录注册/验证码等；`copyToClipboard` 双端剪贴板 helper。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 月份展示 / 排序文案 / 成功提示 / 类型短标签复用
- 双端 `formatMonthDisplay` / `formatMonthDisplayCompact`：预算·报表·成员对比月份展示统一。
- 双端 `sortCopy`：编辑/完成/保存排序与「排序已保存」；PC/Taro 分类·模板工具栏收口。
- 双端 `successCopy`：高频成功 toast（删除/创建更新/预算/图标/邀请/账号等）统一。
- `transactionTypeShortLabel` / `categoryTypeTabLabel`；Taro `formatMoneyByType`；MerchantDrawer「清除」改 `Button`。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 actionCopy / Spinner / 类型样式 / 时间分钟格式复用
- 双端 `utils/actionCopy`：加载/保存/删除/复制/提交文案 + `busyLabel` 系 helper；`confirmCopy.CONFIRM_DELETE_LOADING` 同源。
- PC `ui/Spinner`：GlobalModal 确认 loading、SwitchAccount 切换中复用。
- `transactionTypeStatusClass` / `transactionTypeAmountClass` + `formatAmountByType`；Admin 流水与记一笔模板选择收口。
- 双端 `formatDateTimeMinute`：账本/分类/模板/邀请码详情创建·更新时间统一。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 确认文案 / Icon / Admin 状态 / 按钮收口
- 新增双端 `utils/confirmCopy`：删除/移除/预算复制确认 title·正文·按钮文案统一；PC 账本删除补全风险说明。
- 新增 PC `utils/userStatus`：Admin 用户状态标签/样式/操作文案与筛选 options 复用。
- Icon 补 `chevron-down`；侧栏折叠/用户菜单、About 时间线、Profile 头像占位、IconGrid 删除、记一笔附件删除改 `Icon`。
- 记一笔类型切换改 `SegControl` + `TRANSACTION_TYPE_OPTIONS`；Dashboard「全部」、年报保存改 `Button`。
- 地图/Book 弹层 `var(--ov)` 去硬编码 fallback；KeepAlive 移除与地图首屏空白已单独提交。
- 验证：frontend / taro `tsc --noEmit` 通过。

#### 2026-07-24 useMutationAction 增强 + Budgets/流水/Admin 预取收口
- `useMutationAction` 支持 `successMessage` 函数、`shouldCommit`、带 result 的 onSuccess/onError。
- Budgets 去掉分散 `useMutation`+`useDebouncedAction`，统一 upsert/复制 mutation。
- 流水删除改为 `useMutationAction` + `TRANSACTION_IMPACT_ROOT_KEYS`。
- `prefetchRoute` 覆盖 Admin 三页 query + chunk；侧栏管理菜单 hover/focus 预取。
- 验证：frontend `tsc --noEmit` 通过。

#### 2026-07-24 KeepAlive / 预取 / 金额格式复用
- ~~接入 `KeepAliveHost`~~ 已回滚：路由级 KeepAlive 与 AMap 冲突，统一改走 React Query 缓存 + 普通路由切换。
- 抽取 `utils/prefetchRoute.ts`：侧栏 hover/focus 统一 query 预取 + 页面 chunk 预加载。
- `formatAmount`/`formatAmountWithType` 薄封装 `formatMoney`，单一金额格式实现。
- 记一笔保存成功清除草稿；frontend `tsc --noEmit` 通过。

#### 2026-07-24 用户展示名 + 邀请码文案复用
- 双端新增 `utils/userDisplay.ts`：`userDisplayName` / `userInitial`（含中文首字）。
- 双端新增 `utils/inviteCopy.ts`：邀请码获取说明常量。
- 侧栏/切换账号/账本成员/Profile 展示名；Books 邀请提示与 Onboarding 文案收口。
- 验证：frontend/taro `tsc --noEmit` 通过。

#### 2026-07-24 角色文案 + formatDateTime 复用
- 双端新增 `utils/roles.ts`：`bookMemberRoleLabel` / `isBookOwnerRole` / `platformUserRoleLabel` / `isPlatformAdmin`；统一 owner → 账主。
- PC 账本成员列表、Admin 用户角色；Taro Books/BookMembers/BookCard 角色展示收口。
- Taro 补齐 `formatDateTime`，TemplateManager 详情时间展示对齐。
- 验证：frontend/taro `tsc --noEmit` 通过。

#### 2026-07-24 收支类型文案 + parseAmount 复用
- 双端新增 `utils/transactionType.ts`：`transactionTypeLabel` / `TRANSACTION_TYPE_OPTIONS` / `TRANSACTION_TYPE_FILTER_LABELS`。
- 双端 `parseAmount`；模板/分类/流水/记一笔类型文案与 Taro 模板金额 sanitize 收口。
- 验证：frontend/taro `tsc --noEmit` 通过。

#### 2026-07-24 金额工具 + 记一笔表单字段复用
- 双端 `sanitizeAmountInput` / `isValidPositiveAmount`（budget.ts）；PC/Taro 记一笔与 AmountCard 收口。
- PC `TransactionForm`：金额/日期/品牌走 `FormField`，备注走 `Textarea`；校验统一 isValidPositiveAmount。
- Onboarding 退出、账本成员移除按钮图标改 `Icon`。
- 验证：frontend/taro `tsc --noEmit` 通过。

#### 2026-07-24 FormField + Icon 关闭收口 + Taro 上传 helper
- PC 新增 `FormField`：Login/Register/Forgot/Profile 文本字段统一 form-group+label；验证码行走 children。
- Textarea/Dropdown 清空、SwitchAccount 移除/过期、Calendar 月份导航、模板选择/商家历史关闭 → `Icon`。
- Taro 记一笔抽取 `uploadPendingReceipts`（进度 loading + 失败计数）。
- 验证：frontend/taro `tsc --noEmit` 通过。

#### 2026-07-24 密码框/频率/记一笔 payload 复用收口
- PC 新增 `PasswordField`：Login/Register/Forgot/Reset/Profile 改密统一显隐切换，去掉分散 show* 状态。
- `ui/Input` 眼标/清空/搜索改用 `Icon`；`formatFrequency` + `FREQUENCY_OPTIONS` 双端；模板详情/表单/Taro TemplateManager 收口。
- Taro 记一笔抽取 `buildTransactionPayload` + `utils/parseImageList`（对齐 PC cleanUrl）。
- 验证：frontend/taro `tsc --noEmit` 通过。

#### 2026-07-24 PC 暗色第四轮 + Icon 体系 + 模板详情体验
- 记一笔 `useTransactionForm` 提交统一 `useMutationAction`（payload/上传/invalidate 收口）。
- PC 暗色第四轮：主色面上的 `white`/`rgba(255,255,255,*)` → `var(--on-pr)` / `color-mix`；Admin 粘性列阴影、地图 badge/marker、StatCard/Dashboard/Onboarding/Auth 英雄区收口。
- 新增 `components/ui/Icon` + `ICON_COLOR`（对齐 Taro 语义色）；侧栏/用户菜单/鉴权眼标/About/Drawer/GlobalModal/SwitchAccount 关闭图标复用。
- ErrorBoundary 重试改为 `Button`；模板详情隐藏 book_id/poi_id 等技术字段，位置优先展示地址名。
- 验证：frontend `tsc --noEmit` 通过。

#### 2026-07-24 React Query 缓存复用：queryKeys / cachePolicy / queryClient
- 新增 `utils/queryKeys.ts`：全站 key 工厂 + book 维度隔离 + `BOOK_SCOPED`/`USER_SCOPED`/`TRANSACTION_IMPACT` 根 key 与 invalidate/remove 助手。
- 新增 `cachePolicy.ts`（STALE/GC）、`queryClient.ts` 单例；`main.tsx` 共用。
- 新增 `addTransactionDraft.ts`：记一笔按账本 sessionStorage 草稿。
- 迁移 hooks（auth/useBook/categories/templates/annual/member*）与 Dashboard/流水/预算/日历/地图/报表/Admin/账本等调用点。
- `useMutationAction`/`useSort` 支持只读 `QueryKey`。
- 流水筛选状态同步 URL；验证 frontend `tsc --noEmit` 通过。

#### 2026-07-24 UI 复用收口第三轮 + 暗色/图标/校验
- EmptyState 剩余 `title=` 收口为单段 `description`（Transactions/Admin/Map/Calendar 等）。
- 双端新增 `utils/validation.ts`：密码长度/匹配/强度/字母数字、邮箱校验；Profile/EditProfile/Register/Forgot/Reset 迁移。
- PC 预算「复制上月」补确认弹窗（对齐 Taro）。
- PC 暗色第三轮：主色上文字 `#fff` → `var(--on-pr)`；常见 modal 阴影改 `var(--sh*)`；地图 marker 描边随 `theme.srf`。
- 手写控件：地图历史筛选改 `SegControl`；关闭/导航/图片删除补 `type`+`aria-label`。
- Taro 图标：`SheetHeader` 返回/关闭改 `Icon` mask 着色；`ICON_COLOR.onPrimary` 走令牌。
- 模板详情金额改 `formatMoney`；部署文档 `/bookkeeping` 路径同步。
- 验证：frontend/taro `tsc --noEmit` 通过。
- 备注：工作区另有未提交的 queryKeys/cachePolicy 半成品（未纳入本 commit），后续专项完成。

#### 2026-07-24 notify 统一 + EmptyState 单段文案
- PC 全站业务侧 `notify({type})` 收口到 `notifySuccess/Error/Info`（含 api request、useMutationAction）。
- EmptyState 双端统一为插画 + 单段描述；`title` 兼容旧调用，与 description 并存时自动合并。
- 验证：frontend/taro `tsc --noEmit` 通过。


#### 2026-07-24 formatMoney 增强与 Admin/Taro 金额收口
- `formatMoney` 双端新增 `wan`（≥1万 → X.X万）；负数统一 `-¥…` 语义。
- Admin 看板/交易、PC 模板详情、Taro Home/流水/预算/模板/记一笔金额统一走 formatMoney。
- `fmtAmount` 保留为无货币符简写，文档指向 formatMoney。
- 新增 `notifyInfo`、`formatDateTime`；校验文案与 Admin 注册时间收口。
- 验证：frontend/taro `tsc --noEmit` 通过。


#### 2026-07-24 金额格式 + Taro toast 统一
- 扩展 `taro/src/utils/toast.ts`（toastSuccess/Info/Warn/Error），页面几乎全部迁离直接 `Taro.showToast`；`useSubmit` re-export `toastError`。
- PC 地图/日历/年报金额改用 `formatAmount` / `formatMoney`，删除日历与年报本地 format 函数。
- 验证：frontend/taro `tsc --noEmit` 通过。


#### 2026-07-24 复用收口：EmptyState 插画 / MetricRow / 空态 CTA / FooterActions
- 双端 EmptyState 默认插画统一（人物+空箱+问号）。
- PC 新增 `MetricRow`，报表总收入/总支出迁移。
- 双端 `EmptyAddTransactionAction` / `EmptyActionButton`，Dashboard/流水/报表/Home 等空态 CTA 收口。
- 多个 GlobalModal footer 改用 `FooterActions`（账本/模板/邀请/预算/定位）。
- 验证：`frontend`/`taro` `tsc --noEmit` 通过。


#### 2026-07-24 PC 暗色全站硬编码色第二轮
- 补齐缺失 `--bdH` / `--hover` 令牌；Toast、年报 Tailwind 浅色类、输入清除悬停、语义色/遮罩/品牌 rgba 收口为 `var`/`color-mix`；地图 marker 与图表色随 `themeColors`。
- 验证：`frontend npx tsc --noEmit` 通过。


#### 2026-07-13 对齐 Taro 分类详情与 PC 端
- **分类详情 BottomSheet**：从上下居中布局改为 PC 同款左右布局（图标居左、名称/标签居右），信息字段改为 2 列网格（label 在上 value 在下），颜色与 PC 一致（支出红、收入绿、默认灰、自定义绿）。
- **工作台入口确认**：Taro 工作台 5 个入口（记一笔 / 账本 / 分类 / 模板 / 预算）均可在 PC 端找到对应功能（记一笔对应主菜单，其余 4 项对应「更多」组），已在注释中明确映射关系。
- **验证**：`taro npx tsc --noEmit` 零错误；`npm run build:weapp` 通过。

#### 2026-07-13 修复 Taro 邀请码加入账本 loading 卡死
- **问题**：接口返回（含 404）后「加入中…」loading 未停止，取消/关闭按钮无响应。
- **根因**：Books / Onboarding 中手动维护 `joining`/`submitting` 状态 + `joiningRef` + 安全定时器，在 Taro 微信运行时偶发状态不同步；且取消/关闭按钮每次渲染生成新内联函数，事件处理不稳定。
- **修复**：
  - 两处均改用 `@tanstack/react-query` 的 `useMutation` 管理 `isPending`，由 React Query 内部保证 loading 随 Promise settle 正确复位。
  - Books 的取消/关闭抽出 `closeJoinSheet` 稳定 `useCallback`，关闭时调用 `joinMut.reset()` 清除可能残留的 pending 状态。
  - 移除 `joiningRef`/`safetyTimer`/`setJoining` 等手动样板。
- **验证**：`taro npx tsc --noEmit` 零错误；`npm run build:weapp` 通过。

#### T1. 清理 tsc 报错与孤儿文件 — 完成
#### T2. 双平台构建验证 — 完成（weapp + h5 均通过）
#### T3. 工作台四模块对齐核查 — 完成
- Books：详情补 更新时间 / 账主ID ✅
- TemplateManager：复制模板 ✅ + 修复整页样式缺失（重大预存缺陷）✅
- Categories / Budgets：核心 CRUD/图标/排序与 PC 基本一致
#### T4. 流水页体验对齐 — 完成
- Transactions 已具备 搜索 / 筛选 Tab / 分类筛选 / 月份切换 / 统计汇总 / 详情弹窗(含编辑入口) / 批量删除，与 PC 一致
#### T5. 全局体验一致性巡检 — 完成（本轮）
- **首页 Home**：概览卡补「本月收入/支出笔数」（`summary.incomeCount/expenseCount`，后端已返回，此前未渲染）✅
- **BookMembers**：补三态角色标签（所有者/管理员/成员，按 `role` 字段）；新增「生成邀请码」入口（复用 `createInvitation` + `setClipboardData` 自动复制，能力此前仅在 Books 详情弹窗、成员/设置入口未暴露）✅
- **Books 详情**：`Book` 类型补 `txn_count`/`member_count`/`is_archived` 可选字段（后端 `/books` 已返回）；详情展示「N 人·M 笔交易·创建/更新时间」+ 已归档标签 ✅
- Login / Register / ForgotPassword / EditProfile / About / Profile：与 PC 核心一致，无需改动（Profile 无主题切换，属可选差异）
- 验证：`tsc --noEmit` 零错误；`build:weapp` 通过

### ✅ 已完成（2026-07-24 公共复用第三批）
- **错误文案扫尾**：`getErrorMessage` 支持 `errMsg`；PC `notifyError`；Taro 多页/useReorder/BookCard 等 `toastError` ✅
- **month utils**：`monthDateRange` / `toMonthKey` / `parseMonthKey`，`useMonthSelector` 消费公共函数 ✅
- BookSettings 转移 footer → FooterActions ✅

### ✅ 已完成（2026-07-24 公共复用续）
- **date utils**（PC/Taro 对齐）：`formatDateYMD` / `formatFriendlyDate` / `todayBeijing`；旧 `fmtDate` 别名保留 ✅
- **getErrorMessage + toastError**：mutation / 提交失败文案统一 ✅
- **FooterActions**（双端）+ **PC StickyActionBar**：Profile/记一笔/模板选择/GlobalModal/SwitchAccount/Books sheet/ConfirmDialog 收口 ✅

### ✅ 已完成（2026-07-24 公共复用抽离）
- **budget utils + useBudgetProgress**（PC/Taro 对齐）：进度变体、金额 formatMoney、分类风险排序、status→variant 映射 ✅
- **StickyActionBar**：BookSettings / TemplateEdit / EditProfile 底栏统一 ✅
- Dashboard / Home / Budgets 改为消费公共能力，去掉页内重复阈值判断 ✅

### ✅ 已完成（2026-07-24 PC 暗色硬编码色扫尾）
- 地图/Profile/账本弹窗/记一笔/鉴权/SwitchAccount 等 SCSS：浅色硬编码与错误 token fallback → 设计令牌 ✅
- 报表/年报/地图 marker：新增 `themeColors.ts`，ECharts 与 inline style 读 `--exp/--inc/--srf` 等 ✅
- 兼容别名补齐：`--color-*` / `--on-pr`；主题检测统一 `data-theme` ✅

### ✅ 已完成（2026-07-24 全量 UI 收口）
- **鉴权/弹窗按钮**：PC Login/Register/Forgot/Reset `btn-submit`、GlobalModal 确认、SwitchAccount 过期弹窗、Onboarding 退出 → `Button` ✅
- **Taro 确认与模板**：ConfirmDialog / GlobalModal confirm、TemplateEdit 底栏与位置图标、BookCard 邀请添加、LocationPicker 底栏/定位图标/暗色 callout ✅
- **设计令牌**：空态图标色对齐 `--fg3`；Books/BookSettings 过渡改 `var(--df)/var(--dn)` ✅

### ✅ 已完成（2026-07-24 续）
- **PC Dashboard 预算卡**：总览进度 + 分类预警列表、超支优先排序、暗色令牌适配 ✅
- **手写按钮收口（第二批）**：Taro Books 详情/加入/切换、BookSettings 底栏/转移、LocationPicker 底栏；PC 记一笔/流水详情/模板选择/个人资料 → `Button` ✅
- **切换账本文案**：移除已下线模块（报表/日历/地图/年报），对齐当前 Tab（首页/流水/工作台/我的） ✅

### ⏳ 待处理（低优先级，非阻断，可延后）

- **Budgets 月份选择搜索**：MonthPicker 已扩展可选未来月（至次年 12 月）与更早历史（2018 起）；仍无搜索框（原生 Picker 限制，可接受）
- **S1 完整 httpOnly Cookie**：PC refresh 已改为 sessionStorage 折中方案；完整 Cookie + CSRF 与多账号切换冲突，专项评估后再做
- **平台上架配置（用户操作）**：D1 域名 / D2 类目 / D3 隐私指引 / E1 审核备注 / E2 全量回归 — 见上架清单


### ✅ 已完成（2026-07-23 图标与按钮收口）

- **Icon 体系**：支持 `color` + CSS mask 动态着色；导出 `ICON_COLOR`；TabBar 单资源着色（去掉双套 Image）
- **MenuList**：danger 用 danger 色，默认 primary 着色
- **手写按钮收口**：登录/注册/忘记密码/Onboarding/账本顶栏/Profile 弹窗/分类预算模板详情与表单脚、编辑资料密码弹窗 → `Button`

### ✅ 已完成（2026-07-23 UI 体验二轮）

- **骨架屏统一**：`PageContainer/PageLayout` 支持 `loadingVariant=list|cards|home|overlay`；首页/流水/账本/分类/模板/预算/成员改用骨架
- **主操作按钮统一**：预算/分类/模板工具栏、编辑资料保存改用 `Button` 组件
- **PC 预算空态**：无分类时引导跳转分类管理；PC `secondary` 按钮对齐品牌浅绿
- **暗色 TabBar**：active 主色暗色用 `#45B7A7`；ConfirmDialog 点击热区 ≥44pt

### ✅ 已完成（2026-07-23 UI 统一）

- **Taro 设计令牌收口**：页面/组件 SCSS 硬编码色改为 `var(--pr/--fg/--exp/…)`，暗色模式可穿透
- **ConfirmDialog / Button**：层级 `--z-critical`；danger pressed 不再误用主色
- **空态引导**：首页/流水/预算 EmptyState 补主操作按钮；首页最近交易可点进编辑 +「全部」
- **工作台**：补充 PageHero 信息区

### ✅ 已完成（2026-07-23 优化全量）

- **PC 预算落库**：单条编辑 / 删除改为立即 `upsertBudgets`；批量保存包含清零项；新增「复制上月」
- **Taro 预算**：批量保存支持清零落库；「复制上月」确认弹窗；月份范围已扩展
- **useManualQuery**：30s 内存缓存 + `invalidateManualQuery`；写后可主动失效
- **Profile 主题**：Taro 已有暗色切换（此前 TASKS 过时）
- **安全 S2/S3 轻量落地**：`/auth/refresh` 限流 5/min + IP/UA 审计日志；S1 折中为 refresh→sessionStorage
- **冷启动文案**：前后端超时提示「服务可能正在冷启动」
- **CI**：`.github/workflows/ci.yml` 三端 tsc + build
- **L7 邀请表主键**：`database-init.sql` 已是 UUID，历史遗留关闭
- **UGC**：`.env.example` 标注生产需开启 `WECHAT_MSG_SEC_CHECK_ENABLED`

### ✅ 已完成（2026-07-23 体验收尾）

- **Budgets 清零确认**：详情「删除预算」与编辑金额置 0 共用确认弹窗；修复确认前误清空 `detailCat` 导致删除失效的问题
- **Template 详情交互对齐 PC**：列表点卡片 → 只读详情（含商户/周期/起止日期/上次执行/创建时间等元数据）→ 执行/编辑/复制/删除；非直接进编辑
- **Taro 体验补丁**：登录/注册/Onboarding/模板执行等成功 toast；流水页去掉不可用的 AbortController，改请求序列号竞态兜底；协议页加入 Auth 白名单；自定义图标选中值对齐 `icon_url`

### ✅ PC Web 自动化测试发现项（2026-07-07 已修复）

- **Sidebar SVG React warning**：流水图标已改为 React 兼容的 `strokeWidth`。
- **Books 切换账本确认弹窗 DOM nesting warning**：`GlobalModal` confirm 内容容器已从 `<p>` 改为 `<div>`，支持段落/列表等富文本 children。
- **AnnualReport 数据健壮性**：年度报告页已在接口边界补默认值/类型收束；e2e 已用稀疏 `/reports/annual` mock 回归缺字段场景，并移除 console warning 临时豁免。

---

## 历史遗留（跨项目、非阻塞、主动延后项）

### H2. 前端 CRA → Vite 迁移
- **路径**：`frontend/`（`vite.config.ts`、`package.json` scripts）
- **状态**：✅ 已完成（2026-07，commit `978ea79`）— React 18 + Vite 5，环境变量前缀 `VITE_`，三端类型收口至 `@family-bookkeeping/shared-types`

### H3. PC Web 生产构建 warning 清理
- **状态**：✅ 已完成 — 已清理 `mini-css-extract-plugin` CSS chunk 顺序冲突、Sass `@import` deprecation、以及项目代码 eslint warnings；`build:prod` 显示 `Compiled successfully`。
- **备注**：命令行仍可能出现用户级 npm 配置提示（`electron_mirror` 来自 `/Users/zhaolong/.npmrc`）（历史备注；迁移 Vite 后相关 CRA 内部 warning 已消失）。

### M8. 三端 TypeScript 类型定义独立维护
- **现状**：业务实体类型已收口到 `shared-types/`（`@family-bookkeeping/shared-types`）；后端 DTO / 部分响应形状仍可能本地定义
- **状态**：✅ 主体完成 — 新增字段时优先改 `shared-types`，再同步后端 DTO

### L7. 数据库 `jj_book_invitations` 主键类型不一致
- **状态**：✅ 已统一为 UUID（见 `docs/database-init.sql`）

---

## 微信小程序上架准备（2026-07-18 启动）

> 目标：补齐小程序上架过审必需的合规功能与配置
> 范围：Taro 端代码 + 后端注销账号接口 + 配置文件调整；平台后台配置（域名/类目/隐私指引/客服）由用户在 mp.weixin.qq.com 操作

### A. 隐私政策与用户协议合规（代码层）

- [x] **A1** 新增「用户协议」页面 `pages/Terms/index`（纯静态内容）
- [x] **A2** 新增「隐私政策」页面 `pages/Privacy/index`（纯静态内容，列明收集的邮箱/密码/昵称/头像/位置/相册相机/UGC）
- [x] **A3** `app.config.ts` 注册 Terms/Privacy 页面 + 开启 `__usePrivacyCheck__: true`
- [x] **A4** 注册页加「我已阅读并同意《用户协议》《隐私政策》」勾选框 + 跳转链接，未勾选禁止注册
- [x] **A5** 登录页底部加协议链接（已登录场景弱提示）
- [x] **A6** About 页加「用户协议」「隐私政策」两个入口

### B. 注销账号功能

- [x] **B1** 后端新增 `POST /auth/deactivate` 接口（软删除：`status='deleted'` + 清空 `password_hash` + 清除全部 session）
- [x] **B2** 后端 `AuthService.deactivateAccount` 实现 + DTO + controller 注册
- [x] **B3** Taro `authApi.ts` 新增 `deactivateAccount()` 调用
- [x] **B4** Profile 页加「注销账号」入口（二次确认弹窗 + 调用接口 + 退出登录清理）

### C. 配置调整

- [x] **C1** `project.config.json` 的 `urlCheck` 保持 `false`（仅影响微信开发者工具本地调试，不影响线上审核；线上由微信后台服务器域名白名单决定）— **提交审核前由用户在微信开发者工具「详情 → 本地设置」临时勾选「不校验合法域名」开关自测**，确认线上域名配置无误
- [x] **C2** 验证：Taro `tsc --noEmit` + `build:weapp` 通过；后端 `tsc --noEmit` + `build:prod` 通过（2026-07-18）
- [x] **C3** 新增 `sitemap.json` 并在 `app.config.ts` 中配置 `sitemapLocation`，将全部页面排除在微信搜索索引之外

### D. 平台后台配置（用户操作，不在代码范围）

- [ ] **D1** mp.weixin.qq.com「开发管理 → 开发设置 → 服务器域名」配置：request/uploadFile 填 `https://zlspace.site`，downloadFile 填 `https://zlspace.site` + `https://fvggqgeiwewsjojargxe.supabase.co`（域名已在上架清单回填，后台粘贴仍需用户操作）
- [ ] **D2** 小程序类目认证：建议「工具 → 效率」或「生活服务 → 便民服务」
- [ ] **D3** 微信后台「设置 → 服务内容声明 → 用户隐私保护指引」提交
- [x] **D4** 客服联系方式配置 — 已在 Taro Profile 页接入微信原生客服按钮（`<Button openType="contact">`），**用户需在 mp.weixin.qq.com「功能 → 客服」添加客服人员**
- [x] **D5** UGC 内容安全检测接入（后端 `security.msgSecCheck`）— 已实现 WechatService（`backend/src/wechat/`），接入 5 个 UGC 入口（交易备注/账本名称描述/分类名称/模板字段/用户昵称）。**启用步骤**：在 `backend/.env.production` 配置 `WECHAT_APPID` + `WECHAT_SECRET` + `WECHAT_MSG_SEC_CHECK_ENABLED=true`

### E. 提交审核前自检（用户操作）

- [ ] **E1** 提交审核备注附测试账号（邮箱+密码，验证码审核期间可用）
- [ ] **E2** 全量回归关键路径：注册（需勾选协议）→ Onboarding 创建账本 → 记一笔 → 注销账号
- [x] **E3** 检查无「测试/Demo/TODO」字样 — grep `taro/src` 无匹配（2026-07-18）
- [x] **E4** 主包大小检查 — `dist-prod/` 总计 1.2M，远低于 2MB 主包上限，无需分包（2026-07-18）
- [x] **E5** 启动加载 — 微信系统启动屏处理，无需自定义 splash；`__usePrivacyCheck__:true` 开启后敏感接口由微信自动弹原生隐私授权弹窗，无需显式实现 `wx.onNeedPrivacyAuthorization`
- [x] **E6** 生产部署与域名回填 — PC Web 与 CVM 后端已重新部署；`taro/.env.production` 已指向生产后端 `/api`；[微信小程序上架准备清单.md](./微信小程序上架准备清单.md) 已回填 request/uploadFile/downloadFile 域名（2026-07-19）

---

## 微信小程序上架准备 — 最终提交审核清单（2026-07-18）

> 审核备注、隐私指引、域名配置等可复制模板见 [微信小程序上架准备清单.md](./微信小程序上架准备清单.md)。

### 代码侧（已完成）

- ✅ 隐私政策页 + 用户协议页（`pages/Terms`、`pages/Privacy`）
- ✅ `__usePrivacyCheck__: true` 已开启
- ✅ 注册页协议勾选框 + 登录页协议链接 + About 入口
- ✅ 注销账号功能（后端 `POST /auth/deactivate` + Profile 页弹窗）
- ✅ 客服按钮（`<Button openType="contact">`）
- ✅ UGC 内容安全检测（WechatService，5 个入口接入）
- ✅ 主包 1.2M，无 TODO/测试字样

### 用户在 mp.weixin.qq.com 必做（按顺序）

1. **登录后台** → 「设置 → 基本设置」
   - 填写小程序名称、简介、服务描述（审核员会看）
   - 主体认证（个人主体即可）
2. **「设置 → 基本设置 → 服务类目」**
   - 添加类目：建议「工具 → 效率」（记账类一般不需金融资质）
3. **「设置 → 服务内容声明 → 用户隐私保护指引」**
   - 收集的信息：邮箱、密码、昵称、头像、地理位置、相册/相机、UGC 文本
   - 内容可参考 `taro/src/pages/Privacy/index.tsx` 的章节
   - 提交后等待审核（通常 1-3 天）
4. **「开发管理 → 开发设置 → 服务器域名」**
   - request 合法域名：`https://zlspace.site`
   - uploadFile 合法域名：`https://zlspace.site`
   - downloadFile 合法域名：`https://zlspace.site`、`https://fvggqgeiwewsjojargxe.supabase.co`
5. **「功能 → 客服」**
   - 添加客服人员微信号（否则点客服按钮提示"暂无客服"）
6. **「管理 → 版本管理」**
   - 上传代码（微信开发者工具 → 上传 → 填版本号和备注）
   - 提交审核：备注附测试账号邮箱+密码，说明验证码审核期间可用

### 用户在后端环境必做

- 编辑 `backend/.env.production`，添加：
  ```
  WECHAT_APPID=小程序AppID
  WECHAT_SECRET=小程序AppSecret
  WECHAT_MSG_SEC_CHECK_ENABLED=true
  ```
- 重新部署后端（脚本 `scripts/deploy-cvm.sh`）

### 提交审核前最终自测

- 在微信开发者工具「详情 → 本地设置」取消勾选「不校验合法域名」，确认线上域名配置无误
- 跑通完整路径：注册（勾选协议）→ Onboarding 创建账本 → 记一笔（含备注/地点）→ 编辑资料 → 切换账号 → 退出登录 → 重新登录 → 注销账号
- 测试敏感词拦截：尝试在交易备注输入违规词，确认提示「内容含违规信息」
