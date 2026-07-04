# 自动化测试账号

> 用于 E2E 自动化测试的真实账号，密码统一为 `zl123456`

## 账号列表

| 序号 | 邮箱 | 用户名 | 密码 | 用途 |
|------|------|--------|------|------|
| 1 | 2029390286@qq.com | wtt11 | zl123456 | 主测试账号 |
| 2 | test123@qq.com | test123 | zl123456 | 辅助测试账号 |
| 3 | 1679468108@qq.com | zhaolong | zl123456 | 多账本测试账号 |

## 使用说明

### 后端 API 测试

```bash
# 登录获取 token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2029390286@qq.com","password":"zl123456","captchaId":"xxx","captchaCode":"xxx"}'
```

### 前端 E2E 测试

```typescript
const TEST_EMAIL = '2029390286@qq.com';
const TEST_PASSWORD = 'zl123456';
```

### 测试场景分配

| 账号 | 测试场景 |
|------|----------|
| wtt11 | 日常记账、分类管理、预算管理、模板管理 |
| test123 | 多账本协作、成员邀请 |
| zhaong | 统计报表、年度报告、数据导出 |

## 注意事项

1. 测试账号使用真实数据，不要随意删除测试产生的数据
2. 密码统一为 `zl123456`，如有变更需同步更新
3. 测试前确保后端服务运行在 `http://localhost:3000`
4. 测试前确保前端服务运行在 `http://localhost:3001`
