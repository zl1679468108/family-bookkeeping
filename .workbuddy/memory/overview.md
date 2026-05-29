# 地图瓦片取消 - 根因修复

## 问题根因

两个原因叠加导致瓦片被取消：

### 1. center/zoom props 随 state 变化
```tsx
// ❌ 旧：selectedPos 变化 → React 重渲染 → @uiw/react-amap 同步 prop → 二次视口变更
<Map center={selectedPos || [104, 35]} zoom={selectedPos ? 16 : 4} />
```
`doLocate` 里同时调 `setSelectedPos(pos)`（触发 React prop 变更）和 `map.setCenter/zoom`（命令式），形成双重视口变更。

### 2. events.created 过早触发视口操作
`events.created` 在 Map 对象创建后立即触发，但首批瓦片还在加载中。此时调 `setFitView/setCenter` → 正在加载的瓦片被取消。

## 修复方案

| 措施 | MapCanvas | LocationPicker |
|------|-----------|----------------|
| `center`/`zoom` 静态常量 | ✅ `const INITIAL_CENTER/ZOOM` | ✅ `const INITIAL_CENTER/ZOOM` |
| `map.on('complete')` 栅栏 | ✅ 首批瓦片加载完才执行 | ✅ 首批瓦片加载完才执行 |
| 视口变更全命令式 | ✅ 不走 prop 路径 | ✅ 不走 prop 路径 |
| ref 保持最新数据 | ✅ `allPointsRef` | ✅ 不需要 |

## 新流程

```
地图渲染 (静态 center/zoom)
    ↓
首批瓦片开始加载...
    ↓
map.on('complete') ← 瓦片全部就绪
    ↓
判断：有点位？
  ├─ 有 → setFitView (一次性，新瓦片按需加载)
  └─ 无 → 等 2s
         ├─ 数据来了 → setFitView
         └─ 没数据 → Geolocation → setCenter/setZoom
              └─ 失败 → 显示错误提示
```
