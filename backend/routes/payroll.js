/**
 * Payroll Routes
 * Path: routes/payroll.js
 * LƯU Ý: /employee/:employeeId, /export, /generate phải đặt TRƯỚC /:id
 */

const router = require('express').Router();
const { getAll, getOne, transaction } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');
const { notifyEmployee } = require('../utils/notify');

const SELECT = `
  SELECT p.id, p.employee_id AS "employeeId", e.full_name AS "employeeName",
         e.position, p.month,
         p.base_salary AS "baseSalary", p.allowances, p.deductions,
         p.advance_deduction AS "advanceDeduction", p.net_salary AS "netSalary",
         p.status, p.paid_date AS "paidDate", p.created_at AS "createdAt"
  FROM payroll_history p
  JOIN employees e ON e.id = p.employee_id
`;

// GET /api/payroll/employee/:employeeId — lịch sử lương 1 nhân viên
router.get('/employee/:employeeId', asyncHandler(async (req, res) => {
  if (!['QL', 'VP'].includes(req.user.role) && Number(req.params.employeeId) !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ xem được bảng lương của mình' });
  }
  const id = parseInt(req.params.employeeId);
  if (req.user.role === 'KT' && req.user.employeeId !== id) {
    return res.status(403).json({ success: false, error: 'Không có quyền xem lương người khác' });
  }
  const rows = await getAll(`${SELECT} WHERE p.employee_id = $1 ORDER BY p.month DESC`, [id]);
  ok(res, numerify(rows));
}));

// GET /api/payroll/export?month= (QL, VP) — trả JSON để frontend tự xuất file
router.get('/export', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { month } = req.query;
  if (!month) throw badRequest('Thiếu tháng cần xuất');
  const rows = await getAll(`${SELECT} WHERE p.month = $1 ORDER BY e.full_name`, [month]);
  ok(res, numerify(rows));
}));

// POST /api/payroll/generate (QL) — tạo bảng lương tháng cho toàn bộ NV active
router.post('/generate', requireRole('QL'), asyncHandler(async (req, res) => {
  const { month } = req.body; // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) throw badRequest('Tháng không hợp lệ (định dạng YYYY-MM)');

  const generated = await transaction(async (client) => {
    const employees = await client.query(
      `SELECT id, salary FROM employees WHERE status = 'active'`
    );
    const results = [];
    for (const emp of employees.rows) {
      // Tổng khấu trừ vay lương tháng này
      const adv = await client.query(
        `SELECT COALESCE(SUM(LEAST(monthly_deduction, remaining_balance)), 0) AS deduction
         FROM advance_salary WHERE employee_id = $1 AND status = 'approved' AND remaining_balance > 0`,
        [emp.id]
      );
      const advanceDeduction = Number(adv.rows[0].deduction);
      const baseSalary = Number(emp.salary);
      const allowances = 0;
      const deductions = 0;
      const netSalary = baseSalary + allowances - deductions - advanceDeduction;

      const inserted = await client.query(
        `INSERT INTO payroll_history (employee_id, month, base_salary, allowances, deductions, advance_deduction, net_salary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (employee_id, month) DO NOTHING
         RETURNING id`,
        [emp.id, month, baseSalary, allowances, deductions, advanceDeduction, netSalary]
      );
      if (inserted.rows.length > 0) results.push(inserted.rows[0].id);
    }
    return results;
  });

  // Thông báo (fire-and-forget)
  if (generated.length > 0) telegram.payrollGenerated(month, generated.length);

  ok(res, { month, generated: generated.length, message: `Đã tạo ${generated.length} bảng lương tháng ${month}` });
}));

// GET /api/payroll/my-detail?month=YYYY-MM — chi tiết thành phần lương cho KT
router.get('/my-detail', asyncHandler(async (req, res) => {
  const { month } = req.query;
  if (!month) throw badRequest('Thiếu tháng cần xem');
  const payroll = await getOne(`${SELECT} WHERE p.employee_id = $1 AND p.month = $2`, [req.user.employeeId, month]);
  if (!payroll) throw notFound('Không tìm thấy bảng lương tháng này');

  // Tính chi tiết thành phần
  const expenses = await getOne(
    `SELECT COALESCE(SUM(CASE WHEN need_reimburse = TRUE AND reimbursed_at IS NULL THEN amount ELSE 0 END), 0) AS unreimbursed
     FROM expenses WHERE created_by = $1 AND to_char(created_at, 'YYYY-MM') = $2`,
    [req.user.employeeId, month]
  );

  const leaves = await getOne(
    `SELECT COALESCE(SUM(EXTRACT(DAY FROM date_to - date_from + 1)), 0) AS unpaidDays
     FROM leaves WHERE employee_id = $1 AND leave_type = 'unpaid'
       AND to_char(date_from, 'YYYY-MM') <= $2 AND to_char(date_to, 'YYYY-MM') >= $2`,
    [req.user.employeeId, month]
  );

  const advances = await getOne(
    `SELECT COALESCE(SUM(monthly_deduction), 0) AS totalDeduction
     FROM advance_salary WHERE employee_id = $1 AND to_char(approved_date, 'YYYY-MM') <= $2
       AND status IN ('approved', 'completed') AND remaining_balance > 0`,
    [req.user.employeeId, month]
  );

  // Tính toán lương
  const baseSalary = Number(payroll.baseSalary) || 0;
  const advanceDeduction = Number(payroll.advanceDeduction) || 0;
  const unreimbursedAmount = Number(expenses.unreimbursed) || 0;
  const unpaidDays = Number(leaves.unpaidDays) || 0;
  const leaveDeduction = unpaidDays * (baseSalary / 26); // Giả định 26 ngày/tháng

  // TODO: Bonus sẽ được tính khi hoàn thành hiệu suất (mục 6)
  const bonus = 0;

  const netSalary = baseSalary - advanceDeduction - unreimbursedAmount - leaveDeduction + bonus;

  ok(res, {
    month,
    baseSalary,
    deductions: {
      advance: advanceDeduction,
      unreimbursed: unreimbursedAmount,
      unpaidLeave: { days: unpaidDays, amount: leaveDeduction },
    },
    bonuses: bonus,
    netSalary,
  });
}));

// GET /api/payroll?month=
router.get('/', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const conditions = [];
  const params = [];
  if (month) { params.push(month); conditions.push(`p.month = $${params.length}`); }
  if (req.user.role === 'KT') {
    params.push(req.user.employeeId);
    conditions.push(`p.employee_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY p.month DESC, e.full_name`, params);
  ok(res, numerify(rows));
}));

// GET /api/payroll/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE p.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy bảng lương');
  if (req.user.role === 'KT' && row.employeeId !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Không có quyền xem lương người khác' });
  }
  ok(res, numerify(row));
}));

// Chuyển trạng thái: draft → approved → processing → paid
function transitionRoute(action, from, to, extraSQL = '') {
  return asyncHandler(async (req, res) => {
    const row = await getOne(
      `UPDATE payroll_history SET status = $1 ${extraSQL}
       WHERE id = $2 AND status = $3 RETURNING id`,
      [to, req.params.id, from]
    );
    if (!row) throw badRequest(`Bảng lương không ở trạng thái "${from}" hoặc không tồn tại`);
    ok(res, { id: row.id, status: to });
  });
}

// POST /api/payroll/:id/approve (QL)
router.post('/:id/approve', requireRole('QL'), transitionRoute('approve', 'draft', 'approved'));

// POST /api/payroll/:id/process (QL)
router.post('/:id/process', requireRole('QL'), transitionRoute('process', 'approved', 'processing'));

// POST /api/payroll/:id/pay (QL) — thanh toán + trừ dư nợ vay lương
router.post('/:id/pay', requireRole('QL'), asyncHandler(async (req, res) => {
  const result = await transaction(async (client) => {
    const upd = await client.query(
      `UPDATE payroll_history SET status = 'paid', paid_date = CURRENT_DATE
       WHERE id = $1 AND status = 'processing'
       RETURNING id, employee_id, advance_deduction`,
      [req.params.id]
    );
    if (upd.rows.length === 0) return null;
    const payroll = upd.rows[0];

    // Trừ dư nợ các khoản vay đã duyệt
    if (Number(payroll.advance_deduction) > 0) {
      await client.query(
        `UPDATE advance_salary SET
           remaining_balance = GREATEST(0, remaining_balance - LEAST(monthly_deduction, remaining_balance)),
           status = CASE
             WHEN remaining_balance - LEAST(monthly_deduction, remaining_balance) <= 0 THEN 'completed'
             ELSE status
           END
         WHERE employee_id = $1 AND status = 'approved' AND remaining_balance > 0`,
        [payroll.employee_id]
      );
    }
    return payroll;
  });
  if (!result) throw badRequest('Bảng lương không ở trạng thái "processing" hoặc không tồn tại');

  // Thông báo (fire-and-forget)
  getOne(`${SELECT} WHERE p.id = $1`, [result.id]).then((payroll) => {
    telegram.payrollPaid(payroll);
    notifyEmployee(payroll.employeeId, 'payroll', 'Lương đã được thanh toán',
      `Tháng ${payroll.month} — thực nhận ${Number(payroll.netSalary).toLocaleString('vi-VN')} đ`);
  }).catch(() => {});

  ok(res, { id: result.id, status: 'paid' });
}));

module.exports = router;
