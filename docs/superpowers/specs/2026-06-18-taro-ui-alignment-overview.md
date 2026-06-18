# Taro 小程序端 UI 全面对齐 PC 端 — 总体设计

> 状态：已确认方向
> 日期：2026-06-18
> 范围：taro 小程序端 UI 体系 + 全部 15 个业务页面

## 1. 背景与目标

### 现状
- `frontend`（PC 端）已完成成熟 UI 建设：完整设计 Token、18 个通用 UI 组件、统一的交互模式（详情弹窗 / 编辑 / 删除确认 / 骨架屏 / 分页 / Toast）。
- `taro`（小程序端）停留在"每个页面自己写一堆 view + scss"的阶段：
  - 仅有 5 个通用组件（AppSection / PageHero / MetricGrid / MenuList / FloatingAction）。
  - 大量页面内联重复的 View/Text 结构和样式（如 Home 的 `.budget-item`/`.txn-row`/`.cat-item`，本应是独立组件）。
  - 部分页面过大：Books 844 行、TemplateManager 690 行、Categories 547 行。
  - token 数值与 PC 端一致，但命名不同（`--primary` vs `--pr`），且缺阴影 / 动画 / z-index / 深色模式体系。

### 目标
**视觉完全对齐 PC 端，交互适配小程序习惯。** 具体做到：
1. 设计 Token 全量对齐 PC 端命名与数值，补齐缺失体系。
2. 建设与 PC 端同名同 props 接口的通用 UI 组件库。
3. 逐页用通用组件重写，消除页面内联结构，提升可维护性。

### 非目标
- 不引入第三方 UI 库（NutUI / Taroify 等），保持零 UI 库纯净状态。
- 不追求与 PC 端交互 1:1 死板复刻（PC hover / 右侧抽屉，小程序用 active / 页面跳转 / 底部 sheet 适配）。
- 不改变现有后端 API、数据模型、业务逻辑。

## 2. 关键决策（已与用户确认）

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 视觉方向 | 对齐 PC 端 | 用户明确要求"图标、UI 风格、功能、交互几乎所有都对齐 PC" |
| 工作范围 | 全套对齐 | 覆盖组件库 + 全部 15 个业务页面 |
| 实施顺序 | 先组件库，后分批重构页面 | 地基稳，页面重构时组件已就绪 |
| 组件还原度 | 视觉对齐，交互适配小程序习惯 | 务实，符合小程序交互习惯 |
| 组件实现路径 | 选项 A：自研对齐 PC 的 Taro 组件集 | 保持零 UI 库；两端组件 API 一致；精确对齐 |
| Token 命名 | 采用 PC 端命名（`--pr`/`--srf` 等） | 两端 token 完全一致，维护方便 |

## 3. 总体分解：6 个独立 Spec

按依赖顺序执行，每个 spec 走完整的 plan → 实现循环。用户要求"任务越细致越好"，故页面分批较细。

| # | Spec | 内容 | 依赖 | 预估复杂度 |
|---|------|------|------|-----------|
| **0** | 设计 Token 对齐 | 重写 `app.scss` token 体系，采用 PC 端命名 + 补齐阴影/动画/z-index/深色模式；保留旧命名兼容 | 无 | 中 |
| **1** | 通用 UI 组件库 | 建设对齐 PC 端的 14 个通用组件 + 弹窗/抽屉适配 + 统一导出 | Spec 0 | 高 |
| **2** | 核心高频页面 | Home + Transactions + AddTransaction | Spec 1 | 高 |
| **3a** | 账本管理类页面 | Books + BookSettings + BookMembers | Spec 1 | 中 |
| **3b** | 配置管理类页面 | Categories + Budgets + TemplateManager | Spec 1 | 中 |
| **4** | 统计展示页面 | Statistics + Calendar + Map + AnnualReport | Spec 1 | 高 |
| **5** | 用户与设置页面 | Profile + Profile/Settings + EditProfile + User/Login/Register/ForgotPassword | Spec 1 | 中 |

> 注：原"管理类页面"拆成 3a / 3b 两批，使每批 spec 专注、可独立验证。

## 4. 执行纪律

- 每个 spec 独立编写设计文档 → writing-plans 生成实现计划 → 实现 → 验证。
- Spec 0/1 完成后，先落地为可运行版本，再启动 Spec 2。
- 后续页面 spec 在引用组件时，必须使用 Spec 1 统一导出的组件，禁止页面内联重复结构。

## 5. 后续

本文件为总体纲领。接下来应：
1. 先落地 **Spec 0（Token 对齐）** 和 **Spec 1（组件库）** 的详细设计（见同目录另两份文档）。
2. 这两份完成后，进入 writing-plans 生成实现计划。
3. 实现并验证 Spec 0+1 后，再逐个启动 Spec 2~5。
