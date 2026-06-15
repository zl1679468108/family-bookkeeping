#!/usr/bin/env bash
set -euo pipefail

# ==============================
# 前端部署脚本 — family-bookkeeping
# 构建 + 部署到 CloudBase Hosting
# ==============================

ENV_ID="family-bookkeeping-d7c9caa78340e"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔨 1/2 构建前端..."
cd "$PROJECT_ROOT/frontend"
npm run build:prod

echo "📦 2/2 部署到 CloudBase Hosting..."
tcb hosting deploy ./build --env-id "$ENV_ID" --yes

echo "✅ 部署完成！"
echo "前端地址: https://$ENV_ID-1305761531.tcloudbaseapp.com"
