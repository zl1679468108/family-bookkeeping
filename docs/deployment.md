# 静记 部署手册 (Deployment Runbook)

本手册覆盖「静记」三端的部署：**后端 (NestJS)**、**前端 PC Web (React)**、**小程序 (Taro 微信 / H5)**。
生产环境统一跑在腾讯云 CVM（上海二区，公网 `121.4.84.120`），架构如下：

```
浏览器 / 微信
     │
     ├─ PC Web ──► Nginx (80/443, zlspace.site) ──► /var/www/family-bookkeeping (静态)
     │                                            └─ /api ──► 127.0.0.1:3000 (PM2: family-bookkeeping-api)
     │                                                                     │
     └─ 小程序 ──► https://zlspace.site/api ────────────────────────────────┘
                                                      │
                                               Supabase PostgreSQL (新加坡 ap-southeast-1)
```

---

## 0. 前置准备（一次性）

### 0.1 腾讯云授权（tccli）

```bash
# 浏览器 --browser no 流程，完成后按要求粘贴验证码
tccli auth login
# 凭证写入 ~/.tccli/default.credential
```

### 0.2 CVM 登录能力

- SSH 用户 `ubuntu`（sudo 免密）
- 密码重置过，存于本机 `/tmp/cvm_pass.txt`（部署脚本用 `SSH_OPTS` 透传参数）
- 建议把本机公钥加入服务器 `~/.ssh/authorized_keys`，避免每次输密码：

```bash
ssh-copy-id ubuntu@121.4.84.120
```

### 0.3 DNS（已在 DNSPod 配好，记录备查）

| 主机记录 | 类型 | 值 |
|---|---|---|
| `@` | A | `121.4.84.120` |
| `www` | A | `121.4.84.120` |

---

## 1. 服务器初始化（仅首次 / 重装后）

```bash
SERVER=121.4.84.120 USER=ubuntu ./scripts/cvm-setup.sh
```

该脚本会安装：Nginx、Node 22（via NodeSource）、PM2、Certbot，并创建：

- 前端目录 `/var/www/family-bookkeeping`
- 后端目录 `/opt/family-bookkeeping/backend`

> 已初始化过的机器无需重复执行。

---

## 2. 端一 + 端二：后端 & 前端 PC Web → CVM

两个端用同一个一键脚本部署（前端依赖后端 API，通常一起发）。

### 2.1 一键部署

```bash
SERVER=121.4.84.120 USER=ubuntu ./scripts/deploy-cvm.sh
```

脚本流程：

1. **本地构建**
   - 后端：`cd backend && npm run build:prod`
   - 前端：`cd frontend && REACT_APP_API_BASE_URL=/api npm run build:prod`
2. **打包**：`backend` 打 `dist`+`package*.json`+`nest-cli.json`；前端打 `build/`
3. **生成服务器 .env**：复制 `backend/.env.production`，把 `FRONTEND_URL` 改写为 `https://zlspace.site`
4. **上传**到 `/tmp/`
5. **远程部署**：解包后端 → `npm install --production` → `pm2 restart family-bookkeeping-api`；解包前端到 `/var/www/family-bookkeeping`

### 2.2 手动步骤（等价）

```bash
# 本机构建
cd backend && npm run build:prod
cd ../frontend && REACT_APP_API_BASE_URL=/api npm run build:prod

# 上传
tar -czf /tmp/backend.tar.gz -C backend dist package.json package-lock.json nest-cli.json
tar -czf /tmp/frontend.tar.gz -C frontend/build .
scp /tmp/backend.tar.gz /tmp/frontend.tar.gz ubuntu@121.4.84.120:/tmp/

# 服务器上
ssh ubuntu@121.4.84.120
  sudo rm -rf /opt/family-bookkeeping/backend/* && mkdir -p /opt/family-bookkeeping/backend
  tar -xzf /tmp/backend.tar.gz -C /opt/family-bookkeeping/backend
  # 把 backend/.env.production 复制为 /opt/family-bookkeeping/backend/.env（FRONTEND_URL=https://zlspace.site）
  cd /opt/family-bookkeeping/backend && npm install --production
  pm2 delete family-bookkeeping-api 2>/dev/null || true
  pm2 start npm --name family-bookkeeping-api -- run start:prod
  pm2 save

  sudo rm -rf /var/www/family-bookkeeping/* && mkdir -p /var/www/family-bookkeeping
  tar -xzf /tmp/frontend.tar.gz -C /var/www/family-bookkeeping
```

### 2.3 Nginx 关键点

`/etc/nginx/sites-available/zlspace.site.conf`（已部署，记录备查）：

- 监听 `80` 与 `443`
- `/api` → `proxy_pass http://127.0.0.1:3000`，并转发 `Host` / `Authorization` 等头
- 前端为 SPA：`try_files $uri $uri/ /index.html`
- HTTP `80` 全量 `return 301 https://$host$request_uri`

### 2.4 进程 / 日志

```bash
pm2 list                                   # 进程状态
pm2 logs family-bookkeeping-api           # 后端日志
pm2 restart family-bookkeeping-api        # 改了 .env 后重启
sudo systemctl reload nginx               # 改了 Nginx 后 reload
sudo nginx -t                              # 配置语法检查
```

---

## 3. 端三：小程序 Taro（微信 / H5）

小程序不像 Web 那样"上传到 CVM"——微信端产物需经**微信开发者工具**上传发布；H5 端可部署到 CVM。

### 3.1 一键构建

```bash
# 默认：构建微信(dist-prod/) + H5(dist-prod/)
./scripts/deploy-taro.sh

# 仅微信
TARGET=weapp ./scripts/deploy-taro.sh

# 仅 H5 并上传到 CVM（需先有 /taro 的 Nginx 位置，见 3.4）
TARGET=h5 SERVER=121.4.84.120 USER=ubuntu ./scripts/deploy-taro.sh
```

> 生产构建 `TARO_APP_API_BASE_URL` 已固化为 `https://zlspace.site/api`（脚本内设置）。
> 微信产物在 `taro/dist-prod/`，用微信开发者工具打开该目录 → 上传 → 提交审核发布。

### 3.2 手动构建

```bash
cd taro
# 微信小程序（生产，输出 dist-prod/）
TARO_APP_API_BASE_URL=https://zlspace.site/api npm run build:weapp
# H5（生产，输出 dist-prod/）
TARO_APP_API_BASE_URL=https://zlspace.site/api npm run build:h5
```

> ⚠️ 构建目录隔离：`dev:*` → `dist/`（微信开发者工具指向它），`build:*` → `dist-prod/`（上传用）。勿同时跑。

### 3.3 微信端发布

1. 微信开发者工具 → 导入项目 → 目录选 `taro/dist-prod/`
2. 填 AppID（项目自有），上传代码
3. 微信公众平台 → 版本管理 → 提交审核 → 发布

### 3.4 H5 部署到 CVM（可选）

H5 产物 `publicPath` 为 `/`，建议用**独立子域名**或**站点根**托管。若放到子路径需改 `taro/config/index.ts` 的 `h5.publicPath`。

上传到服务器（脚本已做）：

```bash
tar -czf /tmp/taro-h5.tar.gz -C taro/dist-prod .
scp /tmp/taro-h5.tar.gz ubuntu@121.4.84.120:/tmp/
ssh ubuntu@121.4.84.120 'sudo rm -rf /var/www/family-bookkeeping-taro/* && sudo mkdir -p /var/www/family-bookkeeping-taro && sudo tar xzf /tmp/taro-h5.tar.gz -C /var/www/family-bookkeeping-taro'
```

Nginx 增加 server（独立子域 `taro.zlspace.site`，需先在 DNSPod 加 A 记录）：

```nginx
server {
    listen 443 ssl;
    server_name taro.zlspace.site;
    ssl_certificate     /etc/letsencrypt/live/zlspace.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zlspace.site/privkey.pem;
    root /var/www/family-bookkeeping-taro;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

---

## 4. HTTPS 证书（Let's Encrypt，DNS-01 验证）

CVM 在上海（大陆机房），**HTTP-01 验证被腾讯云「域名未备案」拦截**，因此证书只能用 **DNS-01**（给 DNSPod 加 `_acme-challenge` TXT 记录，CA 查 DNS 发证书，不访问服务器）。

### 4.1 续期（一键）

```bash
./scripts/renew-cert.sh          # 默认 DOMAIN=zlspace.site, SERVER=121.4.84.120
```

脚本会：本地 certbot DNS-01 申请 → 上传证书到 `/etc/letsencrypt/live/zlspace.site/` → reload Nginx。
证书有效期 **90 天**，建议到期前 ~30 天运行（可加 crontab）。

### 4.2 备案说明

证书虽已签发，但** ICP 网站备案仍建议补做**（域名 `zlspace.site` 在当前腾讯云账号，流程最顺）。
备案前若腾讯云对普通访问也加强拦截，站点可能不稳定。备案在腾讯云「备案」系统本人操作（需身份证/人脸），agent 无法代劳。

---

## 5. 验证清单

部署后逐项确认：

- [ ] `https://zlspace.site` → 200，地址栏有锁标（Let's Encrypt）
- [ ] `http://zlspace.site` → 301 跳转 HTTPS
- [ ] `https://zlspace.site/api` → 转发到后端（根路径 404 JSON 属正常）
- [ ] `pm2 list` → `family-bookkeeping-api` 在线
- [ ] `sudo ss -ltnp | grep -E ':80|:443|:3000'` → 三端口均监听
- [ ] 前端能注册 / 登录 / 记账 / 看报表
- [ ] 小程序：`taro/dist-prod/` 已构建且 API 基址为 `https://zlspace.site/api`
- [ ] 证书到期日：`openssl s_client -connect zlspace.site:443 -servername zlspace.site 2>/dev/null | openssl x509 -noout -dates`

---

## 6. 回滚与故障

| 现象 | 排查 |
|---|---|
| 502 Bad Gateway | 后端刚重启在连 Supabase，等 10s 再试；`pm2 logs` 看报错 |
| 接口 CORS 报错 | 后端 `FRONTEND_URL` 是否含当前域名；改后 `pm2 restart` |
| 证书过期 / 失效 | 跑 `./scripts/renew-cert.sh` |
| 前端白屏 | `curl http://121.4.84.120/` 看是否返回 HTML；查 Nginx `error.log` |
| DNS 不生效 | `dig +short zlspace.site` 确认指向 `121.4.84.120` |
