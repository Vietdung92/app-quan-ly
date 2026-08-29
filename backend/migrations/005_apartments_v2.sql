-- =====================================================
-- Migration 005: Căn Hộ v2 — hồ sơ đầy đủ theo nghiệp vụ Eureka
-- Mỗi căn có 2 hợp đồng: với CHỦ NHÀ và với KHÁCH THUÊ
-- Chạy an toàn trên DB có dữ liệu (ADD COLUMN IF NOT EXISTS)
-- =====================================================

-- Thông tin căn
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS area NUMERIC(6,1);
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS electric_code VARCHAR(50);
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS water_code VARCHAR(50);
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS image_link TEXT;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS zalo_link TEXT;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS contract_link TEXT;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS qr_link TEXT;

-- Phía CHỦ NHÀ (công ty thuê từ chủ / hoặc quản lý hộ)
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_passport TEXT;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_bank TEXT;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_rent NUMERIC(14,0) DEFAULT 0;   -- Tiền trả chủ / tháng
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_deposit NUMERIC(14,0) DEFAULT 0;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_contract_start DATE;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_contract_end DATE;
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS owner_payment_note VARCHAR(100);      -- VD: trả 3 tháng/lần, kỳ tới 01/10

-- Phía KHÁCH THUÊ (các cột tenant_*, rent_amount, deposit, contract_*, payment_day đã có từ migration 004)
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS payment_note VARCHAR(100);            -- VD: 1-5 (trễ)
-- Nới cột SĐT: dữ liệu thật có kèm ghi chú dài
ALTER TABLE apartment_details ALTER COLUMN tenant_phone TYPE VARCHAR(150);
ALTER TABLE apartment_details ALTER COLUMN owner_phone TYPE VARCHAR(150);

-- Nghiệp vụ
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS rental_form VARCHAR(30)
  CHECK (rental_form IN ('Net', 'Bao phí quản lý') OR rental_form IS NULL);                  -- Net: khách tự đóng PQL; Bao phí: chủ nhà đóng
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS building_fee NUMERIC(14,0) DEFAULT 0; -- Phí quản lý chung cư
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS management_type VARCHAR(10) DEFAULT 'sublease'
  CHECK (management_type IN ('sublease', 'manage'));                                          -- sublease: thuê lại ăn chênh lệch; manage: quản lý hộ ăn phí
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS company_fee NUMERIC(14,0) DEFAULT 0;  -- Phí QL công ty hưởng (căn manage)
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS apt_status VARCHAR(20);               -- Đang thuê / Đang trống / Sắp hết hạn

-- Kỳ TRẢ TIỀN CHỦ NHÀ hàng tháng (chiều ngược của rent_payments)
CREATE TABLE IF NOT EXISTS owner_payments (
  id SERIAL PRIMARY KEY,
  object_id INTEGER NOT NULL REFERENCES fund_objects(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  amount_due NUMERIC(14,0) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(14,0) NOT NULL DEFAULT 0,
  paid_date DATE,
  status VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  fund_transaction_id INTEGER REFERENCES fund_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, month)
);

CREATE INDEX IF NOT EXISTS idx_owner_payments_month ON owner_payments(month);

-- Đảm bảo hạng mục Chi "Trả chủ nhà" tồn tại (dữ liệu cũ đã có)
INSERT INTO fund_categories (group_id, type, name)
SELECT id, 'Chi', 'Trả chủ nhà' FROM fund_groups WHERE name = 'QLCH - Căn hộ'
ON CONFLICT (group_id, type, name) DO NOTHING;
