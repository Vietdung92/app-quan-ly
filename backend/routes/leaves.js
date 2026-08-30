/**
 * Leave Request Routes
 * Path: routes/leaves.js
 * LƯU Ý: /balance/:employeeId và /request phải đặt TRƯỚC /:id
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');
const { notifyManagers, notifyEmployee, getEmployeeName } = require('../utils/notify');

const QUOTA = { annual: 12, sick: 5, personal: 3 };

const SELECT = `
  SELECT l.id, l.employee_id AS "employeeId", e.full_name AS "employeeName",
         l.type, l.start_date AS "startDate", l.end_date AS "endDate", l.days,
         l.reason, l.notes, l.status, l.rejected_reason AS "rejectedReason",
         ae.full_name AS "approvedBy", l.created_at AS "createdAt"
  FROM leave_requests l
  JOIN employees e ON e.id = l.employee_id
  LEFT JOIN users au ON au.id = l.approved_by
  LEFT JOIN employees ae ON ae.id = au.employee_id
`;

// GET /api/leaves/balance/:employeeId — số ngày phép còn lại trong năm
router.get('/balance/:employeeId', asyncHandler(async (req, res) => {
  if (!['QL', 'VP'].includes(req.user.role) && Number(req.params.employeeId) !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ xem được số phép của mình' });
  }
  const year = new Date().getFullYear();
  const used = await getAll(
    `SELECT type, COALESCE(SUM(days), 0) AS used
     FROM leave_requests
     WHERE employee_id = $1 AND status = 'approved'
       AND EXTRACT(YEAR FROM start_date) = $2
     GROUP BY type`,
    [req.params.employeeId, year]
  );
  const usedMap = Object.fromEntries(used.map((r) => [r.type, Number(r.used)]));
  ok(res, {
    annual: Math.max(0, QUOTA.annual - (usedMap.annual || 0)),
    sick: Math.max(0, QUOTA.sick - (usedMap.sick || 0)),
    personal: Math.max(0, QUOTA.personal - (usedMap.personal || 0)),
    unpaid: 0,
  });
}));

// GET /api/leaves?employeeId=&year=&status=
router.get('/', asyncHandler(async (req, res) => {
  const { employeeId, year, status } = req.query;
  const conditions = [];
  const params = [];
  if (employeeId) { params.push(employeeId); conditions.push(`l.employee_id = $${params.length}`); }
  if (year) { params.push(year); conditions.push(`EXTRACT(YEAR FROM l.start_date) = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`l.status = $${params.length}`); }
  // KT chỉ thấy đơn của mình
  if (req.user.role === 'KT') {
    params.push(req.user.employeeId);
    conditions.push(`l.employee_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY l.id DESC`, params);
  ok(res, numerify(rows));
}));

// POST /api/leaves/request — gửi đơn xin nghỉ (cho chính mình)
router.post('/request', asyncHandler(async (req, res) => {
  const { type, startDate, endDate, days, reason, notes } = req.body;
  if (!startDate || !endDate) throw badRequest('Ngày bắt đầu và kết thúc là bắt buộc');
  if (new Date(endDate) < new Date(startDate)) throw badRequest('Ngày kết thúc phải sau ngày bắt đầu');

  const numDays = days || Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
  const row = await getOne(
    `INSERT INTO leave_requests (employee_id, type, start_date, end_date, days, reason, notes)
     VALUES ($1, COALESCE($2, 'annual'), $3, $4, $5, $6, $7) RETURNING id`,
    [req.user.employeeId, type, startDate, endDate, numDays, reason, notes]
  );
  const leave = await getOne(`${SELECT} WHERE l.id = $1`, [row.id]);

  // Thông báo (fire-and-forget)
  telegram.leaveRequested(leave);
  notifyManagers('leave', 'Đơn xin nghỉ phép mới',
    `${leave.employeeName} xin nghỉ ${leave.days} ngày (${leave.type})`);

  created(res, numerify(leave));
}));

// GET /api/leaves/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE l.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy đơn nghỉ phép');
  if (!['QL', 'VP'].includes(req.user.role) && row.employeeId !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ xem được đơn của mình' });
  }
  if (req.user.role === 'KT' && row.employeeId !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Không có quyền xem đơn của người khác' });
  }
  ok(res, numerify(row));
}));

// Chung cho approve/reject: cập nhật + gửi thông báo
function decideLeave(newStatus) {
  return asyncHandler(async (req, res) => {
    const { reason } = req.body || {};
    const row = await getOne(
      `UPDATE leave_requests SET status = $1, approved_by = $2, rejected_reason = $3
       WHERE id = $4 AND status = 'pending' RETURNING id`,
      [newStatus, req.user.userId, newStatus === 'rejected' ? reason || null : null, req.params.id]
    );
    if (!row) throw badRequest('Đơn không tồn tại hoặc đã được xử lý');

    // Thông báo (fire-and-forget)
    getOne(`${SELECT} WHERE l.id = $1`, [row.id]).then(async (leave) => {
      const approver = await getEmployeeName(req.user.employeeId);
      telegram.leaveDecided(leave, newStatus, approver);
      notifyEmployee(leave.employeeId, 'leave',
        `Đơn nghỉ phép ${newStatus === 'approved' ? 'được duyệt' : 'bị từ chối'}`,
        `${leave.days} ngày (${leave.type})${newStatus === 'rejected' && reason ? ` — Lý do: ${reason}` : ''}`);
    }).catch(() => {});

    ok(res, { id: row.id, status: newStatus });
  });
}

// POST /api/leaves/:id/approve (QL, VP)
router.post('/:id/approve', requireRole('QL', 'VP'), decideLeave('approved'));

// POST /api/leaves/:id/reject (QL, VP)
router.post('/:id/reject', requireRole('QL', 'VP'), decideLeave('rejected'));

// POST /api/leaves/:id/cancel — chủ đơn tự hủy khi còn pending
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const leave = await getOne(`SELECT id, employee_id FROM leave_requests WHERE id = $1`, [req.params.id]);
  if (!leave) throw notFound('Không tìm thấy đơn nghỉ phép');
  if (req.user.role === 'KT' && leave.employee_id !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Chỉ được hủy đơn của mình' });
  }
  const row = await getOne(
    `UPDATE leave_requests SET status = 'cancelled' WHERE id = $1 AND status = 'pending' RETURNING id`,
    [req.params.id]
  );
  if (!row) throw badRequest('Chỉ hủy được đơn đang chờ duyệt');
  ok(res, { id: row.id, status: 'cancelled' });
}));

module.exports = router;
