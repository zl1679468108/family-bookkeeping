# 静记 API Contract

## 用途

`api-contract.json` 是 OpenAPI 3.0 规范文件，定义了前后端共享的 API 契约。

## 三端类型同步

### 自动生成 TypeScript 类型

```bash
# 安装 openapi-typescript
npx openapi-typescript shared/api-contract.json -o frontend/src/types/api-contract.ts
npx openapi-typescript shared/api-contract.json -o taro/src/types/api-contract.ts
```

### 手动维护

当前前端 `frontend/src/types/` 和 Taro `taro/src/types/index.ts` 中的类型定义
应与本 contract 保持一致。修改后端接口后，同步更新此文件即可。

## 路由总览

| 模块 | 路径 | 方法 | 鉴权 |
|------|------|------|------|
| Auth | `/api/auth/register` | POST | 无 |
| | `/api/auth/login` | POST | 无（需验证码） |
| | `/api/auth/profile` | GET/PUT | Bearer |
| | `/api/auth/logout` | POST | Bearer |
| | `/api/auth/change-password` | POST | Bearer |
| | `/api/auth/current-book` | PUT | Bearer |
| Transactions | `/api/transactions` | GET/POST | Bearer |
| | `/api/transactions/:id` | GET/PUT/DELETE | Bearer |
| | `/api/transactions/batch` | POST | Bearer |
| Books | `/api/books` | GET/POST | Bearer |
| | `/api/books/:id` | GET/PUT/DELETE | Bearer |
| Statistics | `/api/statistics/summary` | GET | Bearer |
| | `/api/statistics/monthly-trend` | GET | Bearer |
| Categories | `/api/categories` | GET/POST | Bearer |
| | `/api/categories/:id` | PUT/DELETE | Bearer |
| | `/api/categories/reorder` | PATCH | Bearer |
| Budgets | `/api/budgets` | GET/PUT | Bearer |
| Map | `/api/map/transactions` | GET | Bearer |
| | `/api/map/merchants` | GET | Bearer |
| Export | `/api/export/excel` | GET | Bearer |
| | `/api/export/pdf` | GET | Bearer |
