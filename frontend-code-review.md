# 静记 frontend 代码审查报告

> 审查日期：基于当前代码快照
> 审查范围：frontend/src 核心文件及 package.json
> 审查维度：性能、架构、代码质量、可维护性、安全、React 最佳实践、TypeScript 类型安全、CSS/样式优化、可访问性

---

## 一、严重问题（Critical）

### 1. `useDebouncedAction` 的 `isRunning` 永远为 `false`，按钮防重完全失效

**文件路径**：`frontend/src/hooks/useDebouncedAction.ts`（第 46 行）

**问题描述**：
```ts
const isRunning = useMemo(() => isRunningRef.current, [])
```
`useMemo` 的依赖数组为空，意味着 `isRunning` 只在组件挂载时计算一次。由于 `isRunningRef.current` 初始值为 `false`，`isRunning` 永远返回 `false`，不会触发任何重渲染。

这导致所有使用 `useDebouncedAction` 的地方，`isRunning`（即 `loading`/`submitting`/`logoutLoading` 等）永远为 `false`：
- `Login.tsx` 的登录按钮 `disabled={loading}` 永远不会生效，用户可疯狂重复点击提交
- `Sidebar.tsx` 的退出按钮 "退出中..." 永远不会显示
- `Transactions.tsx` 的删除确认按钮 `loading` 状态无效

**建议修复**：
使用 `useState` 替代 `useRef` 来管理运行状态，或者至少使用 `useState` 来触发重渲染：
```ts
export function useDebouncedAction<T extends any[], R>(fn: (...args: T) => Promise<R> | R) {
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(
    async (...args: T): Promise<R | undefined> => {
      if (isRunning) return undefined;
      setIsRunning(true);
      try {
        const result = await fn(...args);
        return result;
      } finally {
        setIsRunning(false);
      }
    },
    [fn, isRunning],
  );

  return { run, isRunning };
}
```

---

### 2. `auth.tsx` 的 `switchByToken` 使用 `queryClient.clear()` 触发竞态，与项目文档冲突

**文件路径**：`frontend/src/utils/auth.tsx`（第 84 行）

**问题描述**：
`AGENTS.md` 明确警告："切换账号时必须用 `queryClient.removeQueries()` 而非 `queryClient.clear()`，否则 `clear()` 会触发 profile 自动重取与 `setQueryData` 产生竞态。"

但代码中仍使用了 `queryClient.clear()`：
```ts
queryClient.clear();  // ❌ 触发竞态
queryClient.setQueryData(['auth', 'profile'], profile);
await refetch();
```

`clear()` 会清除所有缓存并触发 `stale` 状态的查询重新获取，与紧接着的 `setQueryData` 和 `refetch` 产生不可预期的竞态。

**建议修复**：
```ts
// 使用 removeQueries 替代 clear，并指定精确的 queryKey
queryClient.removeQueries({ queryKey: ['books'] });
queryClient.removeQueries({ queryKey: ['transactions'] });
queryClient.removeQueries({ queryKey: ['statistics'] });
queryClient.removeQueries({ queryKey: ['budgets'] });
queryClient.setQueryData(['auth', 'profile'], profile);
await refetch();
```

---

### 3. `auth.tsx` 的 `queryClient.removeQueries()` 无参数调用在 TanStack Query v5 中不合法

**文件路径**：`frontend/src/utils/auth.tsx`（第 99 行）

**问题描述**：
```ts
queryClient.removeQueries();  // ❌ v5 中无此签名
```
TanStack Query v5 的 `removeQueries` 必须接受 `RemoveQueriesOptions` 参数，无参数调用会导致类型错误甚至运行时异常。

**建议修复**：
```ts
queryClient.removeQueries({ queryKey: ['auth', 'profile'] });
queryClient.removeQueries({ queryKey: ['books'] });
// 或更精确地移除所有查询
queryClient.removeQueries({ predicate: () => true });
```

---

### 4. `auth.tsx` 的 profile query 捕获所有错误后清除 token，网络波动导致用户被强制登出

**文件路径**：`frontend/src/utils/auth.tsx`（第 49-53 行）

**问题描述**：
```ts
queryFn: async () => {
  try {
    const profile = await getProfile();
    // ...
  } catch (error) {
    clearStoredToken();  // ❌ 网络 503/504 错误也会清 token
    return null;
  }
}
```

`catch` 块捕获了所有错误（包括后端 503 服务不可用、网络超时等），一律清除 token 并返回 `null`。这意味着任何网络波动都会导致用户被强制登出，体验极差。

**建议修复**：
```ts
queryFn: async () => {
  try {
    const profile = await getProfile();
    if (profile?.email) {
      updateAccountInfo(profile.email, { ... });
    }
    return profile;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      clearStoredToken(); // 仅 401 时清除 token
    }
    // 其他错误（503/504/网络错误）应抛出，让 React Query 的 error 状态处理
    throw error;
  }
}
```

同时需要调整 `useQuery` 的 `retry` 策略：对 401 不 retry，对网络错误 retry 2-3 次。

---

### 5. `Login.tsx` 的 `dangerouslySetInnerHTML` 渲染后端 SVG，存在 XSS 风险

**文件路径**：`frontend/src/pages/User/Login/index.tsx`（第 103-108 行）

**问题描述**：
```tsx
<div
  className="captcha-img"
  onClick={refreshCaptcha}
  dangerouslySetInnerHTML={{ __html: captchaSvg }}
/>
```

`captchaSvg` 来自后端 API，如果后端被攻破或存在漏洞，可能返回包含 `<script>` 或其他恶意标签的 HTML。`dangerouslySetInnerHTML` 直接将其插入 DOM，构成 XSS 攻击面。

**建议修复**：
使用 `DOMPurify` 清理 SVG 内容，或更安全的方案是将 SVG 作为 Data URL 渲染：
```tsx
// 方案 A：DOMPurify 清理
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(captchaSvg) }} />

// 方案 B：Data URL（更安全）
<img src={`data:image/svg+xml;base64,${btoa(captchaSvg)}`} alt="验证码" />
```

---

### 6. `useTransactionForm.ts` 的 `parseReceiptOCR` 中 worker 和 blob URL 在异常时泄漏

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 300-453 行）

**问题描述**：
```ts
try {
  const worker = await createWorker('chi_sim+eng');
  const imageUrl = URL.createObjectURL(blob);
  const ret = await worker.recognize(imageUrl);  // 如果失败...
  await worker.terminate();  // ...不会执行
  URL.revokeObjectURL(imageUrl);  // ...不会执行
} catch (err) {
  console.error('OCR error:', err);
  return null;
}
```

如果 `worker.recognize` 失败，跳转到 `catch` 块，`worker.terminate()` 和 `URL.revokeObjectURL` 都不会执行，导致：
1. Tesseract worker 线程泄漏
2. Blob URL 内存泄漏

**建议修复**：
```ts
try {
  const worker = await createWorker('chi_sim+eng');
  const imageUrl = URL.createObjectURL(blob);
  try {
    const ret = await worker.recognize(imageUrl);
    // ... 解析逻辑 ...
    return { amount, type, category, note, date };
  } finally {
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);
  }
} catch (err) {
  console.error('OCR error:', err);
  return null;
}
```

---

### 7. `useTransactionForm.ts` 的 `handleFileSelect` 中 `compressImage` 失败后已创建的 blob URL 泄漏

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 242-298 行）

**问题描述**：
```ts
try {
  const newPending: PendingImage[] = [];
  for (const file of toProcess) {
    const compressed = await compressImage(file, 1200, 0.7);  // 如果第2个文件失败...
    const localUrl = URL.createObjectURL(compressed);  // 第1个文件的 URL 已创建
    newPending.push({ localUrl, blob: compressed });
  }
  setPendingImages((prev) => [...prev, ...newPending]);  // ...不会执行
} catch {
  notify({ type: 'error', message: '图片处理失败' });
}
```

如果 `compressImage` 在循环中失败，之前已创建成功的 `blob:` URL 不会被 `setPendingImages` 记录，也不会被释放，导致内存泄漏。

**建议修复**：
将 `setPendingImages` 移到循环内部（逐张添加），或使用 `try-finally` 确保已创建的 URL 在失败时被释放：
```ts
const newPending: PendingImage[] = [];
try {
  for (const file of toProcess) {
    const compressed = await compressImage(file, 1200, 0.7);
    const localUrl = URL.createObjectURL(compressed);
    newPending.push({ localUrl, blob: compressed });
  }
} catch {
  // 释放已创建的 URL
  newPending.forEach((p) => URL.revokeObjectURL(p.localUrl));
  notify({ type: 'error', message: '图片处理失败' });
  return;
}
setPendingImages((prev) => [...prev, ...newPending]);
```

---

### 8. `useTransactionForm.ts` 的金额验证可绕过非数字字符串（如 `"abc"`）

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 160-161 行、第 118 行）

**问题描述**：
```ts
if (!formData.amount || parseFloat(formData.amount) <= 0) {
  notify({ type: 'error', message: '请输入有效金额' });
  return;
}
// ...
amount: parseFloat(formData.amount),
```

`parseFloat("abc")` 返回 `NaN`，而 `NaN <= 0` 为 `false`，所以非数字字符串（如 `"abc"`）会绕过验证。随后 `parseFloat("abc")` 作为 `NaN` 提交给后端，可能导致数据库保存异常值。

**建议修复**：
```ts
const amountNum = parseFloat(formData.amount);
if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
  notify({ type: 'error', message: '请输入有效金额' });
  return;
}
// ...
amount: amountNum,
```

---

### 9. `useTransactionForm.ts` 的 `isEditMode` 对无效 `editId` 处理不当

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 39-40 行、第 61-65 行）

**问题描述**：
```ts
const editId = searchParams.get('edit');
const isEditMode = !!editId;  // "abc" -> true

const { data: editData, isLoading: editLoading } = useQuery({
  queryKey: ['transaction', editId],
  queryFn: () => getTransaction(Number(editId)),  // Number("abc") -> NaN
  enabled: isEditMode,
});
```

如果 URL 是 `/add?edit=abc`，`isEditMode` 为 `true`，`getTransaction(NaN)` 会发送请求到 `/transactions/NaN`，导致 API 错误。

**建议修复**：
```ts
const editId = searchParams.get('edit');
const editIdNum = editId ? Number(editId) : NaN;
const isEditMode = !isNaN(editIdNum) && editIdNum > 0;
```

---

## 二、高优先级问题（High）

### 10. `useTransactionForm.ts` 中 Tesseract worker 每次调用都创建和销毁，性能极差

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 304 行）

**问题描述**：
`createWorker('chi_sim+eng')` 是昂贵操作，每次选择文件都创建新 worker 并立即销毁。OCR 语言包每次也需要重新加载。

**建议修复**：
在组件级别缓存 worker，或使用 `useRef` 保存 worker 实例：
```ts
const workerRef = useRef<Tesseract.Worker | null>(null);

useEffect(() => {
  createWorker('chi_sim+eng').then((w) => { workerRef.current = w; });
  return () => { workerRef.current?.terminate(); };
}, []);
```

---

### 11. `useTransactionForm.ts` 的 `pendingImages` blob URL 在组件卸载时未清理，内存泄漏

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 56 行、第 242-298 行）

**问题描述**：
`pendingImages` 中存储的 `localUrl` 是 `blob:` URL，通过 `URL.createObjectURL` 创建。如果用户上传图片后没有提交（直接关闭页面或导航离开），这些 blob URL 不会被释放。在 SPA 中页面不会卸载，导致内存泄漏。

**建议修复**：
在 `useTransactionForm` 中添加 `useEffect` 清理：
```ts
useEffect(() => {
  return () => {
    pendingImages.forEach((p) => {
      if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl);
    });
  };
}, []); // 仅卸载时执行
```

---

### 12. `useTransactionForm.ts` 从编辑模式切换到新建模式时表单数据不重置

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 39-40 行、第 71-91 行）

**问题描述**：
当用户从 `/add?edit=123` 导航到 `/add`（无 `edit` 参数）时，`isEditMode` 变为 `false`，`editId` 变为 `null`。但 `editData` 的 query 被 `enabled: isEditMode` 控制，变为禁用后保持上一次值，`useEffect(() => { if (editData) { ... } }, [editData])` 不会触发。因此表单仍保留编辑时的数据，不会重置为新建状态。

**建议修复**：
```ts
useEffect(() => {
  if (!isEditMode) {
    handleReset(); // 重置为新建状态
  }
}, [isEditMode]);
```

---

### 13. `ErrorBoundary` 没有重置机制，children 变化后仍显示错误 UI

**文件路径**：`frontend/src/components/ErrorBoundary/index.tsx`（第 13-72 行）

**问题描述**：
如果 `children` props 变化（如路由切换），但 `hasError` 仍为 `true`，错误边界不会重新尝试渲染新的子组件。用户必须刷新页面才能恢复。

**建议修复**：
添加 `componentDidUpdate` 或 `getDerivedStateFromProps`：
```ts
componentDidUpdate(prevProps: Props) {
  if (prevProps.children !== this.props.children && this.state.hasError) {
    this.setState({ hasError: false, error: null });
  }
}
```

---

### 14. `ErrorBoundary` 的刷新按钮 `setState` 后 `window.location.reload()` 顺序无效

**文件路径**：`frontend/src/components/ErrorBoundary/index.tsx`（第 51-54 行）

**问题描述**：
```tsx
onClick={() => {
  this.setState({ hasError: false, error: null });
  window.location.reload();
}}
```

`setState` 后 `reload()` 会立即中断当前渲染，setState 的效果永远不会生效。`window.location.reload()` 过于粗暴，会丢失所有状态。

**建议修复**：
```tsx
onClick={() => {
  this.setState({ hasError: false, error: null });
  // 不需要 reload，setState 会触发重新渲染
}}
```

---

### 15. `App.tsx` 的 `PrivateRoute` 的 `loading` 返回 `null` 无加载指示器

**文件路径**：`frontend/src/App.tsx`（第 17-30 行）

**问题描述**：
```tsx
if (loading) {
  return null;  // 空白页面
}
```

认证状态加载时页面完全空白，没有骨架屏或加载动画，用户体验差。

**建议修复**：
```tsx
if (loading) {
  return <div className="page-loading"><Spinner /></div>;
}
```

---

### 16. `App.tsx` 的 `ErrorBoundary` 包裹整个应用，错误后无法导航

**文件路径**：`frontend/src/App.tsx`（第 120-123 行）

**问题描述**：
`ErrorBoundary` 包裹了 `AppLayout`，而 `Router` 在 `ErrorBoundary` 外部。如果子组件抛出错误，整个应用被 fallback 替换，用户无法点击导航恢复。

**建议修复**：
将 `ErrorBoundary` 移到每个路由级别，或至少包裹 `main` 内容区域：
```tsx
<main className="main">
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      <Routes>...</Routes>
    </Suspense>
  </ErrorBoundary>
</main>
```

---

### 17. 路由配置缺少 AdminGuard，普通用户可访问管理员页面

**文件路径**：`frontend/src/routes/routes.tsx`（第 41-43 行）、`frontend/src/App.tsx`

**问题描述**：
`/admin`、 `/admin/users`、 `/admin/transactions` 的 `isPrivate: true` 仅检查登录状态，不检查 `user.role === 'admin'`。普通用户可通过直接输入 URL 访问管理员页面（虽然后端 API 会拒绝，但前端页面仍会渲染）。

**建议修复**：
在 `App.tsx` 的 `PrivateRoute` 基础上添加 `AdminRoute`：
```tsx
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
```

---

### 18. `Dashboard` 的"本月结余"副标题使用了 `recentTransactions.length` 而非总笔数

**文件路径**：`frontend/src/pages/Dashboard/index.tsx`（第 84-88 行）

**问题描述**：
```tsx
<StatCard
  label="本月结余"
  value={formatAmount(summary?.balance || 0)}
  sub={`共 ${recentTransactions.length} 笔`}  // ❌ 最多只有 5 笔
/>
```

`recentTransactions` 是 `getTransactions({ pageSize: 5 })` 的结果，最多只有 5 条。这里显示的是"最近交易数"而非"本月总交易数"，数据含义错误。`summary` 接口中已有 `incomeCount` 和 `expenseCount`，应使用两者之和。

**建议修复**：
```tsx
sub={`共 ${(summary?.incomeCount || 0) + (summary?.expenseCount || 0)} 笔`}
```

---

### 19. `auth.tsx` 的 `signUp` 没有 `token.trim()`，与 `signIn` 不一致

**文件路径**：`frontend/src/utils/auth.tsx`（第 115 行）

**问题描述**：
```ts
storeToken(token);  // signUp 没有 trim
// vs
storeToken(token.trim());  // signIn 有 trim
```

如果注册时后端返回的 token 包含前后空格，会导致后续认证失败。

**建议修复**：
```ts
storeToken(token.trim());
```

---

### 20. `auth.tsx` 的 `resetUserCache` 使用 `queryClient.clear()` 过于粗暴

**文件路径**：`frontend/src/utils/auth.tsx`（第 33-35 行）

**问题描述**：
`queryClient.clear()` 清除所有缓存，包括不相关的数据（如主题设置、静态资源缓存等）。如果其他功能也使用 React Query 缓存非用户数据，会被误清除。

**建议修复**：
```ts
const resetUserCache = useCallback(() => {
  queryClient.removeQueries({ queryKey: ['books'] });
  queryClient.removeQueries({ queryKey: ['transactions'] });
  queryClient.removeQueries({ queryKey: ['statistics'] });
  queryClient.removeQueries({ queryKey: ['budgets'] });
  queryClient.removeQueries({ queryKey: ['categories'] });
  queryClient.removeQueries({ queryKey: ['templates'] });
}, [queryClient]);
```

---

## 三、中优先级问题（Medium）

### 21. `Transactions` 页面 `useCategories` 返回类型 `any`

**文件路径**：`frontend/src/pages/Transactions/index.tsx`（第 40 行）

**问题描述**：
```ts
const { data: allCategories = [] }: any = useCategories()
```
`any` 完全绕过类型检查，后续 `allCategories.filter(...)` 和 `allCategories.find(...)` 没有任何类型安全。

**建议修复**：
```ts
const { data: allCategories = [] } = useCategories();
// 或如果需兼容：
const { data: allCategories = [] } = useCategories() as { data: Category[] };
```

---

### 22. `Transactions` 页面 `selectedTransaction` 类型为 `any`

**文件路径**：`frontend/src/pages/Transactions/index.tsx`（第 72 行）

**问题描述**：
```ts
const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
```

**建议修复**：
```ts
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
```

---

### 23. `Transactions` 页面 `page` 在过滤器变化时不重置

**文件路径**：`frontend/src/pages/Transactions/index.tsx`（第 42-49 行）

**问题描述**：
当用户改变 `typeFilter`、`categoryFilter`、`dateFilter` 或 `search` 时，`page` 状态仍保持当前值。如果用户在第 5 页添加过滤器导致只剩 2 页，API 返回空结果，用户体验差。

**建议修复**：
```ts
const handleTypeChange = (newType: string) => {
  setTypeFilter(newType);
  setPage(1);  // 重置页码
  // ...
};
```

---

### 24. `Transactions` 页面表格行缺少键盘支持

**文件路径**：`frontend/src/pages/Transactions/index.tsx`（第 228-255 行）

**问题描述**：
`<tr onClick={...}>` 没有 `role="button"`、`tabIndex={0}` 或键盘事件处理，键盘用户无法打开交易详情。

**建议修复**：
```tsx
<tr
  key={t.id}
  data-focus={t.id}
  onClick={() => { setSelectedTransaction(t); setShowDetail(true); }}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTransaction(t); setShowDetail(true); } }}
  role="button"
  tabIndex={0}
  style={{ cursor: 'pointer' }}
>
```

---

### 25. `Sidebar` 的 `getActiveId`、`avatarChar`、`currentMonth` 在每次渲染时重新计算

**文件路径**：`frontend/src/components/Sidebar/index.tsx`（第 143-158、168-173、176 行）

**问题描述**：
这些计算在每次渲染时执行，虽然当前逻辑简单，但属于不良实践。`getActiveId` 遍历约 14 个导航项，在大量重渲染时累积成本。

**建议修复**：
```ts
const activeId = useMemo(() => {
  const p = location.pathname;
  if (p === '/') return 'dashboard';
  const allItems = [...NAV_ITEMS, ...ADMIN_ITEMS];
  let matchedItem = null;
  let maxLength = 0;
  for (const item of allItems) {
    if (item.path !== '/' && p.startsWith(item.path)) {
      if (item.path.length > maxLength) {
        maxLength = item.path.length;
        matchedItem = item;
      }
    }
  }
  return matchedItem?.id || 'dashboard';
}, [location.pathname]);

const avatarChar = useMemo(() => {
  const name = user?.username || user?.email || '用户';
  const chineseChar = name.match(/[\u4e00-\u9fa5]/);
  if (chineseChar) return chineseChar[0];
  return name.charAt(0).toUpperCase() || 'U';
}, [user?.username, user?.email]);

const currentMonth = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'), []);
```

---

### 26. `Sidebar` 的 `user?.avatar_url` 的 `<img>` 缺少 `onError` 处理

**文件路径**：`frontend/src/components/Sidebar/index.tsx`（第 271-274 行、第 293-296 行）

**问题描述**：
如果 `avatar_url` 失效或返回 404，图片显示破裂图标，没有 fallback 到 `avatarChar`。

**建议修复**：
```tsx
<img
  src={user.avatar_url}
  alt=""
  onError={(e) => { e.currentTarget.style.display = 'none'; }}
/>
```

---

### 27. `Sidebar` 的 `menuOpen` 缺少键盘支持（Escape 键）和 `aria-expanded`

**文件路径**：`frontend/src/components/Sidebar/index.tsx`（第 122-141、269-285 行）

**问题描述**：
用户菜单无法通过 Escape 键关闭，触发按钮没有 `aria-expanded` 属性。

**建议修复**：
```tsx
<button
  className="sidebar-user-btn"
  onClick={() => setMenuOpen(!menuOpen)}
  aria-expanded={menuOpen}
  aria-haspopup="true"
>
```

并添加 Escape 键处理：
```tsx
useEffect(() => {
  if (!menuOpen) return;
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setMenuOpen(false);
  };
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, [menuOpen]);
```

---

### 28. `Login.tsx` 的 `handleSubmit` catch 为空，登录失败无用户反馈

**文件路径**：`frontend/src/pages/User/Login/index.tsx`（第 43-46 行）

**问题描述**：
```ts
catch {
  refreshCaptcha();
}
```

虽然 `signIn` 内部可能显示通知，但依赖隐式行为不可靠。如果 `signIn` 的 notify 被静默模式禁用，用户不知道登录失败原因。

**建议修复**：
```ts
catch (error) {
  if (error instanceof Error) {
    notify({ type: 'error', message: error.message || '登录失败，请重试' });
  }
  refreshCaptcha();
}
```

---

### 29. `notifications.tsx` 的 `setTimeout` 在组件卸载时不清理

**文件路径**：`frontend/src/utils/notifications.tsx`（第 41-43 行）

**问题描述**：
```ts
window.setTimeout(() => {
  setNotifications((current) => current.filter((item) => item.id !== notification.id));
}, 3000);
```

如果 `NotificationProvider` 在 3 秒内卸载，定时器仍会触发。React 18 会忽略已卸载组件的 `setState`，但 React 17 会报内存泄漏警告，且定时器本身不被清理。

**建议修复**：
存储 timer ID 并在 cleanup 中清理：
```ts
const timersRef = useRef<Set<number>>(new Set());

useEffect(() => {
  const handleAdd = (notification: NotificationItem) => {
    setNotifications((current) => [...current, notification]);
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    }, 3000);
    timersRef.current.add(timerId);
  };
  listeners.add(handleAdd);
  return () => {
    listeners.delete(handleAdd);
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  };
}, []);
```

---

### 30. `notifications.tsx` 缺少 `role="alert"` / `aria-live` 可访问性属性

**文件路径**：`frontend/src/utils/notifications.tsx`（第 59-91 行）

**问题描述**：
通知容器没有 `aria-live` 或 `role="alert"` 属性，屏幕阅读器用户无法感知通知。

**建议修复**：
```tsx
<div
  className="..."
  role="region"
  aria-live="polite"
  aria-label="通知"
  style={{ zIndex: 'var(--z-toast)' }}
>
```

---

### 31. `useFocusItem` 的 `cleanupTimerRef` 在 `focusId` 变化时未清理

**文件路径**：`frontend/src/hooks/useFocusItem.ts`（第 86-94、119-124 行）

**问题描述**：
当 `focusId` 在 `cleanupTimerRef` 的 timeout 触发前变化，旧的 timeout 仍会执行 `setSearchParams`，可能误删新的 URL 参数。

**建议修复**：
在 `useEffect` 的 cleanup 函数中同时清理 `cleanupTimerRef`：
```ts
return () => {
  clearAll(); // 已经包含 cleanupTimerRef 的清理
};
```

---

### 32. `useFocusItem` 的 `searchParams` 依赖导致不必要的 effect 运行

**文件路径**：`frontend/src/hooks/useFocusItem.ts`（第 125 行）

**问题描述**：
`useEffect` 的依赖数组包含 `searchParams`，而 `searchParams` 在每次 URL 变化时都会重新创建（新的 `URLSearchParams` 对象），即使查询参数相同。

**建议修复**：
使用 `searchParams.toString()` 作为依赖：
```ts
}, [focusId, getSelector, clearAll, duration, scrollBehavior, scrollBlock, searchParams.toString(), setSearchParams]);
```

---

### 33. `request.ts` 的 `apiClient` 冗余且不灵活

**文件路径**：`frontend/src/services/api.ts`（第 492-504 行）

**问题描述**：
`apiClient.get` 硬编码 `requiresAuth: true`，没有 `requiresAuth` 参数。且该对象在整个项目中似乎未被使用，属于死代码。

**建议修复**：
删除 `apiClient`，或直接使用 `request` 函数。

---

### 34. `request.ts` 中 `catch` 块双重处理错误（通知 + 抛出）

**文件路径**：`frontend/src/services/api.ts`（第 249-266 行）

**问题描述**：
非 `ApiError` 的错误在 `catch` 块中显示通知，然后重新抛出。调用方再次捕获时可能也显示通知，导致双重通知。

**建议修复**：
区分通知责任：
- `request` 层：仅对网络级错误（如超时、断网）显示通知
- 调用方：对业务错误（如 400/422）显示通知

或引入 `silent` 选项让调用方控制。

---

### 35. `Dashboard` 的 `quick-actions` 使用 `div` 而不是可交互元素

**文件路径**：`frontend/src/pages/Dashboard/index.tsx`（第 246-272 行）

**问题描述**：
```tsx
<div className="quick-action" onClick={() => navigate('/add')}>
```

没有 `role="button"`、`tabIndex={0}` 或键盘事件，键盘用户无法使用。

**建议修复**：
使用 `<button>` 或添加 ARIA 属性：
```tsx
<button className="quick-action" onClick={() => navigate('/add')} type="button">
```

---

### 36. `useTransactionForm.ts` 的 `handleTemplateConfirm` 使用 `any`

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 214 行）

**问题描述**：
```ts
const handleTemplateConfirm = (template: any) => { ... }
```

**建议修复**：
使用 `Template` 类型：
```ts
const handleTemplateConfirm = (template: Template) => { ... }
```

---

### 37. `useTransactionForm.ts` 的 `categoryOptions` 使用 `any`

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 106-107 行）

**问题描述**：
```ts
.filter((c: any) => c.type === formData.type)
.map((c: any) => ({ ... }))
```

**建议修复**：
使用 `Category` 类型。

---

### 38. `useTransactionForm.ts` 的 `ocrResult.amount` 为 `"0"` 时被忽略

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 277 行）

**问题描述**：
```ts
next.amount = ocrResult.amount || prev.amount;
```
`"0"` 是 falsy 值，所以如果 OCR 识别出金额为 0，会被忽略。

**建议修复**：
```ts
next.amount = ocrResult.amount !== undefined ? ocrResult.amount : prev.amount;
```

---

### 39. `useTransactionForm.ts` 的 `parseReceiptOCR` 中 `Array.sort` 原地修改数组

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 443 行）

**问题描述**：
```ts
const bestLine = lines.sort((a, b) => b.trim().length - a.trim().length)[0];
```
`Array.sort` 原地排序，修改了 `lines` 数组。

**建议修复**：
```ts
const bestLine = [...lines].sort((a, b) => b.trim().length - a.trim().length)[0];
```

---

### 40. `package.json` 的 `eslintConfig` 关闭 `react-hooks/exhaustive-deps`

**文件路径**：`frontend/package.json`（第 20 行）

**问题描述**：
```json
"react-hooks/exhaustive-deps": "off"
```

完全关闭了这个关键的 ESLint 规则，导致大量 `useEffect` / `useCallback` / `useMemo` 遗漏依赖的 bug 无法被自动检测。

**建议修复**：
```json
"react-hooks/exhaustive-deps": "warn"
```

然后逐步修复所有警告。

---

### 41. `package.json` 的 `scripts` 中使用 `kill -9` 过于暴力

**文件路径**：`frontend/package.json`（第 6-7 行）

**问题描述**：
```json
"start": "... lsof -ti:3001 | xargs kill -9 2>/dev/null; react-scripts start"
```

`kill -9` 是 SIGKILL，进程无法优雅关闭，可能丢失数据或导致文件损坏。`lsof` 可能误杀其他使用相同端口的应用。

**建议修复**：
使用更优雅的方式：
```json
"start": "... lsof -ti:3001 | xargs kill -15 2>/dev/null; react-scripts start"
```

或更好：使用 `fkill` 或专门的端口清理工具。

---

### 42. `routes.tsx` 的 `RouteConfig.element` 类型过于宽泛

**文件路径**：`frontend/src/routes/types.ts`（第 5 行）

**问题描述**：
```ts
element: React.ReactNode
```

`React.ReactNode` 包含 `string`、`number` 等，但 `react-router-dom` 的 `Route` 的 `element` 期望 `React.ReactElement`。

**建议修复**：
```ts
element: React.ReactElement
```

---

### 43. `App.tsx` 的 `NO_BOOK_ALLOWED` 和 `AUTH_ROUTES` 硬编码

**文件路径**：`frontend/src/App.tsx`（第 15、32 行）

**问题描述**：
路由白名单在两个地方硬编码，添加新路由时容易遗漏。

**建议修复**：
从 `routes` 配置派生：
```ts
const AUTH_ROUTES = routes.filter((r) => !r.isPrivate).map((r) => r.path);
const NO_BOOK_ALLOWED = ['/onboarding', '/books', '/profile'];
```

---

### 44. `App.tsx` 的 `hasToken()` 检查与 `authLoading` 冗余

**文件路径**：`frontend/src/App.tsx`（第 60 行）

**问题描述**：
```ts
if (!hasToken() && !authLoading) {
  return <Navigate to="/login" replace />;
}
```

如果 `hasToken()` 为 false，`authLoading` 一定为 false（因为 `loading` 的计算是 `hasToken() ? !isFetched : false`）。所以 `!authLoading` 是冗余的。

**建议修复**：
```ts
if (!hasToken()) {
  return <Navigate to="/login" replace />;
}
```

---

### 45. `useBook.tsx` 的 `setCurrentBookApi` 错误只 `console.error`

**文件路径**：`frontend/src/hooks/useBook.tsx`（第 93 行）

**问题描述**：
```ts
setCurrentBookApi(book.id).catch((err) => console.error('设置当前账本失败', err));
```

API 失败时用户完全不知情，以为账本切换成功。

**建议修复**：
```ts
setCurrentBookApi(book.id).catch(() => {
  notify({ type: 'error', message: '设置当前账本失败，请重试' });
});
```

---

### 46. `useBook.tsx` 的 `refetchBooks` 错误只 `console.error`

**文件路径**：`frontend/src/hooks/useBook.tsx`（第 57-61 行）

**问题描述**：
与上一条相同，刷新失败时用户无感知。

**建议修复**：
通知用户或至少让错误可以被上层捕获。

---

### 47. `useBook.tsx` 的 `useBook` 没有 `undefined` 检查

**文件路径**：`frontend/src/hooks/useBook.tsx`（第 40-41 行）

**问题描述**：
```ts
const useBook = () => useContext(BookContext);
```

与 `useAuth` 不同，`useBook` 在 `BookProvider` 外部使用时返回默认值而不是抛出错误，可能导致静默错误。

**建议修复**：
```ts
export const useBook = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};
```

（注意：当前默认值不是 `undefined` 而是对象，需要调整 `createContext` 的默认值。）

---

## 四、低优先级问题（Low）

### 48. `routes.tsx` 缺少 404 路由

**文件路径**：`frontend/src/routes/routes.tsx`、`frontend/src/App.tsx`

**问题描述**：
所有未知路由都重定向到 `/`，没有专门的 404 页面。

**建议修复**：
添加 `NotFound` 页面组件和路由配置。

---

### 49. `App.tsx` 的 `document.title` 不根据页面变化

**文件路径**：`frontend/src/App.tsx`（第 39-41 行）

**问题描述**：
```ts
useEffect(() => {
  document.title = PROJECT_NAME;
}, [location.pathname]);
```

所有页面标题都是"静记"，不利于 SEO 和多标签页识别。

**建议修复**：
根据路由映射不同标题：
```ts
const pageTitles: Record<string, string> = {
  '/': '首页 - 静记',
  '/transactions': '交易流水 - 静记',
  '/add': '记一笔 - 静记',
  // ...
};
useEffect(() => {
  document.title = pageTitles[location.pathname] || PROJECT_NAME;
}, [location.pathname]);
```

---

### 50. `useDebounce.ts` 的 `useRef` 冗余

**文件路径**：`frontend/src/hooks/useDebounce.ts`（第 10、14、21-23 行）

**问题描述**：
`useRef` 存储 timer ID 是多余的，因为 `useEffect` 的 cleanup 函数已经可以访问 `timer` 变量：
```ts
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

当前实现虽然正确但冗长。

---

### 51. `useTransactionForm.ts` 的 `todayStr` 不随日期变化

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 42 行）

**问题描述**：
```ts
const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
```

如果用户保持页面到午夜后，日期不会更新。

**建议修复**：
不是严重问题，但如果需要精确日期，可在提交时动态计算。

---

### 52. `useTransactionForm.ts` 的 `imageUrlsJson` 在 `createMutation` 中未使用

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 99-102 行）

**问题描述**：
```ts
const imageUrlsJson = useMemo(() => {
  if (savedImageUrls.length === 0) return undefined;
  return JSON.stringify(savedImageUrls);
}, [savedImageUrls]);
```

仅在 `updateMutation` 中使用，新建交易时图片通过后续 `updateTransaction` 更新。这是设计意图，但可添加注释说明。

---

### 53. `useTransactionForm.ts` 的 `upload` 是顺序而非并行

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 174-178、193-197 行）

**问题描述**：
使用 `for...of` 循环顺序上传，多张图片时较慢。

**建议修复**：
使用 `Promise.all` 并行上传，或限制并发数（如 3 个并发）：
```ts
const uploadResults = await Promise.all(
  pendingImages.map((p) => uploadMutation.mutateAsync({ transactionId: newTransactionId, file: p.blob }))
);
```

---

### 54. `Dashboard` 的 `budgetStatus` 只显示前4个

**文件路径**：`frontend/src/pages/Dashboard/index.tsx`（第 200 行）

**问题描述**：
```ts
{budgetStatus.categories.slice(0, 4).map((cat) => (...))}
```

没有"查看更多"链接，用户不知道有更多预算。

**建议修复**：
添加"查看全部预算"链接到 `/budgets`。

---

### 55. `Dashboard` 的 `new Date(txn.date)` 时区问题

**文件路径**：`frontend/src/pages/Dashboard/index.tsx`（第 163 行）

**问题描述**：
```ts
format(new Date(txn.date), 'MM-dd')
```

如果后端返回的 `date` 是 `YYYY-MM-DD` 格式的北京时间字符串，转换为 `Date` 时浏览器可能按 UTC 解析，导致日期偏差。

**建议修复**：
使用 `date-fns` 的 `parse` 函数指定格式：
```ts
import { parse } from 'date-fns';
format(parse(txn.date, 'yyyy-MM-dd', new Date()), 'MM-dd')
```

---

### 56. `formatDate` 的 `isNaN` 使用全局版本

**文件路径**：`frontend/src/utils/common.ts`（第 4 行）

**问题描述**：
```ts
if (isNaN(num)) { ... }
```

全局 `isNaN` 会强制类型转换，不如 `Number.isNaN` 安全。

**建议修复**：
```ts
if (Number.isNaN(num)) { ... }
```

---

### 57. `progress.ts` 的 `pendingRequests` 如果 `end` 未被调用会泄漏

**文件路径**：`frontend/src/utils/progress.ts`（第 16、109-121 行）

**问题描述**：
如果 `trackRequest(id, 'start')` 被调用但 `trackRequest(id, 'end')` 因异常未执行，`pendingRequests` 会无限增长。虽然 `request.ts` 的 `finally` 块保证了 `end`，但其他调用方可能不遵循。

**建议修复**：
添加超时机制，自动清理长时间未结束的请求：
```ts
const CLEANUP_TIMEOUT_MS = 120000;
// 在 trackRequest 中设置定时清理
```

---

### 58. `useCategories` 的 `queryKey` 不包含 `type`

**文件路径**：`frontend/src/hooks/useCategories.ts`（第 12-23 行）

**问题描述**：
不同 `type` 的调用共享同一个缓存，虽然数据相同，但 `select` 过滤后的数据在另一个组件中可能被误认为完整数据。

**建议修复**：
不是严重问题，但可添加注释说明设计意图。

---

### 59. `useCategoryLookup` 的 `nameToIdMap` 可能有重复

**文件路径**：`frontend/src/hooks/useCategories.ts`（第 42-48 行）

**问题描述**：
如果两个分类名称相同，后一个会覆盖前一个。

**建议修复**：
不是严重问题，但后端应保证分类名称唯一性。

---

### 60. `Sidebar` 的 `NAV_ITEMS` 硬编码切片

**文件路径**：`frontend/src/components/Sidebar/index.tsx`（第 209、225 行）

**问题描述**：
```ts
NAV_ITEMS.slice(0, 7)  // "主菜单"
NAV_ITEMS.slice(7)      // "更多"
```

硬编码的分割点，添加新导航项时容易破坏布局。

**建议修复**：
在 `NAV_ITEMS` 中添加 `section` 字段：
```ts
const NAV_ITEMS = [
  { id: 'dashboard', name: '首页', path: '/', section: 'main' },
  // ...
  { id: 'books', name: '账本', path: '/books', section: 'more' },
];
```

---

### 61. `Sidebar` 的 `SwitchAccountModal` 始终渲染

**文件路径**：`frontend/src/components/Sidebar/index.tsx`（第 339-342 行）

**问题描述**：
即使 `showSwitchModal` 为 `false`，`SwitchAccountModal` 组件仍然挂载，可能执行不必要的初始化逻辑。

**建议修复**：
```tsx
{showSwitchModal && (
  <SwitchAccountModal visible={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
)}
```

---

### 62. `package.json` 的 `typescript` 和 `react-scripts` 版本较旧

**文件路径**：`frontend/package.json`（第 48、51 行）

**问题描述**：
- `typescript: ^4.9.5` — 最新已 5.x
- `react-scripts: 5.0.1` — 2022 年版本，CRA 已不推荐

**建议修复**：
升级到 TypeScript 5.x，并考虑迁移到 Vite（CRA 已停止积极维护）。

---

### 63. `package.json` 缺少 `prettier`/`husky` 配置

**文件路径**：`frontend/package.json`

**问题描述**：
没有代码格式化工具和预提交钩子，代码风格一致性依赖开发者自觉。

**建议修复**：
添加 `prettier` 配置和 `husky` + `lint-staged`。

---

### 64. `auth.tsx` 的 `value` 对象未使用 `useMemo`

**文件路径**：`frontend/src/utils/auth.tsx`（第 134-142 行）

**问题描述**：
```ts
const value: AuthContextType = { ... };
```

每次渲染都创建新对象，导致所有 `useAuth()` 消费者重新渲染。

**建议修复**：
```ts
const value = useMemo<AuthContextType>(() => ({
  user, loading, signIn, signUp, signOut, refreshUser, switchByToken,
}), [user, loading, signIn, signUp, signOut, refreshUser, switchByToken]);
```

---

### 65. `useBook.tsx` 的 `useMemo` 依赖过多

**文件路径**：`frontend/src/hooks/useBook.tsx`（第 111-123 行）

**问题描述**：
```ts
const contextValue = useMemo<BookContextType>(
  () => ({ ... }),
  [currentBook, books, switchBook, booksLoading, isOwner, setCurrentBookId, hasBooks, refetchBooks],
);
```

`switchBook` 和 `setCurrentBookId` 是 `useCallback` 创建的，它们已经依赖了 `queryClient` 和 `books`。当 `books` 变化时，`switchBook` 变化，然后 `contextValue` 也变化。这是正确的，但依赖链冗长。

**建议修复**：
不是严重问题，但可考虑将 `contextValue` 的依赖精简为实际变化的原始值。

---

### 66. `useBook.tsx` 的 `queryKey` 包含 `'guest'` 永远不会使用

**文件路径**：`frontend/src/hooks/useBook.tsx`（第 50 行）

**问题描述**：
```ts
queryKey: ['books', user?.id || 'guest'],
enabled: !!user,
```

当 `user` 为 null 时 `enabled` 为 false，所以 `'guest'` 永远不会被使用。

**建议修复**：
```ts
queryKey: ['books', user?.id],
enabled: !!user,
```

---

### 67. `useTransactionForm.ts` 的 `handleReset` 在编辑模式下行为不合理

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 478-482 行）

**问题描述**：
编辑模式下点击"重置"会清空所有数据（包括已保存的图片），而非恢复到原始编辑数据。

**建议修复**：
在编辑模式下"重置"应恢复 `editData` 的原始值，或隐藏"重置"按钮。

---

### 68. `Transactions` 页面详情显示内部 ID

**文件路径**：`frontend/src/pages/Transactions/index.tsx`（第 319-320 行）

**问题描述**：
```tsx
{selectedTransaction.poi_id && <DetailItem label="商户 ID" value={selectedTransaction.poi_id} />}
{selectedTransaction.book_id && <DetailItem label="账本 ID" value={selectedTransaction.book_id} />}
```

普通用户不需要看到内部 ID（`poi_id`、`book_id`）。

**建议修复**：
删除这些字段，或仅在管理员模式下显示。

---

### 69. `GlobalModal` 的 `children` 作为 prop 传递

**文件路径**：`frontend/src/pages/Transactions/index.tsx`（第 356-365 行）

**问题描述**：
```tsx
<GlobalModal
  type="confirm"
  open={showDeleteConfirm}
  title="确认删除"
  children="确定要删除这笔交易吗？"
/>
```

在 JSX 中使用 `children` 作为属性名不是 React 推荐的做法。虽然 React 允许，但可能导致 TypeScript 类型混淆和意外行为。

**建议修复**：
```tsx
<GlobalModal type="confirm" open={showDeleteConfirm} title="确认删除">
  确定要删除这笔交易吗？
</GlobalModal>
```

或修改 `GlobalModal` 的接口，使用 `content` 替代 `children` 作为 prop 名。

---

### 70. `useTransactionForm.ts` 中 `handleSubmit` 成功但未重置表单

**文件路径**：`frontend/src/pages/AddTransaction/hooks/useTransactionForm.ts`（第 189-207 行）

**问题描述**：
提交成功后 `navigate('/transactions')`，但表单状态没有被重置。如果用户点击浏览器返回，会看到之前的表单数据。

**建议修复**：
在 `navigate` 前调用 `handleReset()`：
```ts
notify({ type: 'success', message: '交易已保存' });
handleReset();
navigate('/transactions');
```

---

## 五、依赖分析（package.json）

### 已审查的依赖项评估

| 依赖 | 版本 | 评估 |
|------|------|------|
| `react` / `react-dom` | `^18.0.0` | 正确，但建议升级到 18.3+ |
| `react-router-dom` | `^6.22.3` | 正确 |
| `@tanstack/react-query` | `^5.20.3` | 正确，但需确保 API 使用符合 v5 规范 |
| `react-scripts` | `5.0.1` | ⚠️ 过时，建议迁移到 Vite |
| `typescript` | `^4.9.5` | ⚠️ 较旧，建议升级到 5.x |
| `tesseract.js` | `^7.0.0` | ⚠️ 体积很大，考虑懒加载或移至后端 |
| `echarts` | `^5.6.0` | 正确，但建议按需导入 |
| `html-to-image` | `^1.11.13` | 正确 |
| `lucide-react` | `^0.382.0` | 正确，但项目中同时存在自定义 SVG，风格不一致 |
| `date-fns` | `^2.30.0` | 正确 |
| `@uiw/react-amap` | `^7.1.15` | 正确 |
| `lunar-javascript` | `^1.7.7` | 正确 |
| `tailwindcss` | `^3.3.3` | 正确 |
| `sass` | `^1.100.0` | 正确 |

### 建议添加的依赖

- `dompurify`：清理 `dangerouslySetInnerHTML` 的 SVG 内容
- `zod`：表单验证（替代手写的 `parseFloat` 检查）
- `prettier`：代码格式化
- `husky` + `lint-staged`：预提交代码检查

### 建议移除的依赖

- `apiClient`（`services/api.ts` 第 492-504 行）似乎是死代码

---

## 六、总结统计

| 严重程度 | 数量 | 主要类别 |
|----------|------|----------|
| Critical | 9 | 按钮防重失效、竞态条件、XSS、资源泄漏、验证绕过 |
| High | 12 | 性能差、内存泄漏、UI 状态错误、可访问性缺失、安全 |
| Medium | 27 | 类型安全、可访问性、硬编码、错误处理、代码风格 |
| Low | 22 | 类型精度、冗余代码、版本过时、最佳实践 |
| **总计** | **70** | — |

### 最优先修复的 5 项

1. **`useDebouncedAction` 的 `isRunning` 永远为 `false`** — 影响所有表单提交和按钮防重，用户可重复提交导致数据错误
2. **`auth.tsx` 的 `switchByToken` 使用 `clear()` 触发竞态** — 与项目文档冲突，账号切换时数据不一致
3. **`auth.tsx` 的 profile query 捕获所有错误后清 token** — 网络波动导致用户被强制登出，体验极差
4. **`Login.tsx` 的 `dangerouslySetInnerHTML` XSS 风险** — 安全漏洞
5. **`useTransactionForm.ts` 的金额验证绕过** — 非数字金额可提交到后端
