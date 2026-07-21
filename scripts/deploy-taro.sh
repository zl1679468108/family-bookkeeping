#!/bin/bash
# ============================================
# 静记 - Taro 小程序一键构建 / 部署
#   微信小程序 (weapp) + 可选 H5 上传到 CVM
#
# 说明：
#   - Taro 的 TARO_APP_API_BASE_URL 在【构建时】固化，生产必须指向公网。
#     本脚本默认生产基址为 https://zlspace.site/api（可用 API_BASE 覆盖）。
#   - 微信端产物需经微信开发者工具上传发布（无法纯脚本发布），脚本只负责构建。
#   - H5 端可一键上传到 CVM（默认 /var/www/family-bookkeeping-taro），
#     需服务器 Nginx 已配置对应 server（见 docs/deployment.md 3.4）。
#
# 用法：
#   ./scripts/deploy-taro.sh                 # 构建 weapp + h5
#   TARGET=weapp ./scripts/deploy-taro.sh    # 仅微信小程序
#   TARGET=h5 SERVER=121.4.84.120 REMOTE_USER=ubuntu ./scripts/deploy-taro.sh   # 仅 H5 并上传
#
# 构建目录隔离（taro/config/index.ts）：
#   dev:*  -> dist/      （微信开发者工具开发指向此）
#   build:* -> dist-prod/（上传/发布用，独立目录）
# ============================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${TARGET:-all}"                 # all | weapp | h5
API_BASE="${API_BASE:-https://zlspace.site/api}"
SERVER="${SERVER:-121.4.84.120}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
SSH_OPTS="${SSH_OPTS:- -o StrictHostKeyChecking=no}"
REMOTE_H5="/var/www/family-bookkeeping-taro"

cd "$ROOT_DIR/taro"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "weapp" ]; then
  echo "=== [weapp] 生产构建 (build:weapp -> dist-prod/) ==="
  TARO_APP_API_BASE_URL="$API_BASE" npm run build:weapp
  echo "✅ 微信小程序产物: taro/dist-prod/"
  echo "   请用微信开发者工具打开该目录 → 上传 → 微信公众平台提交审核发布。"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "h5" ]; then
  echo "=== [h5] 生产构建 (build:h5 -> dist-prod/) ==="
  TARO_APP_API_BASE_URL="$API_BASE" npm run build:h5
  echo "✅ H5 产物: taro/dist-prod/"

  if [ -n "${SERVER:-}" ] && [ "${UPLOAD:-1}" != "0" ]; then
    echo "=== [h5] 上传到 CVM: $REMOTE_USER@$SERVER:$REMOTE_H5 ==="
    tar -czf /tmp/taro-h5.tar.gz -C dist-prod .
    scp $SSH_OPTS /tmp/taro-h5.tar.gz "$REMOTE_USER@$SERVER:/tmp/"
    ssh $SSH_OPTS "$REMOTE_USER@$SERVER" bash -s <<REMOTE
      set -e
      sudo rm -rf $REMOTE_H5/* && sudo mkdir -p $REMOTE_H5
      sudo tar xzf /tmp/taro-h5.tar.gz -C $REMOTE_H5
      echo "H5_DEPLOYED -> $REMOTE_H5"
REMOTE
    echo "✅ H5 已部署。若用独立子域，请确保 Nginx 已配置对应 server（见 docs/deployment.md 3.4）。"
  else
    echo "ℹ️  未指定 SERVER 或 UPLOAD=0，跳过 H5 上传。本地产物在 taro/dist-prod/。"
  fi
fi

echo "=== 完成 ==="
echo "API 基址: $API_BASE"
