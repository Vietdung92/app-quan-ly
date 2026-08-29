-- Migration 007: Tạm trú khách nước ngoài (Residents)
-- Guard: chạy đúng 1 lần (bảng đã tồn tại thì bỏ qua)
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.apartment_residents') IS NOT NULL THEN
    RAISE EXCEPTION 'Residents already imported - skipping (this is safe)';
  END IF;
END $$;

CREATE TABLE apartment_residents (
  id SERIAL PRIMARY KEY,
  object_id INT NOT NULL REFERENCES fund_objects(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  passport_no VARCHAR(50),
  nationality VARCHAR(50),
  birth_date DATE,
  residence_start DATE,
  residence_expiry DATE,
  pet_notes TEXT,
  passport_link TEXT,
  trc_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_residents_object ON apartment_residents(object_id);
CREATE INDEX idx_residents_expiry ON apartment_residents(residence_expiry) WHERE is_active;

-- Dữ liệu từ sheet Residents (file Eureka)
INSERT INTO apartment_residents (object_id, full_name, passport_no, nationality, birth_date, residence_start, residence_expiry, passport_link, trc_link)
SELECT o.id, 'ALEX', 'M12455y', 'US', '1992-03-12', '2026-04-17', '2026-07-01',
  'https://drive.google.com/file/d/1ayoSY6VhwDd1agDUTLHAPSMKBXV', 'https://drive.google.com/file/d/1tVR1IuA7K8NQF8wVH42IUCU4r3o'
FROM fund_objects o JOIN fund_groups g ON g.id = o.group_id
WHERE g.name = 'QLCH - Căn hộ' AND o.name = 'B-34.09';

INSERT INTO apartment_residents (object_id, full_name, passport_no, nationality, birth_date, residence_start, residence_expiry, passport_link, trc_link)
SELECT o.id, 'BOGHN', 'M56788', 'US', '1986-06-01', '2026-06-01', '2026-08-01',
  'https://drive.google.com/file/d/1ayoSY6VhwDd1agDUTLHAPSMKBXV', 'https://drive.google.com/file/d/1tVR1IuA7K8NQF8wVH42IUCU4r3o'
FROM fund_objects o JOIN fund_groups g ON g.id = o.group_id
WHERE g.name = 'QLCH - Căn hộ' AND o.name = 'B-34.09';

COMMIT;
