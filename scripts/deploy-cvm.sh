#!/bin/bash
# ============================================
# 财猫家庭记账 - 腾讯云 CVM 一键部署脚手架
#   后端 (Node + PM2) + 前端 PC Web (Nginx 静态托管)
#
# 适用：已有一台腾讯云 CVM（Ubuntu 20.04/22.04/24.04），公网可访问。
# 前置：
#   1. 已通过 tccli auth login 授权（或已有 SSH 访问能力）
#   2. 已设置实例登录密码 / 绑定 SSH 密钥
#   3. 本机安装 node/npm（用于本地构建）
#   4. 目标服务器已执行 scripts/cvm-setup.sh（装 nginx/certbot/node/pm2）
#
# 用法：
#   SERVER=121.4.84.120 REMOTE_USER=ubuntu ./scripts/deploy-cvm.sh
#
# 说明：
#   - 后端密钥真相源是 backend/.env.production，部署时会复制为服务器上的
#     /opt/family-bookkeeping/backend/.env，并把 FRONTEND_URL 改成本域名。
#   - 前端用 VITE_API_BASE_URL 覆盖为相对路径 /bookkeeping/api 后本地构建（Vite 产物 dist/）
#     （同源，IP/域名通用）。子路径由 vite.config base=/bookkeeping/ 控制静态资源前缀。
#   - 传输用 scp/ssh，建议提前把本机公钥放进服务器 ~/.ssh/authorized_keys，
#     避免每次输密码（本脚本用 $SSH_OPTS 透传参数）。
#   - 子路径部署：本项目挂在 https://$DOMAIN/bookkeeping/，接口 /bookkeeping/api；
#     后续其他项目可占用各自独立子路径（/blog/、/other/ 等），互不冲突。
# ============================================
set -euo pipefail

SERVER="${SERVER:-121.4.84.120}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
DOMAIN="${DOMAIN:-zlspace.site}"
SSH_OPTS="${SSH_OPTS:- -o StrictHostKeyChecking=no}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_BACKEND="/opt/family-bookkeeping/backend"
REMOTE_FRONTEND="/var/www/family-bookkeeping"
# 子路径（不带首尾斜杠），可用 SUBPATH=xxx 覆盖
SUBPATH="${SUBPATH:-bookkeeping}"
NGINX_LOCAL="$ROOT_DIR/config/nginx/zlspace.site.conf"

echo "=== [1/4] 本地构建 ==="
( cd "$ROOT_DIR/backend" && npm run build:prod )
( cd "$ROOT_DIR/frontend" && VITE_API_BASE_URL="/$SUBPATH/api" npm run build:prod )

echo "=== [2/4] 打包 ==="
rm -f /tmp/backend.tar.gz /tmp/frontend.tar.gz
# 禁用 macOS 扩展属性/AppleDouble(._) 归档，避免 bsdtar 在 build/ 上报错
( cd "$ROOT_DIR/backend" && COPYFILE_DISABLE=1 tar --format=ustar --no-mac-metadata -czf /tmp/backend.tar.gz dist package.json package-lock.json nest-cli.json )
( cd "$ROOT_DIR/frontend" && COPYFILE_DISABLE=1 tar --format=ustar --no-mac-metadata -czf /tmp/frontend.tar.gz -C dist . )

# 生成服务器用 .env（覆盖 FRONTEND_URL）
grep -v '^FRONTEND_URL=' "$ROOT_DIR/backend/.env.production" > /tmp/backend.env
echo "FRONTEND_URL=https://$DOMAIN" >> /tmp/backend.env

echo "=== [3/4] 上传 ==="
scp $SSH_OPTS /tmp/backend.tar.gz /tmp/frontend.tar.gz /tmp/backend.env "$NGINX_LOCAL" "$REMOTE_USER@$SERVER:/tmp/"

echo "=== [4/4] 远程部署 ==="
ssh $SSH_OPTS "$REMOTE_USER@$SERVER" bash -s <<REMOTE
  set -e
  sudo rm -rf $REMOTE_BACKEND/* && mkdir -p $REMOTE_BACKEND
  sudo tar -xzf /tmp/backend.tar.gz -C $REMOTE_BACKEND
  sudo mv /tmp/backend.env $REMOTE_BACKEND/.env
  cd $REMOTE_BACKEND && npm install --production --no-audit --no-fund 2>&1 | tail -3
  pm2 delete family-bookkeeping-api 2>/dev/null || true
  pm2 start npm --name family-bookkeeping-api -- run start:prod
  pm2 save

  sudo rm -rf $REMOTE_FRONTEND/* && mkdir -p $REMOTE_FRONTEND
  sudo tar -xzf /tmp/frontend.tar.gz -C $REMOTE_FRONTEND

  # 安装子路径版 nginx 配置（覆盖旧的 sites-available 配置，sites-enabled 软链自动生效）
  sudo cp /tmp/zlspace.site.conf /etc/nginx/sites-available/zlspace.site.conf
  sudo nginx -t
  sudo systemctl reload nginx
REMOTE

echo "=== 完成 ==="
echo "后端:  http://$SERVER:3000 (PM2: family-bookkeeping-api)"
echo "前端:  http://$SERVER/$SUBPATH/"
echo "域名:  已配置 $DOMAIN -> $SERVER"
echo "访问:  https://$DOMAIN/$SUBPATH/"
echo ""
echo "注意：CVM 在上海（大陆机房），HTTP 验证可能被腾讯云「未备案」拦截。"
echo "若 certbot --nginx 失败，请使用 DNS-01 验证脚本："
echo "  ./scripts/renew-cert.sh"
echo ""
echo "证书续期：证书有效期 90 天，到期前运行 ./scripts/renew-cert.sh"
