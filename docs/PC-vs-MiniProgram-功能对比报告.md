# 家庭记账系统 — PC 端与小程序端功能对比报告

> 对比时间：2025 年 6 月 17 日  
> 对比范围：`frontend`（PC Web 端）vs `taro`（微信小程序端）

---

## 一、两端页面/模块总览

### 1.1 PC 端页面列表（19 个路由）

| # | 页面 | 路由 | 功能概述 |
|---|------|------|----------|
| 1 | **Dashboard** | `/` | 首页仪表盘：本月结余/收入/支出统计、最近 5 笔交易、预算进度、快捷操作入口 |
| 2 | **Transactions** | `/transactions` | 交易流水：搜索、筛选（类型/时间/分类）、分页、详情弹窗、编辑/删除、图片预览 |
| 3 | **Reports** | `/reports` | 报表分析：月度趋势（ECharts 柱状图）、分类饼图、月对比/年对比、**成员对比** Tab |
| 4 | **AddTransaction** | `/add` | 添加/编辑交易：表单、位置选择、模板选择、图片上传、收据管理 |
| 5 | **Categories** | `/categories` | 分类管理：CRUD、**排序**、图标选择、自定义图标上传 |
| 6 | **Budgets** | `/budgets` | 预算管理：月度预算设置、复制上月预算、执行状态查看 |
| 7 | **Books** | `/books` | 账本管理：创建/编辑/删除、成员管理（邀请/移除/转让）、邀请码 |
| 8 | **Map** | `/map` | 消费地图：高德地图集成、足迹/热力图切换、商户汇总、**成员筛选**、**位置共享** |
| 9 | **Calendar** | `/calendar` | 现金流日历：月度网格、**农历显示**、每日收支、当日明细弹窗 |
| 10 | **Templates** | `/templates` | 模板管理：CRUD、**执行模板**、**排序** |
| 11 | **AnnualReport** | `/annual-report` | 年度报表：总览、月度趋势、分类排行、趣味记录 |
| 12 | **Profile** | `/profile` | 个人中心：资料修改、修改密码、退出登录 |
| 13 | **AdminDashboard** | `/admin` | 管理后台：平台统计数据（用户/账本/交易） |
| 14 | **AdminUsers** | `/admin/users` | 用户管理：列表、搜索、角色/状态修改、用户详情 |
| 15 | **AdminTransactions** | `/admin/transactions` | 交易管理：全平台交易列表、多维度筛选 |
| 16 | **Onboarding** | `/onboarding` | 新用户引导：首次使用引导流程 |
| 17 | **Login** | `/login` | 登录（含验证码） |
| 18 | **Register** | `/register` | 注册 |
| 19 | **ForgotPassword** | `/forgot-password` | 忘记密码（邮箱验证码重置） |

### 1.2 小程序端页面列表（20 个页面）

| # | 页面 | 路径 | 功能概述 |
|---|------|------|----------|
| 1 | **Home** | `pages/Home/index` | 首页：本月结余、收入/支出双卡片、预算进度、最近交易、**快捷记账**、FAB 浮动按钮 |
| 2 | **Transactions** | `pages/Transactions/index` | 交易流水：搜索、筛选（类型/时间/分类）、分页加载、详情弹窗、编辑/删除、**图片预览** |
| 3 | **Statistics** | `pages/Statistics/index` | 统计报表：月度趋势（CSS 柱状图）、分类饼图（CSS 环形图）、月对比/年对比、**导出 Excel** |
| 4 | **AddTransaction** | `pages/AddTransaction/index` | 添加/编辑交易：数字键盘、日期选择、位置选择 |
| 5 | **Categories** | `pages/Categories/index` | 分类管理：CRUD |
| 6 | **Budgets** | `pages/Budgets/index` | 预算管理：月度预算设置、复制上月预算 |
| 7 | **Books** | `pages/Books/index` | 账本管理：创建/删除、邀请成员（邮箱/邀请码） |
| 8 | **BookMembers** | `pages/BookMembers/index` | 账本成员：成员列表、**独立页面**、邀请/移除、所有者检查 |
| 9 | **BookSettings** | `pages/BookSettings/index` | 账本设置：**独立页面**、转让所有权、退出账本 |
| 10 | **Map** | `pages/Map/index` | 消费地图：地点分组列表、**调用微信原生地图**、交易跳转 |
| 11 | **Calendar** | `pages/Calendar/index` | 现金流日历：月度网格、每日收支、**当日明细**（TransactionItem） |
| 12 | **TemplateManager** | `pages/TemplateManager/index` | 模板管理：列表查看 |
| 13 | **AnnualReport** | `pages/AnnualReport/index` | 年度报表：总览、月度趋势、分类排行、趣味记录 |
| 14 | **Profile** | `pages/Profile/index` | 个人中心：菜单导航、**切换账号**（含 token 回退+密码登录）、退出登录 |
| 15 | **EditProfile** | `pages/EditProfile/index` | **独立页面**：编辑用户名/邮箱/头像 |
| 16 | **Settings** | `pages/Profile/Settings/index` | 设置页面 |
| 17 | **Login** | `pages/User/Login/index` | 登录（含验证码） |
| 18 | **Register** | `pages/User/Register/index` | 注册 |
| 19 | **ForgotPassword** | `pages/User/ForgotPassword/index` | 忘记密码 |
| 20 | **自定义 TabBar** | `custom-tab-bar` | 底部导航：首页/流水/报表/我的 |

---

## 二、功能逐一比对

### 2.1 ✅ 两端已对齐的功能

| 功能模块 | PC 端 | 小程序端 | 对齐状态 |
|----------|-------|----------|----------|
| 用户登录/注册/忘记密码 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 交易 CRUD（增删改查） | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 交易列表筛选/搜索/分页 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 交易详情弹窗 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 首页统计（结余/收入/支出） | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 预算进度展示 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 预算设置/复制 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 分类管理 CRUD | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 账本管理 CRUD | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 账本成员管理 | ✅ 完整（内嵌 Books） | ✅ 完整（独立页面） | ✅ 对齐 |
| 账本转让/退出 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 年度报表 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 日历视图（月度网格） | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 日历当日明细 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 地图消费位置展示 | ✅ 完整 | ✅ 基础版 | ⚠️ 部分对齐 |
| 模板管理（查看） | ✅ 完整 | ✅ 基础版 | ⚠️ 部分对齐 |
| 报表时间范围切换 | ✅ 6 种周期 | ✅ 6 种周期 | ✅ 对齐 |
| 报表月对比/年对比 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 报表分类饼图 | ✅ 完整（ECharts） | ✅ 完整（CSS 环形图） | ✅ 对齐 |
| 个人资料修改 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 修改密码 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 退出登录 | ✅ 完整 | ✅ 完整 | ✅ 对齐 |
| 切换账号 | ✅ 完整（switchAccount API） | ✅ 完整（独立弹窗+token 回退） | ✅ 对齐 |
| 导出 Excel | ✅ 完整 | ✅ 完整 | ✅ 对齐 |

### 2.2 ⚠️ PC 端有、小程序端缺失/弱化的功能

| # | 功能 | PC 端实现 | 小程序端状态 | 优先级 | 影响说明 |
|---|------|-----------|--------------|--------|----------|
| 1 | **管理后台（Admin）** | 3 个页面：统计/用户/交易 | ❌ 完全缺失 | P3 | 移动端一般不需要管理后台 |
| 2 | **批量操作交易** | `batchTransactions` API | ❌ 缺失 | P2 | 影响多选删除/批量编辑效率 |
| 3 | **收据图片上传/删除** | `uploadReceipt` / `deleteReceipt` | ❌ 缺失 | P1 | 交易无法添加图片凭证 |
| 4 | **分类排序** | `reorderCategories` API | ❌ 缺失 | P2 | 分类顺序无法调整 |
| 5 | **模板执行** | `executeTemplate` API | ❌ 缺失 | P2 | 模板只能看不能用 |
| 6 | **模板排序** | `reorderTemplates` API | ❌ 缺失 | P2 | 模板顺序无法调整 |
| 7 | **自定义图标管理** | `iconsApi.ts`：上传/删除 | ❌ 缺失 | P2 | 无法自定义分类/账本图标 |
| 8 | **地图成员筛选** | `fetchBookMembers` + `memberIds` 筛选 | ❌ 缺失 | P2 | 多人账本无法按成员查看地图 |
| 9 | **地图位置共享** | `fetchMemberLocations` / `updateMyLocation` | ❌ 缺失 | P3 | 无法共享实时位置 |
| 10 | **成员对比统计** | `fetchMemberComparison` API + 图表 | ❌ 缺失 | P2 | 多成员账本缺少成员消费对比 |
| 11 | **新用户引导（Onboarding）** | Onboarding 页面 | ❌ 缺失 | P3 | 新用户首次使用无引导 |
| 12 | **设置当前账本** | `setCurrentBook` API | ❌ 缺失 | P2 | 切换账本后需刷新才生效 |
| 13 | **导出 PDF** | `exportToPDF` API | ❌ 缺失 | P3 | 无法导出 PDF 格式 |
| 14 | **收入分类饼图** | Reports 同时展示收入+支出饼图 | ❌ 缺失（仅支出） | P2 | 无法查看收入分类占比 |
| 15 | **日历农历显示** | `lunar-javascript` 农历 + 节假日 | ❌ 缺失 | P3 | 日历无农历信息 |
| 16 | **交易图片上传** | AddTransaction 支持 `ImageUploader` | ❌ 缺失 | P1 | 记账时无法拍照/上传图片 |
| 17 | **交易品牌字段** | 表单有 `brand` 字段 | ⚠️ 未确认 | P2 | 品牌信息可能无法录入 |
| 18 | **查看范围切换（own/all）** | `view` 参数筛选 | ⚠️ 未确认 | P2 | 账本 Owner 无法查看全体成员流水 |

### 2.3 ✅ 小程序端有、PC 端没有/不同的功能

| # | 功能 | 小程序端 | PC 端 | 说明 |
|---|------|----------|-------|------|
| 1 | **快捷记账** | Home 页面 8 个快捷分类入口 | ❌ 无 | 小程序特有体验优化 |
| 2 | **FAB 浮动按钮** | 首页右下角 + 按钮 | ❌ 无 | 小程序移动端交互习惯 |
| 3 | **自定义 TabBar** | 底部导航栏 | ❌ 无（Sidebar 导航） | 小程序框架特有 |
| 4 | **独立编辑资料页** | EditProfile 独立页面 | 内嵌 Profile 页面 | 结构差异，功能等效 |
| 5 | **独立账本成员页** | BookMembers 独立页面 | 内嵌 Books 页面 | 结构差异，功能等效 |
| 6 | **独立账本设置页** | BookSettings 独立页面 | 内嵌 Books 页面 | 结构差异，功能等效 |
| 7 | **微信原生地图** | `Taro.openLocation` 调用 | 高德地图 SDK 嵌入 | 实现方式不同，等效 |
| 8 | **图片预览** | `Taro.previewImage` | 自定义实现 | 功能等效 |
| 9 | **下拉刷新** | PageLayout 统一封装 | 无（自动刷新） | 小程序特有交互 |
| 10 | **上拉加载更多** | PageLayout 统一封装 | Pagination 组件 | 实现方式不同，等效 |

---

## 三、API 服务层对比

### 3.1 PC 端服务（11 个文件）

| 文件 | 接口数量 | 功能覆盖 |
|------|----------|----------|
| `api.ts` | 20+ | 核心：交易 CRUD、导出 Excel/PDF、批量操作、收据管理、认证、个人资料、切换账号、设置当前账本 |
| `statisticsApi.ts` | 6 | 统计概览、月度趋势、分类占比、每日汇总、年度对比、**成员对比** |
| `booksApi.ts` | 9 | 账本 CRUD、成员管理、邀请、退出、转让、邀请码 |
| `budgetsApi.ts` | 4 | 预算获取、状态、批量保存、复制 |
| `categoriesApi.ts` | 5 | 分类 CRUD、**排序** |
| `templatesApi.ts` | 6 | 模板 CRUD、**执行**、**排序** |
| `mapApi.ts` | 6 | 地图交易、商户汇总、商户历史、**成员列表**、**成员位置**、**位置更新** |
| `reportsApi.ts` | 1 | 年度报告 |
| `iconsApi.ts` | 3 | 自定义图标获取、**上传**、**删除** |
| `adminApi.ts` | 7 | 平台统计、用户列表/详情、角色/状态修改、交易列表、账本列表 |
| `amapManager.ts` | - | 高德地图 SDK 管理（单例+池化） |

### 3.2 小程序端服务（10 个文件）

| 文件 | 接口数量 | 功能覆盖 |
|------|----------|----------|
| `api.ts` | 5 | 核心 HTTP 封装（Taro.request）、token/账本 ID 管理 |
| `transactionsApi.ts` | 5 | 交易 CRUD |
| `statisticsApi.ts` | 6 | 统计概览、月度趋势、每日汇总、分类占比、年度对比、**预算状态**、**年度报告** |
| `booksApi.ts` | 8 | 账本 CRUD、成员、邀请、退出、移除、转让、**检查所有者** |
| `budgetsApi.ts` | 4 | 预算获取、状态、批量保存、复制 |
| `categoriesApi.ts` | 4 | 分类 CRUD（**无排序**） |
| `templatesApi.ts` | 2 | 模板获取列表、**获取单个**（**无执行/排序**） |
| `annualReportApi.ts` | 1 | 年度报告（**独立文件**） |
| `authApi.ts` | 9 | 验证码、登录、注册、个人资料、修改密码、退出、重置密码 |
| - | - | ❌ **缺失**：导出、批量操作、收据管理、图标管理、地图成员相关、成员对比 |

---

## 四、缺失功能清单（按优先级排序）

### 🔴 P1 — 必须补齐（影响核心功能）

| # | 功能 | 涉及页面 | 涉及 API | 工作量 |
|---|------|----------|----------|--------|
| 1 | **交易图片上传/预览** | AddTransaction、Transactions | `uploadReceipt` / 图片上传 | 中 |
| 2 | **收据管理** | AddTransaction、Transaction Detail | `uploadReceipt` / `deleteReceipt` | 中 |

### 🟡 P2 — 建议补齐（影响体验完整性）

| # | 功能 | 涉及页面 | 涉及 API | 工作量 |
|---|------|----------|----------|--------|
| 3 | **模板执行** | TemplateManager | `executeTemplate` | 小 |
| 4 | **分类排序** | Categories | `reorderCategories` | 小 |
| 5 | **模板排序** | TemplateManager | `reorderTemplates` | 小 |
| 6 | **自定义图标上传** | Categories、Books | `uploadIcon` / `fetchCustomIcons` / `deleteIcon` | 中 |
| 7 | **成员对比统计** | Statistics | `fetchMemberComparison` | 中 |
| 8 | **地图成员筛选** | Map | `fetchBookMembers` + `memberIds` 筛选 | 中 |
| 9 | **收入分类饼图** | Statistics | `fetchCategoryBreakdown(type='income')` | 小 |
| 10 | **设置当前账本** | Books | `setCurrentBook` | 小 |
| 11 | **批量操作交易** | Transactions | `batchTransactions` | 中 |
| 12 | **查看范围切换（own/all）** | Transactions | `view` 参数 | 小 |
| 13 | **交易品牌字段** | AddTransaction、Transactions | `brand` 字段 | 小 |

### 🟢 P3 — 可选补齐（锦上添花）

| # | 功能 | 涉及页面 | 涉及 API | 工作量 |
|---|------|----------|----------|--------|
| 14 | **导出 PDF** | Statistics / Transactions | `exportToPDF` | 中 |
| 15 | **日历农历显示** | Calendar | `lunar-javascript` | 小 |
| 16 | **地图位置共享** | Map | `fetchMemberLocations` / `updateMyLocation` | 大 |
| 17 | **新用户引导** | 独立页面 | Onboarding 流程 | 中 |
| 18 | **管理后台** | 无需 | 无需 | - |

---

## 五、接口调用差异明细

### 5.1 已对齐的接口

以下接口两端均已实现，可直接复用：

- `GET /transactions` — 交易列表
- `GET /transactions/:id` — 交易详情
- `POST /transactions` — 创建交易
- `PUT /transactions/:id` — 更新交易
- `DELETE /transactions/:id` — 删除交易
- `GET /statistics/summary` — 统计概览
- `GET /statistics/monthly-trend` — 月度趋势
- `GET /statistics/category-breakdown` — 分类占比
- `GET /statistics/daily-summary` — 每日汇总
- `GET /statistics/yoy-comparison` — 年度对比
- `GET /statistics/budget-status` — 预算状态
- `GET /budgets` — 预算列表
- `GET /budgets/status` — 预算执行状态
- `PUT /budgets` — 批量保存预算
- `POST /budgets/copy` — 复制预算
- `GET /categories` — 分类列表
- `POST /categories` — 创建分类
- `PUT /categories/:id` — 更新分类
- `DELETE /categories/:id` — 删除分类
- `GET /books` — 账本列表
- `POST /books` — 创建账本
- `PUT /books/:id` — 更新账本
- `DELETE /books/:id` — 删除账本
- `GET /books/:id/members` — 账本成员
- `POST /books/:id/members` — 邀请成员
- `DELETE /books/:id/members/me` — 退出账本
- `DELETE /books/:id/members/:userId` — 移除成员
- `PUT /books/:id/transfer-owner` — 转让所有权
- `POST /books/:id/invitations` — 生成邀请码
- `GET /books/invitations/:code` — 查询邀请码
- `POST /books/invitations/:code/join` — 加入账本
- `GET /templates` — 模板列表
- `GET /templates/:id` — 模板详情
- `GET /reports/annual` — 年度报告
- `GET /auth/captcha` — 验证码
- `POST /auth/login` — 登录
- `POST /auth/register` — 注册
- `GET /auth/profile` — 个人资料
- `POST /auth/profile` — 更新资料
- `POST /auth/change-password` — 修改密码
- `POST /auth/logout` — 退出登录
- `POST /auth/send-reset-code` — 发送重置码
- `POST /auth/reset-password-by-code` — 重置密码
- `GET /export/excel` — 导出 Excel

### 5.2 小程序端缺失的接口封装

以下接口后端已支持，但小程序端 `services/` 未封装：

| 接口 | 方法 | 用途 | 优先级 |
|------|------|------|--------|
| `POST /transactions/batch` | POST | 批量操作交易 | P2 |
| `POST /transactions/:id/receipt` | POST | 上传收据图片 | P1 |
| `DELETE /transactions/:id/receipt` | DELETE | 删除收据图片 | P1 |
| `PATCH /categories/reorder` | PATCH | 分类排序 | P2 |
| `POST /templates/:id/execute` | POST | 执行模板 | P2 |
| `PUT /templates/reorder` | PUT | 模板排序 | P2 |
| `GET /icons` | GET | 获取自定义图标 | P2 |
| `POST /icons/upload` | POST | 上传图标 | P2 |
| `DELETE /icons/:id` | DELETE | 删除图标 | P2 |
| `GET /map/members` | GET | 地图成员列表 | P2 |
| `GET /map/members/locations` | GET | 成员位置 | P3 |
| `POST /map/location` | POST | 上报位置 | P3 |
| `GET /statistics/member-comparison` | GET | 成员对比统计 | P2 |
| `PUT /auth/current-book` | PUT | 设置当前账本 | P2 |
| `GET /export/pdf` | GET | 导出 PDF | P3 |

---

## 六、建议实施计划

### 阶段一：P1 核心补齐（1-2 天）

1. **AddTransaction 页面**
   - 添加图片上传组件（复用 PC 的 `ImageUploader` 逻辑，适配小程序 `chooseImage`）
   - 接入 `POST /transactions/:id/receipt` 接口
   - 支持图片预览和删除

2. **Transactions 页面**
   - 交易详情弹窗中展示图片列表
   - 接入 `Taro.previewImage` 预览

### 阶段二：P2 体验完善（2-3 天）

1. **Categories 页面**
   - 添加拖拽排序功能
   - 接入 `PATCH /categories/reorder`

2. **TemplateManager 页面**
   - 添加模板执行按钮
   - 接入 `POST /templates/:id/execute`
   - 添加排序功能

3. **Statistics 页面**
   - 添加收入分类饼图
   - 添加成员对比 Tab（多成员账本时显示）

4. **Books / BookMembers 页面**
   - 添加设置当前账本功能
   - 添加查看范围切换（own/all）

5. **Map 页面**
   - 添加成员筛选下拉框
   - 接入 `GET /map/members`

6. **services/ 补全**
   - 创建 `iconsApi.ts`
   - 在 `transactionsApi.ts` 中添加收据相关方法
   - 在 `statisticsApi.ts` 中添加 `fetchMemberComparison`
   - 在 `templatesApi.ts` 中添加 `executeTemplate` / `reorderTemplates`
   - 在 `booksApi.ts` 中添加 `getInvitation` / `joinByInvitation`（当前已有部分）
   - 在 `api.ts` 或 `authApi.ts` 中添加 `setCurrentBook`

### 阶段三：P3 优化增强（可选）

1. Calendar 添加农历显示
2. 导出 PDF 功能
3. 新用户引导流程
4. 地图位置共享（涉及 WebSocket/轮询，工作量较大）

---

## 七、总结

| 指标 | 数值 |
|------|------|
| PC 端总页面 | 19 个 |
| 小程序端总页面 | 20 个 |
| 已对齐功能 | 24 项 |
| PC 独有（建议补齐） | 13 项（P1: 2 / P2: 11 / P3: 5） |
| 小程序独有（体验优化） | 10 项（均为移动端体验增强） |
| 接口覆盖率 | 约 75%（小程序端缺少约 15 个接口封装） |

**整体评价**：小程序端已实现了 PC 端约 **75%** 的核心功能，主要缺失集中在**图片上传/收据管理**、**排序功能**、**模板执行**、**成员相关功能**和**图标管理**等方面。建议按 P1 → P2 → P3 优先级分阶段补齐，预计可在 **3-5 天**内完成全部 P1+P2 功能的对齐。

---

*报告生成时间：2025-06-17*  
*对比文件：frontend/src/ vs taro/src/*
