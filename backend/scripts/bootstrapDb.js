/**
 * Database Bootstrap
 * Path: scripts/bootstrapDb.js
 *
 * Tự khởi tạo database khi server chạy lần đầu (dùng cho Render/Neon demo,
 * nơi không tiện chạy psql thủ công):
 * - Nếu bảng `users` chưa tồn tại → chạy schema.sql (thay __BCRYPT_HASH__
 *   bằng hash của mật khẩu mặc định hcare123)
 * - Sau đó luôn chạy các file migrations/*.sql theo thứ tự
 *   (mỗi file tự an toàn khi chạy lại: IF NOT EXISTS / guard chống trùng)
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function bootstrapDb() {
  // 1. Schema chính (chỉ chạy khi DB trống)
  const existing = await pool.query(`SELECT to_regclass('public.users') AS t`);
  if (!existing.rows[0].t) {
    console.log('🔧 Database trống — đang khởi tạo schema + dữ liệu mẫu...');
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    const hash = bcrypt.hashSync('hcare123', 10);
    schema = schema.split('__BCRYPT_HASH__').join(hash);
    await pool.query(schema);
    console.log('✅ Schema + dữ liệu mẫu đã tạo (đăng nhập: quanly@hcare.com / hcare123)');
  }

  // 2. Migrations (an toàn khi chạy lại)
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      try {
        await pool.query(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
        console.log(`✅ Migration ${file}`);
      } catch (err) {
        // Migration 003 có guard RAISE EXCEPTION khi dữ liệu đã import — đây là bình thường
        if (String(err.message).includes('already imported')) {
          console.log(`⏭  ${file}: dữ liệu đã có, bỏ qua`);
        } else {
          console.error(`⚠️  ${file}:`, err.message);
        }
      }
    }
  }
}

module.exports = { bootstrapDb };
