#!/bin/bash
# ============================================
# 财猫家庭记账 - CVM 初始环境准备脚本（在目标服务器上以 ubuntu 用户执行）
# 安装：nginx / certbot / Node 22 / PM2，并创建应用目录
# ============================================
set -e
export DEBIAN_FRONTEND=noninteractive

echo ">>> update apt"
sudo apt-get update -y

echo ">>> install nginx, certbot"
sudo apt-get install -y nginx certbot python3-certbot-nginx curl

echo ">>> install Node 22 (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ">>> install pm2"
sudo npm install -g pm2

echo ">>> create app dirs"
sudo mkdir -p /var/www/family-bookkeeping /opt/family-bookkeeping/backend
sudo chown -R ubuntu:ubuntu /var/www/family-bookkeeping /opt/family-bookkeeping

echo ">>> versions"
node -v; npm -v; nginx -v; certbot --version; pm2 -v
echo ">>> setup done"
