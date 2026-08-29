#!/bin/bash
# =====================================================
# Bật HTTPS miễn phí (Let's Encrypt) - chạy SAU install.sh
# Điều kiện: tên miền đã trỏ về IP của VPS này
#
# Cách dùng: sudo bash deploy/enable-https.sh ten-mien-cua-ban.com
# =====================================================

set -e
DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "❌ Thiếu tên miền. Cách chạy: sudo bash deploy/enable-https.sh ten-mien-cua-ban.com"
  exit 1
fi

echo "▶ Cài certbot..."
apt-get install -y -qq certbot python3-certbot-nginx > /dev/null

echo "▶ Xin chứng chỉ SSL cho $DOMAIN (certbot sẽ hỏi email của bạn)..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect

echo ""
echo "✅ HTTPS đã bật! Mở thử: https://$DOMAIN"
echo "   Chứng chỉ tự gia hạn mỗi 90 ngày, không cần làm gì thêm."
