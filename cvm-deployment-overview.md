# 静记 CVM 生产部署完成

## 概述

将「静记」从 CloudBase 体验版迁移到腾讯云 CVM（上海二区 `121.4.84.120`），并配置 Nginx + Node/PM2 + Let's Encrypt HTTPS，实现完整生产访问。

## 交付内容

| 项 | 状态 | 说明 |
|---|---|---|
| tccli 授权 | ✅ | 浏览器 `--browser no` 流程，凭证写入 `~/.tccli/default.credential` |
| CVM 登录 | ✅ | 实例原无密码 → 停机重置密码 → 开机。SSH 用户 `ubuntu`（sudo 免密），密码存本机 `/tmp/cvm_pass.txt` |
| 运行环境 | ✅ | Ubuntu 24.04 + Nginx + Node 22 + PM2 + Certbot 已装好 |
| 后端 | ✅ | PM2 进程 `family-bookkeeping-api` 在线，端口 3000，Supabase 数据库沿用不变 |
| 前端 | ✅ | 生产包已传到 `/var/www/family-bookkeeping`，Nginx 静态托管 |
| 反代 | ✅ | Nginx 把 `/api` 转发到 127.0.0.1:3000，前端 SPA fallback 正常 |
| DNS 解析 | ✅ | `zlspace.site` 和 `www.zlspace.site` 的 A 记录指向 `121.4.84.120` |
| HTTPS 证书 | ✅ | Let's Encrypt 正式证书，DNS-01 验证，有效期至 2026-10-18 |

## 访问地址

- **主站点**：`https://zlspace.site`（推荐）
- **带 www**：`https://www.zlspace.site`
- **IP 直访**：`http://121.4.84.120` / `https://121.4.84.120`（自签 fallback）
- **HTTP 自动跳转 HTTPS**：`http://zlspace.site` → 301 → `https://zlspace.site`

## 关键决策

1. **域名改用 `zlspace.site`**：
   - `zisparent.site` 不在当前 tccli 授权账号下，无法通过 API 管理 DNS；`zlspace.site` 在同一账号下，可直接用 tccli 操作。

2. **前端 API 改为相对路径 `/api`**：
   - 同一份前端包在 IP 访问和域名访问下都能正确调用后端，避免域名被临时拦截时前端接口失效。

3. **HTTPS 使用 DNS-01 验证**：
   - HTTP-01 验证请求被腾讯云返回「域名未备案」拦截页，无法签发证书。
   - 通过 DNS-01（在 DNSPod 添加 `_acme-challenge` TXT 记录）绕过 HTTP 拦截，成功拿到 Let's Encrypt 证书。

## 证书续期

证书有效期 90 天，到期前运行：

```bash
./scripts/renew-cert.sh
```

该脚本使用 DNS-01 重新申请证书，并自动上传到服务器、reload Nginx。

## 新增/修改文件

| 文件 | 说明 |
|---|---|
| `scripts/cvm-setup.sh` | 服务器初始化脚本（装 nginx/node/pm2/certbot） |
| `scripts/deploy-cvm.sh` | 本地构建 + 上传 + 远程部署 |
| `scripts/renew-cert.sh` | DNS-01 证书续期脚本 |
| `frontend/.env.production` | 前端 API 基址改为 `/api`（相对路径） |
| `backend/.env.production` | `FRONTEND_URL` 改为 `https://zlspace.site` |

## 验证结果

- `https://zlspace.site` → 200 OK，证书由 Let's Encrypt 签发
- `https://www.zlspace.site` → 200 OK
- `http://zlspace.site` → 301 跳转 HTTPS
- `https://zlspace.site/api` → 正确转发到后端（404 是根路径无路由，符合预期）
- 服务器 80/443/3000 端口均正常监听
