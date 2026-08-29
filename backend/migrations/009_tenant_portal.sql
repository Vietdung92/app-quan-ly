-- Migration 009: Tenant Portal (tài khoản khách thuê + báo hỏng)
-- Guard: chạy đúng 1 lần
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.tenant_accounts') IS NOT NULL THEN
    RAISE EXCEPTION 'Tenant portal already imported - skipping (this is safe)';
  END IF;
END $$;

-- Tài khoản đăng nhập của khách thuê (1 tài khoản / 1 căn, QL cấp)
CREATE TABLE tenant_accounts (
  id SERIAL PRIMARY KEY,
  object_id INT NOT NULL UNIQUE REFERENCES fund_objects(id) ON DELETE CASCADE,
  login VARCHAR(150) NOT NULL UNIQUE,           -- email hoặc SĐT
  password_hash VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Yêu cầu báo hỏng / sửa chữa từ khách thuê
CREATE TABLE repair_requests (
  id SERIAL PRIMARY KEY,
  object_id INT NOT NULL REFERENCES fund_objects(id) ON DELETE CASCADE,
  tenant_account_id INT REFERENCES tenant_accounts(id) ON DELETE SET NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'other'
    CHECK (category IN ('electric','water','aircon','lock','furniture','other')),
  description TEXT NOT NULL,
  image_link TEXT,
  status VARCHAR(15) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','received','in_progress','done','cancelled')),
  assigned_to INT REFERENCES employees(id) ON DELETE SET NULL,
  staff_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_repairs_object ON repair_requests(object_id);
CREATE INDEX idx_repairs_status ON repair_requests(status);

COMMIT;
