#!/usr/bin/env bash
set -euo pipefail

# ==============================
# 后端部署脚本 — family-bookkeeping
# 构建 + 部署到 CloudBase Run
# ==============================

ENV_ID="family-bookkeeping-d7c9caa78340e"
SERVICE_NAME="family-bookkeeping-api-prod"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔨 1/3 构建后端..."
cd "$PROJECT_ROOT/backend"
npm run build:prod

echo "📦 2/3 部署到 CloudBase Run..."
echo "No" | tcb cloudrun deploy \
  --serviceName "$SERVICE_NAME" \
  --port 3000 \
  --source "$PROJECT_ROOT" \
  --force

echo "✅ 3/3 部署完成！"
echo "后端地址: https://$SERVICE_NAME-259958-6-1305761531.sh.run.tcloudbase.com"
echo "部署进度可查看: https://tcb.cloud.tencent.com/dev?envId=$ENV_ID#/platform-run/service/detail?serverName=$SERVICE_NAME&tabId=deploy&envId=$ENV_ID"
