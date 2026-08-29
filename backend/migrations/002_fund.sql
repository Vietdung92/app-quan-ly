-- =====================================================
-- Migration 002: Module Quỹ Thu Chi
-- Chạy an toàn trên database đang có dữ liệu (IF NOT EXISTS)
-- psql -U app_user -d app_quanly_conty -f migrations/002_fund.sql
-- =====================================================

-- Nhóm thu chi (Văn phòng, Dự án, QLCH - Căn hộ, Bán hàng, Nguồn vốn)
CREATE TABLE IF NOT EXISTS fund_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  kind VARCHAR(20) NOT NULL DEFAULT 'KinhDoanh' CHECK (kind IN ('KinhDoanh', 'NguonVon')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Đối tượng (căn hộ cụ thể, dự án cụ thể...)
CREATE TABLE IF NOT EXISTS fund_objects (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES fund_groups(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Đang hoạt động',
  UNIQUE (group_id, name)
);

-- Hạng mục thu/chi theo nhóm
CREATE TABLE IF NOT EXISTS fund_categories (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES fund_groups(id) ON DELETE CASCADE,
  type VARCHAR(3) NOT NULL CHECK (type IN ('Thu', 'Chi')),
  name VARCHAR(150) NOT NULL,
  UNIQUE (group_id, type, name)
);

-- Giao dịch thu chi
CREATE TABLE IF NOT EXISTS fund_transactions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30),                     -- Mã GDCT... từ hệ thống cũ (không bắt buộc unique)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(3) NOT NULL CHECK (type IN ('Thu', 'Chi')),
  group_id INTEGER NOT NULL REFERENCES fund_groups(id),
  object_id INTEGER REFERENCES fund_objects(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES fund_categories(id) ON DELETE SET NULL,
  amount NUMERIC(14, 0) NOT NULL CHECK (amount > 0),
  person VARCHAR(100),                  -- Người chi/nộp
  reimburse VARCHAR(15) CHECK (reimburse IN ('Đã hoàn', 'Chưa hoàn')),  -- NULL = không áp dụng
  notes TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fund_tx_date ON fund_transactions(date);
CREATE INDEX IF NOT EXISTS idx_fund_tx_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_tx_group ON fund_transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_fund_tx_object ON fund_transactions(object_id);

-- Chi cố định hằng tháng (thuê văn phòng...)
CREATE TABLE IF NOT EXISTS fund_recurring (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  group_id INTEGER NOT NULL REFERENCES fund_groups(id),
  object_id INTEGER REFERENCES fund_objects(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES fund_categories(id) ON DELETE SET NULL,
  amount NUMERIC(14, 0) NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  person VARCHAR(100),
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);
