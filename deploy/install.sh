#!/bin/bash
# =====================================================
# Script cài đặt tự động - App Quản Lý Công Ty
# Chạy trên Ubuntu 22.04/24.04 VPS mới (với quyền root)
#
# Cách dùng:
#   1. Upload cả thư mục dự án lên VPS (xem HUONG_DAN_TRIEN_KHAI.md)
#   2. cd vào thư mục dự án
#   3. sudo bash deploy/install.sh ten-mien-cua-ban.com
# =====================================================

set -e  # Dừng ngay khi có lỗi

DOMAIN=$1
REPO_DIR=$(pwd)
APP_DIR=/var/www/app-quanly
DB_NAME=app_quanly_conty
DB_USER=app_user

if [ -z "$DOMAIN" ]; then
  echo "❌ Thiếu tên miền. Cách chạy: sudo bash deploy/install.sh ten-mien-cua-ban.com"
  exit 1
fi

if [ ! -f "backend/server.js" ] || [ ! -f "app/package.json" ]; then
  echo "❌ Chạy script từ thư mục gốc dự án (nơi có thư mục backend/ và app/)"
  exit 1
fi

echo "======================================"
echo "  Cài đặt App Quản Lý Công Ty"
echo "  Tên miền: $DOMAIN"
echo "======================================"

# ===== 1. Cài phần mềm nền =====
echo ""
echo "▶ [1/7] Cài Node.js 20, PostgreSQL, nginx..."
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates > /dev/null

# Node.js 20 từ NodeSource
if ! command -v node > /dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt-get install -y -qq nodejs > /dev/null
fi
apt-get install -y -qq postgresql nginx > /dev/null
npm install -g pm2 --silent

echo "  ✓ Node $(node -v), PostgreSQL, nginx, PM2"

# ===== 2. Tạo database =====
echo ""
echo "▶ [2/7] Tạo database..."
DB_PASS=$(openssl rand -hex 16)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres createdb -O $DB_USER $DB_NAME
echo "  ✓ Database $DB_NAME (user: $DB_USER)"

# ===== 3. Copy code =====
echo ""
echo "▶ [3/7] Copy code vào $APP_DIR..."
mkdir -p $APP_DIR /var/log/app-quanly
cp -r backend $APP_DIR/
cp -r app $APP_DIR/app-src
cp deploy/ecosystem.config.js $APP_DIR/backend/
echo "  ✓ Đã copy"

# ===== 4. Cài đặt backend =====
echo ""
echo "▶ [4/7] Cài đặt backend + seed database..."
cd $APP_DIR/backend
npm install --omit=dev --silent

# Tạo .env nếu chưa có (giữ nguyên nếu cài lại)
if [ ! -f .env ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  cat > .env <<EOF
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://$DOMAIN
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF
  echo "  ✓ Đã tạo .env (mật khẩu DB và JWT secret ngẫu nhiên)"

  # Seed schema với mật khẩu mặc định hcare123
  HASH=$(node -e "console.log(require('bcryptjs').hashSync('hcare123', 10))")
  sed "s|__BCRYPT_HASH__|$HASH|g" schema.sql > /tmp/schema_seeded.sql
  PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f /tmp/schema_seeded.sql > /dev/null
  rm /tmp/schema_seeded.sql
  echo "  ✓ Đã import schema + dữ liệu mẫu (đăng nhập: quanly@hcare.com / hcare123)"
else
  echo "  ✓ Giữ nguyên .env và database hiện có (cài lại)"
fi

# Chạy migrations (an toàn với DB đang có dữ liệu - dùng IF NOT EXISTS)
if [ -d migrations ]; then
  DB_PASS_CURRENT=$(grep '^DB_PASSWORD=' .env | cut -d= -f2)
  for m in migrations/*.sql; do
    PGPASSWORD=$DB_PASS_CURRENT psql -h localhost -U $DB_USER -d $DB_NAME -f "$m" > /dev/null 2>&1 || true
  done
  echo "  ✓ Đã chạy migrations"
fi

# ===== 5. Build frontend =====
echo ""
echo "▶ [5/7] Build frontend..."
cd $APP_DIR/app-src
npm install --silent
npx vite build --logLevel error
rm -rf $APP_DIR/dist
cp -r dist $APP_DIR/dist
echo "  ✓ Frontend build xong → $APP_DIR/dist"

# ===== 6. Cấu hình nginx =====
echo ""
echo "▶ [6/7] Cấu hình nginx..."
cd "$REPO_DIR"
sed "s|ten-mien-cua-ban.com|$DOMAIN|g" "$REPO_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/app-quanly
ln -sf /etc/nginx/sites-available/app-quanly /etc/nginx/sites-enabled/app-quanly
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "  ✓ nginx đã cấu hình cho $DOMAIN"

# ===== 7. Khởi động backend bằng PM2 =====
echo ""
echo "▶ [7/7] Khởi động backend (PM2)..."
cd $APP_DIR/backend
pm2 start ecosystem.config.js 2> /dev/null || pm2 restart app-quanly-api
pm2 save > /dev/null
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
echo "  ✓ Backend chạy 24/7, tự khởi động khi reboot"

echo ""
echo "======================================"
echo "  ✅ CÀI ĐẶT XONG!"
echo "======================================"
echo ""
echo "  Mở thử:  http://$DOMAIN"
echo "  Đăng nhập: quanly@hcare.com / hcare123"
echo ""
echo "  ⚠️ VIỆC CẦN LÀM NGAY:"
echo "  1. Đổi mật khẩu tài khoản quanly ngay sau khi đăng nhập"
echo "  2. Bật HTTPS (bắt buộc): sudo bash deploy/enable-https.sh $DOMAIN"
echo "  3. Bật Telegram (tùy chọn): sửa TELEGRAM_* trong $APP_DIR/backend/.env"
echo "     rồi chạy: pm2 restart app-quanly-api"
echo ""
