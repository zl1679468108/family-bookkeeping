#!/usr/bin/env bash
set -euo pipefail

# ==============================
# 一键部署脚本 — family-bookkeeping
# 后端 CloudRun + 前端 Hosting
# 用法: bash scripts/deploy-all.sh
# ==============================

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="family-bookkeeping-api-prod"
ENV_ID="family-bookkeeping-d7c9caa78340e"
BACKEND_URL="https://family-bookkeeping-api-prod-259958-6-1305761531.sh.run.tcloudbase.com"
FRONTEND_URL="https://family-bookkeeping-d7c9caa78340e-1305761531.tcloudbaseapp.com"

# 颜色
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== 1/4 构建后端 ===${NC}"
cd "$PROJECT_ROOT/backend"
npm run build:prod

echo -e "${GREEN}=== 2/4 部署后端到 CloudRun ===${NC}"
cd "$PROJECT_ROOT"
npx mcporter call --stdio 'npx' --stdio-arg '@cloudbase/cloudbase-mcp@latest' --cwd "$PROJECT_ROOT" \
  manageCloudRun --args "{\"action\":\"deploy\",\"serverName\":\"$SERVICE_NAME\",\"targetPath\":\"backend\"}"

echo -e "${GREEN}=== 3/4 构建前端 ===${NC}"
cd "$PROJECT_ROOT/frontend"
npm run build:prod

echo -e "${GREEN}=== 4/4 部署前端到静态托管 ===${NC}"
cd "$PROJECT_ROOT"
npx mcporter call --stdio 'npx' --stdio-arg '@cloudbase/cloudbase-mcp@latest' --cwd "$PROJECT_ROOT" \
  manageHosting --args '{"action":"upload","localPath":"frontend/build","cloudPath":"/","ignore":["**/*.map"]}'

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo "后端 API: $BACKEND_URL"
echo "前端地址: $FRONTEND_URL?v=$(date +%Y%m%d%H)"
echo "控制台:   https://tcb.cloud.tencent.com/dev?envId=$ENV_ID#/platform-run"
