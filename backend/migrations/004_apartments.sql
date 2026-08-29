-- =====================================================
-- Migration 004: Module Quản Lý Căn Hộ
-- Hồ sơ hợp đồng từng căn + theo dõi thu tiền thuê hàng tháng
-- Chạy an toàn trên DB có dữ liệu (IF NOT EXISTS)
-- =====================================================

-- Hồ sơ căn hộ (gắn với fund_objects nhóm "QLCH - Căn hộ")
CREATE TABLE IF NOT EXISTS apartment_details (
  object_id INTEGER PRIMARY KEY REFERENCES fund_objects(id) ON DELETE CASCADE,
  owner_name VARCHAR(100),          -- Chủ nhà
  owner_phone VARCHAR(20),
  tenant_name VARCHAR(100),         -- Khách thuê hiện tại
  tenant_phone VARCHAR(20),
  rent_amount NUMERIC(14, 0) NOT NULL DEFAULT 0,   -- Giá thuê/tháng
  deposit NUMERIC(14, 0) NOT NULL DEFAULT 0,       -- Tiền cọc
  contract_start DATE,              -- Ngày bắt đầu hợp đồng thuê
  contract_end DATE,                -- Ngày hết hạn hợp đồng
  payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 28),  -- Ngày thu tiền hàng tháng
  address TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kỳ thu tiền thuê hàng tháng
CREATE TABLE IF NOT EXISTS rent_payments (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES fund_objects(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,        -- YYYY-MM
  amount_due NUMERIC(14, 0) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(14, 0) NOT NULL DEFAULT 0,
  paid_date DATE,
  status VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  fund_transaction_id INTEGER REFERENCES fund_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, month)
);

CREATE INDEX IF NOT EXISTS idx_rent_payments_month ON rent_payments(month);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);

-- Đảm bảo hạng mục thu tiền thuê tồn tại (dữ liệu cũ đã có "Thu hộ tiền thuê")
INSERT INTO fund_categories (group_id, type, name)
SELECT id, 'Thu', 'Thu hộ tiền thuê' FROM fund_groups WHERE name = 'QLCH - Căn hộ'
ON CONFLICT (group_id, type, name) DO NOTHING;
