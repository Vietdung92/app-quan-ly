-- Migration 010: Thông tin giới thiệu căn hộ cho portal khách thuê
-- Idempotent: chạy lại an toàn
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS project_name VARCHAR(100);
ALTER TABLE apartment_details ADD COLUMN IF NOT EXISTS map_link TEXT;
