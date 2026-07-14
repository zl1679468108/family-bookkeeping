# Taro 端 loading 反馈统一补全

## 概述

按用户要求对 Taro 小程序端所有「选择 / 切换 / 筛选后请求列表」的场景做了一次全面检查，补全了缺失或覆盖不全的 loading 反馈，并把部分仍用 `useQuery` 的读操作改为项目规范的 `useManualQuery`。

## 改动文件

| 文件 | 改动 |
|---|---|
| `taro/src/pages/Budgets/index.tsx` | 月份切换时会同时请求 budgets + status，现在把 `statusLoading` 合并到 `PageContainer.loading`，避免 status 接口慢时提前解除 loading。 |
| `taro/src/pages/BookSettings/index.tsx` | 把 3 个 `useQuery` 读操作改为 `useManualQuery`；编辑模式下从 fallback 加载账本数据时，渲染守卫会显示 loading，而不是直接展示「账本不存在」。 |
| `taro/src/pages/BookMembers/index.tsx` | 把 `useQuery` 改为 `useManualQuery`，并合并成员/owner 的 loading 状态到 `PageContainer.loading`。 |
| `taro/src/pages/CategoryEdit/index.tsx` | 把分类列表 `useQuery` 改为 `useManualQuery`，并给 `PageContainer` 加 `loading={isLoading}`。 |
| `taro/src/pages/TemplateEdit/index.tsx` | 把模板列表 `useQuery` 改为 `useManualQuery`，并给 `PageContainer` 加 `loading={isLoading}`。 |
| `taro/src/pages/AddTransaction/index.tsx` | 编辑模式下加载交易详情时，使用 `Taro.showLoading` + `.then` 兜底隐藏，避免空白表单闪烁。 |

## 已检查无需改动的页面

- `Transactions`：筛选 Picker 切换时已通过 `setLoading(true)` 触发 `PageContainer` loading。
- `Home`：初始加载与下拉刷新已覆盖 `initialLoading` / `refreshing`。
- `Categories` / `TemplateManager` / `Books`：主列表已绑定 `isLoading`；`Books` 弹窗内的成员列表已有 skeleton loading。

## 验证结果

- `npx tsc --noEmit`（Taro）通过，无类型错误。
- `npm run build:weapp` 产物已生成到 `dist-prod/`。

## 注意点

- 所有写操作（保存/删除/转移等）保持手动 `setSaving` + `.then/.catch` + `setTimeout` 兜底模式，未引入 `useMutation`。
- 读操作统一走 `useManualQuery`，规避 Taro/微信 regenerator 下 `useQuery` enabled 激活不可靠的问题。
