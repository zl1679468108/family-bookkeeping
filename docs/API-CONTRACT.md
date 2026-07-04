# API 契约文档

> 本文档定义前后端共享的数据类型，三端（frontend/taro/backend）需保持一致。
> 修改 API 响应结构时，需同步更新本文档和相关类型定义。

## 通用响应格式

```typescript
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
```

时间戳字段统一格式：`YYYY-MM-DD HH:mm:ss.SSS`（北京时间）

---

## Transaction（交易记录）

```typescript
interface Transaction {
  id: number;
  amount: string;                    // 金额，字符串格式
  type: 'income' | 'expense';        // 类型
  category: string;                  // 分类 ID (UUID)
  date: string;                      // 日期 YYYY-MM-DD
  description?: string;              // 描述
  brand?: string;                    // 商户/品牌名称
  location_name?: string;            // 地点名称
  latitude?: number;                 // 纬度
  longitude?: number;                // 经度
  poi_id?: string;                   // 高德 POI ID
  image_url?: string;                // 收据图片 URL
  image_urls?: string;               // 多张收据 JSON
  user_id: string;                   // 用户 ID
  book_id?: string;                  // 账本 ID
  created_at: string;                // 创建时间
}
```

---

## Book（账本）

```typescript
interface Book {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  icon?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // 扩展字段（listByUser 返回）
  role?: string;                     // 'owner' | 'member'
  txn_count?: number;                // 交易数量
  member_count?: number;             // 成员数量
}
```

---

## Category（分类）

```typescript
interface Category {
  id: string;
  name: string;
  icon: string;                      // Emoji 或自定义图标 ID
  type: 'income' | 'expense';
  is_default: boolean;
  sort_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

---

## Budget（预算）

```typescript
interface Budget {
  id: string;
  user_id: string;
  category: string;                  // 分类 ID
  book_id?: string;
  amount: number;                    // 预算金额
  month: string;                     // 月份 YYYY-MM-01
  created_at: string;
  updated_at: string;
}
```

---

## User（用户）

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  current_book_id?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Template（交易模板）

```typescript
interface TransactionTemplate {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  amount?: number;
  category_id?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string;
  merchant_name?: string;
  book_id?: string;
  sort_order: number;
  created_at: string;
}
```

---

## Statistics（统计）

```typescript
interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

interface MemberComparison {
  user_id: string;
  nickname: string;
  total: number;
  percentage: number;
}
```

---

## 维护规则

1. **修改 API 响应结构时**：更新本文档 + 后端 DTO + 前端 types/ + Taro types/
2. **新增字段时**：确保三端类型定义一致
3. **删除字段时**：搜索三端代码确认无引用后再删除
4. **同步检查**：每次修改后运行 `npx tsc --noEmit` 验证类型正确
