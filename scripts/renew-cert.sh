#!/bin/bash
# ============================================
# 静记 - 续期 Let's Encrypt 证书（DNS-01 验证，绕过 ICP 拦截）
#
# 背景：CVM 在上海（大陆机房），HTTP 验证被腾讯云「未备案」拦截，
# 因此使用 DNS-01 验证（通过 DNSPod 加 TXT 记录），无需 CA 访问服务器。
#
# 前置：
#   1. 已通过 tccli auth login 授权（DNSPod 可操作 zlspace.site）
#   2. 本机已安装 certbot
#   3. 服务器已部署 scripts/cvm-setup.sh 和 scripts/deploy-cvm.sh
#
# 用法：
#   ./scripts/renew-cert.sh
#   或
#   SERVER=121.4.84.120 REMOTE_USER=ubuntu TCCLI_BIN=/path/to/tccli CERTBOT_BIN=/path/to/certbot ./scripts/renew-cert.sh
#
# 建议：证书有效期 90 天，在到期前 30 天左右运行一次（可加入 crontab）。
# ============================================
set -euo pipefail

SERVER="${SERVER:-121.4.84.120}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
DOMAIN="${DOMAIN:-zlspace.site}"
SSH_OPTS="${SSH_OPTS:- -o StrictHostKeyChecking=no}"

# 定位 tccli / certbot：优先用 PATH 或环境变量，再回退到常见 venv 路径
TCCLI_BIN="${TCCLI_BIN:-$(command -v tccli 2>/dev/null || true)}"
CERTBOT_BIN="${CERTBOT_BIN:-$(command -v certbot 2>/dev/null || true)}"
[ -x "$TCCLI_BIN" ] || TCCLI_BIN="/Users/zhaolong/.workbuddy/binaries/python/envs/tccli/bin/tccli"
[ -x "$CERTBOT_BIN" ] || CERTBOT_BIN="/Users/zhaolong/.workbuddy/binaries/python/envs/certbot/bin/certbot"

if [ ! -x "$TCCLI_BIN" ]; then
  echo "tccli not found. 请授权：tccli auth login"
  echo "或设置 TCCLI_BIN=/path/to/tccli"
  exit 1
fi

if [ ! -x "$CERTBOT_BIN" ]; then
  echo "certbot not found. 请安装：pip install certbot"
  echo "或设置 CERTBOT_BIN=/path/to/certbot"
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 2>/dev/null || command -v python 2>/dev/null)}"
if [ ! -x "$PYTHON_BIN" ]; then
  echo "python not found"
  exit 1
fi

CERT_DIR="/tmp/letsencrypt-config"
HOOK_DIR="/tmp/certbot-hooks"

echo "tccli: $TCCLI_BIN"
echo "certbot: $CERTBOT_BIN"

# 生成 DNS 验证钩子
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/auth.sh" <<EOF
#!/bin/bash
set -e
TC="$TCCLI_BIN"
PY="$PYTHON_BIN"

if [ "\$CERTBOT_DOMAIN" = "$DOMAIN" ]; then
  SUBDOMAIN="_acme-challenge"
elif [ "\$CERTBOT_DOMAIN" = "www.$DOMAIN" ]; then
  SUBDOMAIN="_acme-challenge.www"
else
  echo "Unknown domain: \$CERTBOT_DOMAIN" >&2
  exit 1
fi

echo "[auth] Adding TXT record for \$CERTBOT_DOMAIN: \$SUBDOMAIN -> \$CERTBOT_VALIDATION"

RECORD_ID=\$(\$TC dnspod DescribeRecordList --Domain $DOMAIN | \$PY -c "
import sys, json
d = json.load(sys.stdin)
for r in d.get('RecordList', []):
    if r.get('Name') == '\$SUBDOMAIN' and r.get('Type') == 'TXT':
        print(r.get('RecordId'))
        sys.exit(0)
print('NOT_FOUND')")
if [ "\$RECORD_ID" != "NOT_FOUND" ] && [ -n "\$RECORD_ID" ]; then
  echo "[auth] Removing stale record \$RECORD_ID"
  \$TC dnspod DeleteRecord --Domain $DOMAIN --RecordId "\$RECORD_ID" || true
  sleep 2
fi

\$TC dnspod CreateRecord --Domain $DOMAIN --SubDomain "\$SUBDOMAIN" --RecordType TXT --RecordLine 默认 --Value "\$CERTBOT_VALIDATION" --TTL 600
echo "[auth] Waiting 60s for DNS propagation..."
sleep 60
EOF

cat > "$HOOK_DIR/cleanup.sh" <<EOF
#!/bin/bash
set -e
TC="$TCCLI_BIN"
PY="$PYTHON_BIN"

if [ "\$CERTBOT_DOMAIN" = "$DOMAIN" ]; then
  SUBDOMAIN="_acme-challenge"
elif [ "\$CERTBOT_DOMAIN" = "www.$DOMAIN" ]; then
  SUBDOMAIN="_acme-challenge.www"
else
  echo "Unknown domain: \$CERTBOT_DOMAIN" >&2
  exit 1
fi

echo "[cleanup] Removing TXT record for \$CERTBOT_DOMAIN: \$SUBDOMAIN"
RECORD_ID=\$(\$TC dnspod DescribeRecordList --Domain $DOMAIN | \$PY -c "
import sys, json
d = json.load(sys.stdin)
for r in d.get('RecordList', []):
    if r.get('Name') == '\$SUBDOMAIN' and r.get('Type') == 'TXT':
        print(r.get('RecordId'))
        sys.exit(0)
print('NOT_FOUND')")
if [ "\$RECORD_ID" != "NOT_FOUND" ] && [ -n "\$RECORD_ID" ]; then
  \$TC dnspod DeleteRecord --Domain $DOMAIN --RecordId "\$RECORD_ID" || true
  echo "[cleanup] Deleted record \$RECORD_ID"
else
  echo "[cleanup] Record not found"
fi
EOF

chmod +x "$HOOK_DIR/auth.sh" "$HOOK_DIR/cleanup.sh"

# 清理旧的本地 certbot 目录，重新申请
rm -rf "$CERT_DIR" "${CERT_DIR}-work" "${CERT_DIR}-logs"

echo "=== 申请/续期证书 ==="
"$CERTBOT_BIN" certonly \
  --manual --preferred-challenges dns \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --manual-auth-hook "$HOOK_DIR/auth.sh" \
  --manual-cleanup-hook "$HOOK_DIR/cleanup.sh" \
  --config-dir "$CERT_DIR" \
  --work-dir "${CERT_DIR}-work" \
  --logs-dir "${CERT_DIR}-logs" \
  --non-interactive --agree-tos --register-unsafely-without-email

if [ ! -f "$CERT_DIR/live/$DOMAIN/fullchain.pem" ] || [ ! -f "$CERT_DIR/live/$DOMAIN/privkey.pem" ]; then
  echo "证书文件未生成成功"
  exit 1
fi

echo "=== 上传到服务器 ==="
scp $SSH_OPTS "$CERT_DIR/live/$DOMAIN/fullchain.pem" "$REMOTE_USER@$SERVER:/tmp/fullchain.pem"
scp $SSH_OPTS "$CERT_DIR/live/$DOMAIN/privkey.pem" "$REMOTE_USER@$SERVER:/tmp/privkey.pem"

echo "=== 安装并 reload nginx ==="
ssh $SSH_OPTS "$REMOTE_USER@$SERVER" bash -s <<REMOTE
  set -e
  sudo mkdir -p /etc/letsencrypt/live/$DOMAIN
  sudo mv /tmp/fullchain.pem /etc/letsencrypt/live/$DOMAIN/fullchain.pem
  sudo mv /tmp/privkey.pem /etc/letsencrypt/live/$DOMAIN/privkey.pem
  sudo chmod 644 /etc/letsencrypt/live/$DOMAIN/fullchain.pem
  sudo chmod 600 /etc/letsencrypt/live/$DOMAIN/privkey.pem
  sudo nginx -t
  sudo systemctl reload nginx
REMOTE

echo "=== 完成 ==="
echo "证书已更新：/etc/letsencrypt/live/$DOMAIN/"
echo "请访问 https://$DOMAIN 验证"
