/**
 * Advance Salary Routes
 * Path: routes/advances.js
 * LƯU Ý: /balance/:employeeId và /request phải đặt TRƯỚC /:id
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');
const { notifyManagers, notifyEmployee, getEmployeeName } = require('../utils/notify');

const MAX_ADVANCE_PERCENT = 80; // % lương tối đa được ứng (config table)

const SELECT = `
  SELECT a.id, a.employee_id AS "employeeId", e.full_name AS "employeeName",
         a.amount, a.reason, a.notes, a.status,
         a.monthly_deduction AS "monthlyDeduction",
         a.remaining_balance AS "remainingBalance",
         a.rejected_reason AS "rejectedReason",
         ae.full_name AS "approvedBy", a.approved_at AS "approvedAt",
         a.created_at AS "requestDate", a.created_at AS "createdAt"
  FROM advance_salary a
  JOIN employees e ON e.id = a.employee_id
  LEFT JOIN users au ON au.id = a.approved_by
  LEFT JOIN employees ae ON ae.id = au.employee_id
`;

// GET /api/advances/balance/:employeeId — hạn mức còn có thể vay
router.get('/balance/:employeeId', asyncHandler(async (req, res) => {
  if (!['QL', 'VP'].includes(req.user.role) && Number(req.params.employeeId) !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ xem được thông tin ứng lương của mình' });
  }
  const employee = await getOne(`SELECT salary FROM employees WHERE id = $1`, [req.params.employeeId]);
  if (!employee) throw notFound('Không tìm thấy nhân viên');

  const outstanding = await getOne(
    `SELECT COALESCE(SUM(remaining_balance), 0) AS total
     FROM advance_salary WHERE employee_id = $1 AND status = 'approved'`,
    [req.params.employeeId]
  );

  const salary = Number(employee.salary);
  const maxAdvance = Math.floor((salary * MAX_ADVANCE_PERCENT) / 100);
  const balance = Math.max(0, maxAdvance - Number(outstanding.total));
  ok(res, { salary, balance, maxAdvance, outstanding: Number(outstanding.total) });
}));

// GET /api/advances?employeeId=&status=
router.get('/', asyncHandler(async (req, res) => {
  const { employeeId, status } = req.query;
  const conditions = [];
  const params = [];
  if (employeeId) { params.push(employeeId); conditions.push(`a.employee_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`a.status = $${params.length}`); }
  if (req.user.role === 'KT') {
    params.push(req.user.employeeId);
    conditions.push(`a.employee_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY a.id DESC`, params);
  ok(res, numerify(rows));
}));

// POST /api/advances/request — xin vay lương (cho chính mình)
router.post('/request', asyncHandler(async (req, res) => {
  const { amount, reason, notes } = req.body;
  if (!amount || Number(amount) <= 0) throw badRequest('Số tiền xin vay phải là số dương');

  // Kiểm tra hạn mức server-side
  const employee = await getOne(`SELECT salary FROM employees WHERE id = $1`, [req.user.employeeId]);
  const outstanding = await getOne(
    `SELECT COALESCE(SUM(remaining_balance), 0) AS total
     FROM advance_salary WHERE employee_id = $1 AND status = 'approved'`,
    [req.user.employeeId]
  );
  const maxAdvance = Math.floor((Number(employee.salary) * MAX_ADVANCE_PERCENT) / 100);
  const available = maxAdvance - Number(outstanding.total);
  if (Number(amount) > available) {
    // Không lộ mức lương hay con số hạn mức lên màn hình (yêu cầu anh Dũng)
    throw badRequest('Số tiền vượt hạn mức ứng lương cho phép. Vui lòng giảm số tiền hoặc liên hệ Quản lý.');
  }

  const row = await getOne(
    `INSERT INTO advance_salary (employee_id, amount, reason, notes) VALUES ($1, $2, $3, $4) RETURNING id`,
    [req.user.employeeId, amount, reason, notes]
  );
  const advance = await getOne(`${SELECT} WHERE a.id = $1`, [row.id]);

  // Thông báo (fire-and-forget)
  telegram.advanceRequested(advance);
  notifyManagers('advance', 'Đơn xin ứng lương mới',
    `${advance.employeeName} xin ứng ${Number(advance.amount).toLocaleString('vi-VN')} đ`);

  created(res, numerify(advance));
}));

// GET /api/advances/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE a.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy đơn vay lương');
  if (!['QL', 'VP'].includes(req.user.role) && row.employeeId !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ xem được đơn của mình' });
  }
  if (req.user.role === 'KT' && row.employeeId !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Không có quyền xem đơn của người khác' });
  }
  ok(res, numerify(row));
}));

// POST /api/advances/:id/approve (QL) — duyệt, mặc định khấu trừ 3 tháng
router.post('/:id/approve', requireRole('QL'), asyncHandler(async (req, res) => {
  const { monthlyDeduction } = req.body;
  const advance = await getOne(`SELECT id, amount FROM advance_salary WHERE id = $1 AND status = 'pending'`, [req.params.id]);
  if (!advance) throw badRequest('Đơn không tồn tại hoặc đã được xử lý');

  const deduction = monthlyDeduction || Math.ceil(Number(advance.amount) / 3);
  const row = await getOne(
    `UPDATE advance_salary SET
       status = 'approved', approved_by = $1, approved_at = NOW(),
       monthly_deduction = $2, remaining_balance = amount
     WHERE id = $3 RETURNING id`,
    [req.user.userId, deduction, advance.id]
  );

  // Thông báo (fire-and-forget)
  getOne(`${SELECT} WHERE a.id = $1`, [row.id]).then(async (adv) => {
    const approver = await getEmployeeName(req.user.employeeId);
    telegram.advanceDecided(adv, 'approved', approver);
    notifyEmployee(adv.employeeId, 'advance', 'Đơn ứng lương được duyệt',
      `${Number(adv.amount).toLocaleString('vi-VN')} đ — khấu trừ ${Number(deduction).toLocaleString('vi-VN')} đ/tháng`);
  }).catch(() => {});

  ok(res, { id: row.id, status: 'approved', monthlyDeduction: deduction });
}));

// POST /api/advances/:id/reject (QL)
router.post('/:id/reject', requireRole('QL'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const row = await getOne(
    `UPDATE advance_salary SET status = 'rejected', approved_by = $1, rejected_reason = $2
     WHERE id = $3 AND status = 'pending' RETURNING id`,
    [req.user.userId, reason || null, req.params.id]
  );
  if (!row) throw badRequest('Đơn không tồn tại hoặc đã được xử lý');

  // Thông báo (fire-and-forget)
  getOne(`${SELECT} WHERE a.id = $1`, [row.id]).then(async (adv) => {
    const approver = await getEmployeeName(req.user.employeeId);
    telegram.advanceDecided(adv, 'rejected', approver);
    notifyEmployee(adv.employeeId, 'advance', 'Đơn ứng lương bị từ chối',
      reason ? `Lý do: ${reason}` : 'Vui lòng liên hệ quản lý');
  }).catch(() => {});

  ok(res, { id: row.id, status: 'rejected' });
}));

// POST /api/advances/:id/deduct (QL) — khấu trừ thủ công
router.post('/:id/deduct', requireRole('QL'), asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) throw badRequest('Số tiền khấu trừ phải là số dương');
  const row = await getOne(
    `UPDATE advance_salary SET
       remaining_balance = GREATEST(0, remaining_balance - $1),
       status = CASE WHEN remaining_balance - $1 <= 0 THEN 'completed' ELSE status END
     WHERE id = $2 AND status = 'approved'
     RETURNING id, remaining_balance AS "remainingBalance", status`,
    [amount, req.params.id]
  );
  if (!row) throw badRequest('Đơn không tồn tại hoặc chưa được duyệt');
  ok(res, numerify(row));
}));

module.exports = router;
