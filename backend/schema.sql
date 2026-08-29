-- =====================================================
-- App Quản Lý Công Ty - Database Schema (D1 v1.1)
-- PostgreSQL 14+
-- Import: psql -U app_user -d app_quanly_conty -f schema.sql
-- =====================================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payroll_history CASCADE;
DROP TABLE IF EXISTS advance_salary CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS config CASCADE;

-- =====================================================
-- EMPLOYEES (hồ sơ nhân viên)
-- =====================================================
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(2) NOT NULL DEFAULT 'KT' CHECK (role IN ('QL', 'VP', 'KT')),
  position VARCHAR(100),
  department VARCHAR(100),
  salary NUMERIC(14, 0) NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'onleave', 'inactive')),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- USERS (tài khoản đăng nhập, gắn với employee)
-- =====================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PROJECTS (dự án)
-- =====================================================
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(15) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed')),
  budget NUMERIC(14, 0) NOT NULL DEFAULT 0,
  spent NUMERIC(14, 0) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, employee_id)
);

-- =====================================================
-- TASKS (công việc)
-- =====================================================
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(15) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  due_date DATE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- EXPENSES (chi phí)
-- =====================================================
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  amount NUMERIC(14, 0) NOT NULL CHECK (amount > 0),
  category VARCHAR(20) NOT NULL DEFAULT 'other'
    CHECK (category IN ('materials', 'utilities', 'maintenance', 'salary', 'other')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ATTENDANCE (điểm danh)
-- =====================================================
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status VARCHAR(10) NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'late', 'absent', 'excused')),
  notes TEXT,
  UNIQUE (employee_id, date)
);

-- =====================================================
-- LEAVE REQUESTS (nghỉ phép)
-- =====================================================
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL DEFAULT 'annual' CHECK (type IN ('annual', 'sick', 'personal', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL CHECK (days > 0),
  reason TEXT,
  notes TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ADVANCE SALARY (vay/ứng lương)
-- =====================================================
CREATE TABLE advance_salary (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(14, 0) NOT NULL CHECK (amount > 0),
  reason TEXT,
  notes TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  monthly_deduction NUMERIC(14, 0) NOT NULL DEFAULT 0,
  remaining_balance NUMERIC(14, 0) NOT NULL DEFAULT 0,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PAYROLL HISTORY (bảng lương)
-- =====================================================
CREATE TABLE payroll_history (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  base_salary NUMERIC(14, 0) NOT NULL DEFAULT 0,
  allowances NUMERIC(14, 0) NOT NULL DEFAULT 0,
  deductions NUMERIC(14, 0) NOT NULL DEFAULT 0,
  advance_deduction NUMERIC(14, 0) NOT NULL DEFAULT 0,
  net_salary NUMERIC(14, 0) NOT NULL DEFAULT 0,
  status VARCHAR(12) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'processing', 'paid')),
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, month)
);

-- =====================================================
-- NOTIFICATIONS (thông báo)
-- =====================================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'info',
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CONFIG (cấu hình app, đổi không cần redeploy)
-- =====================================================
CREATE TABLE config (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_advance_salary_employee ON advance_salary(employee_id);
CREATE INDEX idx_payroll_month ON payroll_history(month);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =====================================================
-- SAMPLE DATA
-- =====================================================
INSERT INTO employees (full_name, email, phone, role, position, department, salary, status, join_date, address) VALUES
  ('Bùi Viết Dũng',   'quanly@hcare.com',   '0912345601', 'QL', 'Giám đốc điều hành', 'Quản lý',   15000000, 'active', '2023-01-01', 'Quận 2, TP HCM'),
  ('Trần Thị Bích',   'vp@hcare.com',       '0912345602', 'VP', 'Phó quản lý',        'Quản lý',   10000000, 'active', '2023-03-15', 'Quận 9, TP HCM'),
  ('Lê Văn Cường',    'kt1@hcare.com',      '0912345603', 'KT', 'Nhân viên kỹ thuật', 'Kỹ thuật',   8000000, 'active', '2023-06-01', 'Thủ Đức, TP HCM'),
  ('Phạm Văn Đạt',    'kt2@hcare.com',      '0912345604', 'KT', 'Nhân viên kỹ thuật', 'Kỹ thuật',   8000000, 'active', '2024-01-10', 'Quận 7, TP HCM'),
  ('Nguyễn Thị Em',   'kt3@hcare.com',      '0912345605', 'KT', 'Nhân viên văn phòng','Văn phòng',  7000000, 'active', '2024-05-20', 'Quận 2, TP HCM');

-- Mật khẩu tất cả tài khoản: hcare123 (bcrypt hash thay bằng __BCRYPT_HASH__ khi seed)
INSERT INTO users (employee_id, email, password_hash) VALUES
  (1, 'quanly@hcare.com', '__BCRYPT_HASH__'),
  (2, 'vp@hcare.com',     '__BCRYPT_HASH__'),
  (3, 'kt1@hcare.com',    '__BCRYPT_HASH__'),
  (4, 'kt2@hcare.com',    '__BCRYPT_HASH__'),
  (5, 'kt3@hcare.com',    '__BCRYPT_HASH__');

INSERT INTO projects (name, description, status, budget, spent, start_date, end_date, manager_id, created_by) VALUES
  ('Thi công nội thất quận 2', 'Dự án thiết kế và thi công nội thất căn hộ', 'in_progress', 50000000, 35000000, '2026-08-01', '2026-09-30', 1, 1),
  ('Nâng cấp DreamGarden Homestay', 'Cải thiện cơ sở vật chất homestay Đà Lạt', 'completed', 30000000, 30000000, '2026-07-01', '2026-08-31', 2, 1),
  ('Bảo trì ký túc xá Lê Văn Việt', 'Sửa chữa định kỳ 4 phòng 34 giường', 'pending', 15000000, 0, '2026-09-15', '2026-10-15', 2, 1);

INSERT INTO project_members (project_id, employee_id) VALUES
  (1, 1), (1, 3), (1, 4),
  (2, 2), (2, 5),
  (3, 2), (3, 3);

INSERT INTO tasks (title, description, priority, status, assigned_to, due_date, project_id, created_by) VALUES
  ('Kiểm tra căn hộ 101', 'Kiểm tra tình trạng căn hộ trước khi bàn giao', 'high', 'in_progress', 3, '2026-09-05', 1, 1),
  ('Lắp đặt tủ bếp căn 203', 'Lắp tủ bếp theo bản vẽ đã duyệt', 'medium', 'pending', 4, '2026-09-10', 1, 1),
  ('Chụp ảnh phòng homestay', 'Chụp ảnh 6 phòng cho quảng cáo săn mây', 'low', 'completed', 5, '2026-08-20', 2, 1),
  ('Sửa vòi nước phòng KTX 2', 'Vòi nước bị rò rỉ, cần thay mới', 'high', 'pending', 3, '2026-09-02', 3, 2);

INSERT INTO expenses (name, description, amount, category, date, status, project_id, created_by, approved_by) VALUES
  ('Vật liệu xây dựng', 'Gạch, xi măng, cát cho dự án quận 2', 5000000, 'materials', '2026-08-25', 'approved', 1, 1, 1),
  ('Tiền điện tháng 8', 'Điện ký túc xá Lê Văn Việt', 2500000, 'utilities', '2026-08-28', 'pending', NULL, 2, NULL),
  ('Sơn tường homestay', 'Sơn lại 2 phòng view săn mây', 3200000, 'materials', '2026-08-15', 'approved', 2, 2, 1),
  ('Bảo trì máy lạnh', 'Vệ sinh 4 máy lạnh căn hộ', 1200000, 'maintenance', '2026-08-27', 'pending', 1, 3, NULL);

INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes) VALUES
  (1, CURRENT_DATE, '08:00', NULL, 'present', NULL),
  (2, CURRENT_DATE, '08:05', NULL, 'present', NULL),
  (3, CURRENT_DATE, '08:20', NULL, 'late', 'Đi muộn 20 phút'),
  (4, CURRENT_DATE, NULL, NULL, 'absent', 'Vắng không phép'),
  (5, CURRENT_DATE, '07:55', NULL, 'present', NULL);

INSERT INTO leave_requests (employee_id, type, start_date, end_date, days, reason, status, approved_by) VALUES
  (3, 'annual', '2026-09-10', '2026-09-12', 3, 'Về quê có việc gia đình', 'pending', NULL),
  (5, 'sick', '2026-08-18', '2026-08-19', 2, 'Bị cảm sốt', 'approved', 1);

INSERT INTO advance_salary (employee_id, amount, reason, status, monthly_deduction, remaining_balance, approved_by, approved_at) VALUES
  (4, 3000000, 'Đóng học phí cho con', 'approved', 1000000, 2000000, 1, NOW() - INTERVAL '30 days'),
  (3, 2000000, 'Sửa xe máy', 'pending', 0, 0, NULL, NULL);

INSERT INTO payroll_history (employee_id, month, base_salary, allowances, deductions, advance_deduction, net_salary, status, paid_date) VALUES
  (1, '2026-07', 15000000, 1000000, 0, 0, 16000000, 'paid', '2026-07-31'),
  (2, '2026-07', 10000000,  500000, 0, 0, 10500000, 'paid', '2026-07-31'),
  (3, '2026-07',  8000000,  500000, 0, 0,  8500000, 'paid', '2026-07-31'),
  (4, '2026-07',  8000000,  500000, 0, 1000000, 7500000, 'paid', '2026-07-31'),
  (5, '2026-07',  7000000,  500000, 0, 0,  7500000, 'paid', '2026-07-31');

INSERT INTO notifications (user_id, type, title, message) VALUES
  (1, 'expense', 'Chi phí chờ duyệt', 'Có 2 chi phí đang chờ phê duyệt'),
  (1, 'leave', 'Đơn nghỉ phép mới', 'Lê Văn Cường xin nghỉ phép 3 ngày'),
  (3, 'task', 'Công việc mới', 'Bạn được giao: Sửa vòi nước phòng KTX 2');

INSERT INTO config (key, value, description) VALUES
  ('app_version', '1.0.0', 'Phiên bản app'),
  ('days_per_month', '26', 'Số ngày công chuẩn mỗi tháng'),
  ('free_leave_days_per_month', '1', 'Số ngày nghỉ phép miễn trừ mỗi tháng'),
  ('max_advance_percentage', '50', 'Phần trăm lương tối đa được ứng');
