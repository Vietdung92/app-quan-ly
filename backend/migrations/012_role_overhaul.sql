-- Migration 012: Đại tu 3 vai trò — chi phí v2, dự án đồng bộ Quỹ, web push
-- Idempotent: chạy lại an toàn

-- 1. Chi phí v2: gắn Quỹ + ảnh + hoàn trả
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS fund_group_id INT REFERENCES fund_groups(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS fund_category_id INT REFERENCES fund_categories(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS need_reimburse BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reimbursed_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS image_path VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS fund_transaction_id INT REFERENCES fund_transactions(id) ON DELETE SET NULL;

-- 2. Dự án đồng bộ với đối tượng Quỹ (nhóm "Dự án")
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fund_object_id INT REFERENCES fund_objects(id) ON DELETE SET NULL;

-- Backfill: dự án hiện có chưa gắn đối tượng Quỹ → tạo/khớp theo tên
INSERT INTO fund_objects (group_id, name, status)
SELECT g.id, p.name, 'Đang hoạt động'
FROM projects p CROSS JOIN fund_groups g
WHERE g.name = 'Dự án' AND p.fund_object_id IS NULL
ON CONFLICT (group_id, name) DO NOTHING;

UPDATE projects p SET fund_object_id = o.id
FROM fund_objects o JOIN fund_groups g ON g.id = o.group_id
WHERE g.name = 'Dự án' AND o.name = p.name AND p.fund_object_id IS NULL;

-- 3. Web Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- 4. Config: mẫu caption chi phí + link nhóm Telegram
INSERT INTO config (key, value, description)
VALUES ('expense_photo_caption', E'💸 [CHỜ DUYỆT] {name}\nDự án: {project}\nSố tiền: {amount} đ\nNgười chi: {employee}\n{note}',
        'Mẫu chú thích ảnh chi phí gửi Telegram. Biến: {name} {project} {amount} {employee} {note} {date}')
ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value, description)
VALUES ('telegram_group_link', '', 'Link mời nhóm Telegram công ty (nút trên thanh tiêu đề)')
ON CONFLICT (key) DO NOTHING;
