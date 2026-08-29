-- Migration 011: Ảnh báo cáo công việc + caption Telegram cấu hình
-- Idempotent
CREATE TABLE IF NOT EXISTS task_photos (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
  file_path VARCHAR(255) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_photos_task ON task_photos(task_id);

INSERT INTO config (key, value, description)
VALUES ('task_photo_caption', E'📸 {task}\nNhân viên: {employee}\n{note}',
        'Mẫu chú thích khi gửi ảnh công việc lên Telegram. Biến: {task} {employee} {note} {date}')
ON CONFLICT (key) DO NOTHING;
