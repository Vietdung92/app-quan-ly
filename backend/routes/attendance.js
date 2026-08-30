/**
 * Attendance Routes
 * Path: routes/attendance.js
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created } = require('../utils/respond');
const { asyncHandler, badRequest } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');

const SELECT = `
  SELECT a.id, a.employee_id AS "employeeId", e.full_name AS "employeeName",
         a.date, to_char(a.check_in, 'HH24:MI') AS "checkIn",
         to_char(a.check_out, 'HH24:MI') AS "checkOut",
         a.status, a.notes
  FROM attendance a
  JOIN employees e ON e.id = a.employee_id
`;

// GET /api/attendance/my-history?month=YYYY-MM — xem lịch sử chấm công của chính mình (KT)
router.get('/my-history', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const conditions = ['a.employee_id = $1'];
  const params = [req.user.employeeId];
  if (month) { params.push(month); conditions.push(`to_char(a.date, 'YYYY-MM') = $${params.length}`); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const rows = await getAll(`${SELECT} ${where} ORDER BY a.date DESC`, params);
  ok(res, rows);
}));

// GET /api/attendance?month=YYYY-MM&employeeId=
router.get('/', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { month, employeeId } = req.query;
  const conditions = [];
  const params = [];
  if (month) { params.push(month); conditions.push(`to_char(a.date, 'YYYY-MM') = $${params.length}`); }
  if (employeeId) { params.push(employeeId); conditions.push(`a.employee_id = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY a.date DESC, e.full_name`, params);
  ok(res, rows);
}));

// POST /api/attendance/check-in — điểm danh vào (cho chính mình)
router.post('/check-in', asyncHandler(async (req, res) => {
  const LATE_AFTER = '08:15';
  const row = await getOne(
    `INSERT INTO attendance (employee_id, date, check_in, status)
     VALUES ($1, CURRENT_DATE, CURRENT_TIME,
             CASE WHEN CURRENT_TIME > $2::time THEN 'late' ELSE 'present' END)
     ON CONFLICT (employee_id, date) DO NOTHING
     RETURNING id, to_char(check_in, 'HH24:MI') AS "checkIn", status`,
    [req.user.employeeId, LATE_AFTER]
  );
  if (!row) throw badRequest('Hôm nay bạn đã điểm danh rồi');
  created(res, row);
}));

// POST /api/attendance/check-out — điểm danh ra
router.post('/check-out', asyncHandler(async (req, res) => {
  const row = await getOne(
    `UPDATE attendance SET check_out = CURRENT_TIME
     WHERE employee_id = $1 AND date = CURRENT_DATE AND check_in IS NOT NULL
     RETURNING id, to_char(check_out, 'HH24:MI') AS "checkOut"`,
    [req.user.employeeId]
  );
  if (!row) throw badRequest('Bạn chưa điểm danh vào hôm nay');
  ok(res, row);
}));

module.exports = router;
