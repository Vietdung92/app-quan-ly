/**
 * Employee Routes
 * Path: routes/employees.js
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole, requireAdmin } = require('../middleware/auth');

const SELECT = `
  SELECT id, full_name AS "fullName", email, phone, role, position, department,
         salary, status, join_date AS "joinDate", address
  FROM employees
`;

// GET /api/employees?role=&department=
router.get('/', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { role, department } = req.query;
  const conditions = [];
  const params = [];
  if (role) { params.push(role); conditions.push(`role = $${params.length}`); }
  if (department) { params.push(department); conditions.push(`department = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY id`, params);
  ok(res, numerify(rows));
}));

// GET /api/employees/:id
router.get('/:id', asyncHandler(async (req, res) => {
  // Nhân viên thường chỉ xem được hồ sơ của chính mình
  const id = parseInt(req.params.id);
  if (req.user.role === 'KT' && req.user.employeeId !== id) {
    return res.status(403).json({ success: false, error: 'Không có quyền xem hồ sơ nhân viên khác' });
  }
  const row = await getOne(`${SELECT} WHERE id = $1`, [id]);
  if (!row) throw notFound('Không tìm thấy nhân viên');
  ok(res, numerify(row));
}));

// POST /api/employees (QL)
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { fullName, email, phone, role, position, department, salary, joinDate, address } = req.body;
  if (!fullName || !email) throw badRequest('Họ tên và email là bắt buộc');
  const row = await getOne(
    `INSERT INTO employees (full_name, email, phone, role, position, department, salary, join_date, address)
     VALUES ($1, $2, $3, COALESCE($4, 'KT'), $5, $6, COALESCE($7, 0), COALESCE($8, CURRENT_DATE), $9)
     RETURNING id`,
    [fullName, email, phone, role, position, department, salary, joinDate, address]
  );
  const employee = await getOne(`${SELECT} WHERE id = $1`, [row.id]);
  created(res, numerify(employee));
}));

// PUT /api/employees/:id (QL)
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { fullName, email, phone, role, position, department, salary, status, address } = req.body;
  const row = await getOne(
    `UPDATE employees SET
       full_name = COALESCE($1, full_name),
       email = COALESCE($2, email),
       phone = COALESCE($3, phone),
       role = COALESCE($4, role),
       position = COALESCE($5, position),
       department = COALESCE($6, department),
       salary = COALESCE($7, salary),
       status = COALESCE($8, status),
       address = COALESCE($9, address),
       updated_at = NOW()
     WHERE id = $10 RETURNING id`,
    [fullName, email, phone, role, position, department, salary, status, address, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy nhân viên');
  const employee = await getOne(`${SELECT} WHERE id = $1`, [row.id]);
  ok(res, numerify(employee));
}));

// DELETE /api/employees/:id (QL) — soft delete: chuyển inactive
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const row = await getOne(
    `UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy nhân viên');
  ok(res, { id: row.id, message: 'Đã chuyển nhân viên sang trạng thái nghỉ việc' });
}));

// PATCH /api/employees/:id/status (QL) — tự động khóa/mở khóa đăng nhập khi đổi status
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw badRequest('Thiếu trạng thái');
  const employee = await getOne(`SELECT employee_id FROM users WHERE employee_id = $1`, [req.params.id]);
  if (!employee && ['inactive', 'active'].includes(status)) {
    throw notFound('Không tìm thấy tài khoản đăng nhập của nhân viên');
  }

  const row = await getOne(
    `UPDATE employees SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
    [status, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy nhân viên');

  // Tự động khóa/mở khóa tài khoản đăng nhập
  if (status === 'inactive' && employee) {
    await getOne(`UPDATE users SET is_active = FALSE WHERE employee_id = $1`, [req.params.id]);
  } else if (status === 'active' && employee) {
    await getOne(`UPDATE users SET is_active = TRUE WHERE employee_id = $1`, [req.params.id]);
  }

  ok(res, { id: row.id, status });
}));

// PATCH /api/employees/:id/salary (QL)
router.patch('/:id/salary', requireAdmin, asyncHandler(async (req, res) => {
  const { salary } = req.body;
  if (salary === undefined || Number(salary) < 0) throw badRequest('Lương không hợp lệ');
  const row = await getOne(
    `UPDATE employees SET salary = $1, updated_at = NOW() WHERE id = $2 RETURNING id, salary`,
    [salary, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy nhân viên');
  ok(res, numerify(row));
}));

// PATCH /api/employees/:id/lock-account (QL) — khóa/mở khóa đăng nhập độc lập
router.patch('/:id/lock-account', requireAdmin, asyncHandler(async (req, res) => {
  const { locked } = req.body;
  if (locked === undefined) throw badRequest('Thiếu trạng thái khóa');
  const row = await getOne(
    `UPDATE users SET is_active = $1 WHERE employee_id = $2 RETURNING id`,
    [!locked, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy tài khoản đăng nhập của nhân viên');
  ok(res, { id: req.params.id, locked: locked ? true : false });
}));

module.exports = router;
