# TASKS.md — 待优化任务清单

> 生成日期：2026-06-30
> 来源：代码审查 + 深度分析
> 状态说明：✅ 已修复 / 🔄 进行中 / ⏳ 待处理

---

## 一、Critical（严重）

### T-C1: Taro 端密码明文存储在设备本地存储
- **严重程度**: Critical
- **文件**: `taro/src/utils/savedAccounts.ts:10,155`
- **问题**: 用户密码使用 Base64 编码存储在 `Taro.setStorageSync` 中。Base64 是编码不是加密，可逆且极易破解。
- **影响**: 设备存储被访问时（root/jailbreak/备份提取），用户密码直接暴露。
- **修复建议**: 移除 `SavedAccount` 接口中的 `password` 字段，迁移到 token-only 存储（前端版本已实现）。
- **状态**: ⏳ 待处理

---

## 二、High（高优先级）

### T-H1: 分类排序 N+1 查询
- **严重程度**: High
- **文件**: `backend/src/categories/categories.service.ts:186-194`
- **问题**: `reorder()` 对每个分类项发起一个 Supabase HTTP 请求，通过 `Promise.all` 并发。50+ 分类 = 50+ 并发请求。
- **影响**: 触发 Supabase 速率限制，延迟线性增长。
- **修复建议**: 使用单次批量更新查询或 Supabase RPC。
- **状态**: ⏳ 待处理

### T-H2: 管理员统计加载全部月度交易到内存
- **严重程度**: High
- **文件**: `backend/src/admin/admin.service.ts:46-56`
- **问题**: `getPlatformStats()` 一次性 `select('amount, type')` 拉取整月所有交易，在 JS 中聚合。
- **影响**: 用户增长后服务器内存和带宽线性膨胀，可能 OOM。
- **修复建议**: 使用 Supabase RPC 或 PostgREST 在数据库侧计算 SUM。
- **状态**: ⏳ 待处理

### T-H3: Taro 使用 switchTab 导航非 Tab 页面
- **严重程度**: High
- **文件**: `taro/src/pages/Home/index.tsx:156`
- **问题**: `Taro.switchTab({ url: "/pages/Transactions/index" })` 仅适用于 tabBar 页面。如果 Transactions 不在 `tabList` 中，会静默失败或崩溃。
- **影响**: 导航断裂或页面状态重置。
- **修复建议**: 确认 Transactions 在 `app.config.ts` 的 `tabList` 中；如果不是，改用 `Taro.redirectTo` 或 `Taro.navigateBack`。
- **状态**: ⏳ 待处理

---

## 三、Medium（中优先级）

### T-M1: 账本详情/成员列表接口缺少权限校验
- **严重程度**: Medium
- **文件**: `backend/src/books/books.controller.ts:34-41, 85-89`
- **问题**: `GET /books/:id` 和 `GET /books/:id/members` 仅有 `TokenAuthGuard`（认证），未验证请求者是否是该账本成员。
- **影响**: 任何登录用户可通过 UUID 枚举获取任意账本详情和成员列表（含 email/username）。
- **修复建议**: 在 Controller 或 Service 层增加账本成员校验。
- **状态**: ⏳ 待处理

### T-M2: 管理员接口缺少限流
- **严重程度**: Medium
- **文件**: `backend/src/admin/admin.controller.ts:33-134`
- **问题**: 管理员接口（stats/users/transactions/books）没有 `RateLimitGuard`，而认证接口使用 `(60_000, 10)`。
- **影响**: 管理员接口是枚举攻击目标，无防护可被暴力爬取。
- **修复建议**: 为所有管理员接口添加 `@UseGuards(new RateLimitGuard(60_000, 5))`。
- **状态**: ⏳ 待处理

### T-M3: 账本列表拉取全部交易行计算计数
- **严重程度**: Medium
- **文件**: `backend/src/books/books.service.ts:119-132`
- **问题**: 拉取所有交易行（`select('book_id')`）只为计数。10,000 条交易传输 10,000 行网络。
- **影响**: 浪费带宽和内存。
- **修复建议**: 使用 `select('book_id').group('book_id')` 本地计数，或用 Supabase RPC 聚合。
- **状态**: ⏳ 待处理

### T-M4: ResponseInterceptor 深拷贝所有响应数据
- **严重程度**: Medium
- **文件**: `backend/src/common/response.interceptor.ts:71-84`
- **问题**: `convertTimeFields()` 递归遍历整个响应树创建深拷贝。5000 条交易的大 payload 临时翻倍内存。
- **影响**: 每个 API 响应增加 O(n) 处理时间和内存开销。
- **修复建议**: 只对已知顶层字段应用时间转换，或对大 payload 跳过。
- **状态**: ⏳ 待处理

### T-M5: Dashboard 三次独立 API 调用无 staleTime
- **严重程度**: Medium
- **文件**: `frontend/src/pages/Dashboard/index.tsx:34-50`
- **问题**: summary/recent transactions/budget status 三个 `useQuery` 无 `staleTime`，依次发出独立 API 请求。
- **影响**: Dashboard 是最常访问页面，串行请求增加感知加载时间。
- **修复建议**: 为所有查询添加 `staleTime`；考虑将相关数据合并到单次查询。
- **状态**: ⏳ 待处理

### T-M6: 交易表格行使用 role="button" 而非语义元素
- **严重程度**: Medium
- **文件**: `frontend/src/pages/Transactions/index.tsx:250-263`
- **问题**: 表格行使用 `role="button"` + `onClick`，屏幕阅读器可能不一致地播报为可交互元素。
- **影响**: 辅助技术用户可能无法发现可点击的交易行。
- **修复建议**: 用 `<button>` 包裹可点击内容，或添加 `aria-role="link"` + `aria-label`。
- **状态**: ⏳ 待处理

### T-M7: SPA 快速导航时 blob URL 可能泄漏
- **严重程度**: Medium
- **文件**: `frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts:90-103`
- **问题**: cleanup effect 依赖数组为空，AddTransaction 和 Transactions 页面间快速往返可能未触发 cleanup 就重新挂载。
- **影响**: 长会话中累积的 blob URL 消耗内存。
- **修复建议**: 添加路由变更监听器清理 blob URL，或 `useEffect` 依赖 `useNavigate`。
- **状态**: ⏳ 待处理

### T-M8: Taro 请求超时过短
- **严重程度**: Medium
- **文件**: `taro/src/services/api.ts:108`
- **问题**: `timeout: 15000`（15s）对所有请求统一。前端使用 30s 读/60s 写。小程序环境网络通常更慢。
- **影响**: 典型移动网络上提前超时失败。
- **修复建议**: 按请求类型区分超时（GET=30s, POST=60s）。
- **状态**: ⏳ 待处理

### T-M9: Taro useManualQuery 静默吞掉错误
- **严重程度**: Medium
- **文件**: `taro/src/hooks/useManualQuery.ts:70-72`
- **问题**: `fetch` 使用空 `.catch(() => {})` 捕获错误。调用方无法区分"无数据"和"加载失败"。
- **影响**: 用户看到空状态，无错误反馈或重试能力。
- **修复建议**: 在返回值中暴露 `error` 字段，或提供 `onError` 回调。
- **状态**: ⏳ 待处理

### T-M10: Taro Transactions 页面用 setTimeout 触发数据获取
- **严重程度**: Medium
- **文件**: `taro/src/pages/Transactions/index.tsx:151,157`
- **问题**: `handleCategoryChange` 和 `handleFilterChange` 用 `setTimeout(..., 0)` 触发 fetch。无请求取消机制。
- **影响**: 快速筛选变化堆积多个飞行中请求，无取消。
- **修复建议**: 使用 AbortController 取消前序请求，或防抖筛选变化。
- **状态**: ⏳ 待处理

### T-M11: Taro 在主线程同步调用存储 API
- **严重程度**: Medium
- **文件**: `taro/src/services/api.ts:29-47`
- **问题**: 每次 API 请求同步调用 `Taro.getStorageSync` 和 `Taro.setStorageSync`（读取 token + bookId）。微信小程序主线程也是 UI 线程。
- **影响**: 频繁存储 I/O 导致 UI 卡顿。
- **修复建议**: 将 token 和 bookId 缓存在内存变量中，仅在变化时同步到存储。
- **状态**: ⏳ 待处理

---

## 四、Low（低优先级）

### T-L1: 导出分类缓存未在变更后失效
- **严重程度**: Low
- **文件**: `backend/src/export/export.service.ts:21-23`
- **问题**: `categoryCache` 5 分钟 TTL，但分类增删改时不主动失效。
- **影响**: 导出可能显示过时或"未知"分类名长达 5 分钟。
- **修复建议**: 在分类变更时通过事件发射器失效缓存，或缩短 TTL。
- **状态**: ⏳ 待处理

### T-L2: 统计余额变更百分比使用 Math.abs 语义混乱
- **严重程度**: Low
- **文件**: `backend/src/statistics/statistics.service.ts:228-231`
- **问题**: `Math.abs(prevBalance)` 在 prevBalance 为负时改变百分比方向语义。
- **影响**: 负余额账户显示错误的百分比变化。
- **修复建议**: 文档化预期行为，或使用一致的绝对值比较。
- **状态**: ⏳ 待处理

### T-L3: handleTemplateConfirm 使用 any 类型
- **严重程度**: Low
- **文件**: `frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts:271`
- **问题**: `handleTemplateConfirm(template: any)` 绕过类型安全。
- **影响**: 编译时类型检查被绕过，可能产生静默 bug。
- **修复建议**: 从 `../../types/template.ts` 导入并使用正确的 `Template` 类型。
- **状态**: ⏳ 待处理

### T-L4: Reports 页面冗余 useMemo 链
- **严重程度**: Low
- **文件**: `frontend/src/pages/Reports/index.tsx:40-60`
- **问题**: 多个 `useMemo` 依赖 react-query 数据（变化频率低），但依赖链在任何上游值变化时触发不必要重计算。
- **影响**: 有大量派生值的页面轻微性能损耗。
- **修复建议**: 将派生计算提升到 `useReportData` 自定义 hook 中集中管理 memoization。
- **状态**: ⏳ 待处理

### T-L5: Taro Home 页面 Promise.all 丢弃部分结果
- **严重程度**: Low
- **文件**: `taro/src/pages/Home/index.tsx:52-68`
- **问题**: `Promise.all` 获取 summary/transactions/budget。如果 budget API 失败，summary 和 transactions 数据也被丢弃。
- **影响**: 瞬态 API 故障导致部分数据丢失。
- **修复建议**: 改用 `Promise.allSettled` 收集所有结果，忽略失败的请求。
- **状态**: ⏳ 待处理

### T-L6: Taro 和前端 API 层实现分化
- **严重程度**: Low
- **文件**: `taro/src/services/` vs `frontend/src/services/`
- **问题**: 并行但独立实现的 API 客户端，不同的超时策略、错误处理和响应解析。API 契约变更需手动同步。
- **影响**: 一端 API 更新后另一端可能静默失效。
- **修复建议**: 从共享 OpenAPI/Swagger 规范生成 API 客户端类型，或维护单一合同文件。
- **状态**: ⏳ 待处理

### T-L7: Taro Home 页面每次渲染创建 new Date()
- **严重程度**: Low
- **文件**: `taro/src/pages/Home/index.tsx:47-51`
- **问题**: `new Date()` 在 `loadData` 中调用，如果 `loadData` 在 `useEffect` 依赖数组中，每次渲染创建新闭包。
- **影响**: 不必要地重新执行 effect，可能产生陈旧闭包。
- **修复建议**: 将日期计算移出 `loadData`，或使用 `useMemo` 缓存日期范围值。
- **状态**: ⏳ 待处理

---

## 五、任务优先级排序

| 优先级 | 任务 | 预计工作量 |
|--------|------|-----------|
| P0 | T-C1: Taro 密码明文存储 | 30 分钟 |
| P1 | T-H1: 分类排序 N+1 查询 | 1 小时 |
| P1 | T-H2: 管理员统计内存问题 | 1 小时 |
| P1 | T-H3: Taro switchTab 导航 | 15 分钟 |
| P2 | T-M1: 账本接口权限校验 | 1 小时 |
| P2 | T-M2: 管理员接口限流 | 30 分钟 |
| P2 | T-M3: 账本列表交易计数优化 | 30 分钟 |
| P2 | T-M4: ResponseInterceptor 深拷贝 | 30 分钟 |
| P2 | T-M5: Dashboard staleTime | 15 分钟 |
| P2 | T-M6: 交易表格可访问性 | 30 分钟 |
| P2 | T-M7: blob URL 泄漏 | 30 分钟 |
| P2 | T-M8: Taro 请求超时 | 15 分钟 |
| P2 | T-M9: useManualQuery 错误处理 | 30 分钟 |
| P2 | T-M10: Taro Transactions 请求取消 | 1 小时 |
| P2 | T-M11: Taro 同步存储缓存 | 30 分钟 |
| P3 | T-L1 ~ T-L7: 低优先级优化 | 各 15-30 分钟 |
