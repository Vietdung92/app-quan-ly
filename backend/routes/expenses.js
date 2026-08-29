/**
 * Expense Routes
 * Path: routes/expenses.js
 */

const router = require('express').Router();
const { getAll, getOne, transaction } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');
const { notifyManagers, notifyUsers, getEmployeeName } = require('../utils/notify');

const SELECT = `
  SELECT x.id, x.name, x.description, x.amount, x.category, x.date, x.status,
         x.notes, x.project_id AS "projectId", x.rejected_reason AS "rejectedReason",
         ce.full_name AS "createdBy", ae.full_name AS "approvedBy",
         x.created_at AS "createdAt"
  FROM expenses x
  LEFT JOIN users cu ON cu.id = x.created_by
  LEFT JOIN employees ce ON ce.id = cu.employee_id
  LEFT JOIN users au ON au.id = x.approved_by
  LEFT JOIN employees ae ON ae.id = au.employee_id
`;

// GET /api/expenses?status=
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status) { params.push(status); where = `WHERE x.status = $1`; }
  const rows = await getAll(`${SELECT} ${where} ORDER BY x.id DESC`, params);
  ok(res, numerify(rows));
}));

// GET /api/expenses/monthly/:month (YYYY-MM)
router.get('/monthly/:month', asyncHandler(async (req, res) => {
  const row = await getOne(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
     FROM expenses
     WHERE to_char(date, 'YYYY-MM') = $1 AND status = 'approved'`,
    [req.params.month]
  );
  ok(res, { month: req.params.month, total: Number(row.total), count: Number(row.count) });
}));

// GET /api/expenses/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE x.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy chi phí');
  ok(res, numerify(row));
}));

// POST /api/expenses
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, amount, category, date, notes, projectId } = req.body;
  if (!name || !amount) throw badRequest('Tên chi phí và số tiền là bắt buộc');
  if (Number(amount) <= 0) throw badRequest('Số tiền phải là số dương');
  const row = await getOne(
    `INSERT INTO expenses (name, description, amount, category, date, notes, project_id, created_by)
     VALUES ($1, $2, $3, COALESCE($4, 'other'), COALESCE($5, CURRENT_DATE), $6, $7, $8) RETURNING id`,
    [name, description, amount, category, date, notes, projectId || null, req.user.userId]
  );
  const expense = await getOne(`${SELECT} WHERE x.id = $1`, [row.id]);

  // Thông báo (fire-and-forget)
  telegram.expenseCreated(expense);
  notifyManagers('expense', 'Chi phí mới chờ duyệt',
    `${expense.name} — ${Number(expense.amount).toLocaleString('vi-VN')} đ (${expense.createdBy || 'N/A'})`);

  created(res, numerify(expense));
}));

// PUT /api/expenses/:id — chỉ sửa được khi còn pending
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, description, amount, category, date, notes } = req.body;
  const row = await getOne(
    `UPDATE expenses SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       amount = COALESCE($3, amount),
       category = COALESCE($4, category),
       date = COALESCE($5, date),
       notes = COALESCE($6, notes)
     WHERE id = $7 AND status = 'pending' RETURNING id`,
    [name, description, amount, category, date, notes, req.params.id]
  );
  if (!row) throw badRequest('Chi phí không tồn tại hoặc đã được duyệt (không sửa được)');
  const expense = await getOne(`${SELECT} WHERE x.id = $1`, [row.id]);
  ok(res, numerify(expense));
}));

// DELETE /api/expenses/:id (QL, VP)
router.delete('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM expenses WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy chi phí');
  ok(res, { id: row.id, message: 'Đã xóa chi phí' });
}));

// POST /api/expenses/:id/approve (QL, VP) — duyệt và cộng vào spent của dự án
router.post('/:id/approve', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const result = await transaction(async (client) => {
    const upd = await client.query(
      `UPDATE expenses SET status = 'approved', approved_by = $1
       WHERE id = $2 AND status = 'pending' RETURNING id, name, amount, project_id, created_by`,
      [req.user.userId, req.params.id]
    );
    if (upd.rows.length === 0) return null;
    const expense = upd.rows[0];
    if (expense.project_id) {
      await client.query(
        `UPDATE projects SET spent = spent + $1, updated_at = NOW() WHERE id = $2`,
        [expense.amount, expense.project_id]
      );
    }
    return expense;
  });
  if (!result) throw badRequest('Chi phí không tồn tại hoặc đã được xử lý');

  // Thông báo (fire-and-forget)
  getEmployeeName(req.user.employeeId).then((approver) => {
    telegram.expenseApproved(result, approver);
  });
  if (result.created_by) {
    notifyUsers([result.created_by], 'expense', 'Chi phí đã được duyệt',
      `${result.name} — ${Number(result.amount).toLocaleString('vi-VN')} đ`);
  }

  ok(res, { id: result.id, status: 'approved' });
}));

// POST /api/expenses/:id/reject (QL, VP)
router.post('/:id/reject', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const row = await getOne(
    `UPDATE expenses SET status = 'rejected', approved_by = $1, rejected_reason = $2
     WHERE id = $3 AND status = 'pending' RETURNING id, name, amount, created_by`,
    [req.user.userId, reason || null, req.params.id]
  );
  if (!row) throw badRequest('Chi phí không tồn tại hoặc đã được xử lý');

  // Thông báo (fire-and-forget)
  getEmployeeName(req.user.employeeId).then((approver) => {
    telegram.expenseRejected(row, approver, reason);
  });
  if (row.created_by) {
    notifyUsers([row.created_by], 'expense', 'Chi phí bị từ chối',
      `${row.name}${reason ? ` — Lý do: ${reason}` : ''}`);
  }

  ok(res, { id: row.id, status: 'rejected' });
}));

module.exports = router;
