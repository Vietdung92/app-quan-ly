#!/bin/bash
# =====================================================
# Cập nhật phiên bản mới - chạy khi có code mới
# Cách dùng: từ thư mục dự án mới, chạy: sudo bash deploy/update.sh
# Không đụng vào database và .env hiện có.
# =====================================================

set -e
APP_DIR=/var/www/app-quanly

if [ ! -f "backend/server.js" ] || [ ! -f "app/package.json" ]; then
  echo "❌ Chạy script từ thư mục gốc dự án mới (nơi có backend/ và app/)"
  exit 1
fi

echo "▶ [1/3] Cập nhật backend (giữ nguyên .env + database)..."
rsync -a --exclude '.env' --exclude 'node_modules' backend/ $APP_DIR/backend/
cd $APP_DIR/backend && npm install --omit=dev --silent

echo "▶ [2/3] Build lại frontend..."
cd - > /dev/null
rsync -a --exclude 'node_modules' --exclude 'dist' app/ $APP_DIR/app-src/
cd $APP_DIR/app-src && npm install --silent && npx vite build --logLevel error
rm -rf $APP_DIR/dist && cp -r dist $APP_DIR/dist

echo "▶ [3/3] Khởi động lại backend..."
pm2 restart app-quanly-api

echo "✅ Cập nhật xong!"
