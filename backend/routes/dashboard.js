/**
 * Dashboard Routes
 * Path: routes/dashboard.js
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, numerify } = require('../utils/respond');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');

async function buildStats() {
  // SỐ THẬT từ sổ Thu Chi Quỹ (không dùng dữ liệu demo)
  const month = new Date().toISOString().slice(0, 7);
  const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
  const prevMonth = prev.toISOString().slice(0, 7);
  const row = await getOne(
    `SELECT
       (SELECT COUNT(*) FROM projects) AS "totalProjects",
       (SELECT COUNT(*) FROM employees WHERE status = 'active') AS "totalEmployees",
       (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress')) AS "pendingTasks",
       (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions
        WHERE type = 'Thu' AND to_char(date, 'YYYY-MM') = $1) AS "monthlyIncome",
       (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions
        WHERE type = 'Chi' AND to_char(date, 'YYYY-MM') = $1) AS "monthlyExpenses",
       (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions
        WHERE type = 'Thu' AND to_char(date, 'YYYY-MM') = $2) AS "prevIncome",
       (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions
        WHERE type = 'Chi' AND to_char(date, 'YYYY-MM') = $2) AS "prevExpenses",
       (SELECT COALESCE(SUM(CASE WHEN type = 'Thu' THEN amount ELSE -amount END), 0)
        FROM fund_transactions) AS "fundBalance",
       (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions WHERE type = 'Chi') AS "totalExpenses"`,
    [month, prevMonth]
  );
  const pct = (cur, before) => (Number(before) > 0 ? Math.round(((Number(cur) - Number(before)) / Number(before)) * 100) : null);
  return {
    totalProjects: Number(row.totalProjects),
    totalExpenses: Number(row.totalExpenses),
    totalEmployees: Number(row.totalEmployees),
    pendingTasks: Number(row.pendingTasks),
    monthlyIncome: Number(row.monthlyIncome),
    monthlyExpenses: Number(row.monthlyExpenses),
    fundBalance: Number(row.fundBalance),
    incomeChangePct: pct(row.monthlyIncome, row.prevIncome),
    expenseChangePct: pct(row.monthlyExpenses, row.prevExpenses),
    month,
  };
}

async function buildActivities(limit = 10) {
  return getAll(
    `(SELECT id, 'project' AS type, name AS description, created_at AS date FROM projects)
     UNION ALL
     (SELECT id, 'expense' AS type, name AS description, created_at AS date FROM expenses)
     UNION ALL
     (SELECT id, 'task' AS type, title AS description, created_at AS date FROM tasks)
     UNION ALL
     (SELECT id, 'leave' AS type, ('Đơn nghỉ phép #' || id) AS description, created_at AS date FROM leave_requests)
     ORDER BY date DESC LIMIT $1`,
    [limit]
  );
}

// GET /api/dashboard/overview
router.get('/overview', asyncHandler(async (req, res) => {
  const [stats, activities] = await Promise.all([buildStats(), buildActivities(10)]);
  ok(res, { stats, activities });
}));

// GET /api/dashboard/stats
router.get('/stats', asyncHandler(async (req, res) => {
  ok(res, await buildStats());
}));

// GET /api/dashboard/activities?limit=
router.get('/activities', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '10'), 50);
  ok(res, await buildActivities(limit));
}));

// GET /api/dashboard/chart/expense-trend — chi phí 6 tháng gần nhất
router.get('/chart/expense-trend', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT to_char(date, 'YYYY-MM') AS month, SUM(amount) AS amount
     FROM expenses
     WHERE status = 'approved' AND date >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY 1 ORDER BY 1`
  );
  ok(res, rows.map((r) => ({ month: r.month, amount: Number(r.amount) })));
}));

// GET /api/dashboard/chart/monthly — doanh thu (lương chi trả) vs chi phí 6 tháng
router.get('/chart/monthly', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `WITH months AS (
       SELECT to_char(d, 'YYYY-MM') AS month
       FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
                            date_trunc('month', CURRENT_DATE), '1 month') d
     )
     SELECT m.month,
       COALESCE((SELECT SUM(budget) FROM projects
                 WHERE to_char(COALESCE(end_date, start_date), 'YYYY-MM') = m.month
                   AND status IN ('in_progress', 'completed')), 0) AS income,
       COALESCE((SELECT SUM(amount) FROM expenses
                 WHERE status = 'approved' AND to_char(date, 'YYYY-MM') = m.month), 0) AS expenses
     FROM months m ORDER BY m.month`
  );
  ok(res, rows.map((r) => ({
    month: r.month, income: Number(r.income), expenses: Number(r.expenses),
  })));
}));

// GET /api/dashboard/chart/project-status
router.get('/chart/project-status', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT status AS name, COUNT(*) AS value FROM projects GROUP BY status`
  );
  ok(res, rows.map((r) => ({ name: r.name, value: Number(r.value) })));
}));

// GET /api/dashboard/projects
router.get('/projects', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT status, COUNT(*) AS count, COALESCE(SUM(budget), 0) AS budget, COALESCE(SUM(spent), 0) AS spent
     FROM projects GROUP BY status`
  );
  ok(res, rows.map((r) => ({
    status: r.status, count: Number(r.count), budget: Number(r.budget), spent: Number(r.spent),
  })));
}));

// GET /api/dashboard/expenses
router.get('/expenses', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT category, COALESCE(SUM(amount), 0) AS total
     FROM expenses WHERE status = 'approved' GROUP BY category ORDER BY total DESC`
  );
  ok(res, rows.map((r) => ({ category: r.category, total: Number(r.total) })));
}));

// GET /api/dashboard/employees
router.get('/employees', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT status, COUNT(*) AS count FROM employees GROUP BY status`
  );
  ok(res, rows.map((r) => ({ status: r.status, count: Number(r.count) })));
}));

// GET /api/dashboard/summary — alias của stats
router.get('/summary', asyncHandler(async (req, res) => {
  ok(res, await buildStats());
}));


// GET /api/dashboard/my?from=&to= — tổng quan CÁ NHÂN + lịch sử theo bộ lọc thời gian
router.get('/my', asyncHandler(async (req, res) => {
  const empId = req.user.employeeId;
  const now = new Date();
  const from = req.query.from || now.toISOString().slice(0, 7) + '-01';
  const to = req.query.to || now.toISOString().slice(0, 10);

  const tasks = await getOne(`
    SELECT COUNT(*) AS "assigned",
           COUNT(*) FILTER (WHERE status = 'completed') AS "done",
           COUNT(*) FILTER (WHERE status != 'completed' AND due_date < CURRENT_DATE) AS "overdue"
    FROM tasks WHERE assigned_to = $1`, [empId]);

  const todayTasks = await getAll(`
    SELECT id, title, status, priority, due_date AS "dueDate",
           (due_date < CURRENT_DATE) AS "isOverdue"
    FROM tasks
    WHERE assigned_to = $1 AND status != 'completed'
      AND (due_date <= CURRENT_DATE OR due_date IS NULL)
    ORDER BY due_date ASC NULLS LAST LIMIT 10`, [empId]);

  const expenseList = await getAll(`
    SELECT x.id, x.name, x.amount, x.date, x.status,
           x.need_reimburse AS "needReimburse", x.reimbursed_at AS "reimbursedAt",
           p.name AS "projectName"
    FROM expenses x LEFT JOIN projects p ON p.id = x.project_id
    WHERE x.created_by = $1 AND x.date BETWEEN $2::date AND $3::date
    ORDER BY x.date DESC, x.id DESC`, [req.user.userId, from, to]);

  const advanceList = await getAll(`
    SELECT id, amount, status, remaining_balance AS "remainingBalance",
           reason, created_at AS "createdAt"
    FROM advance_salary
    WHERE employee_id = $1 AND created_at::date BETWEEN $2::date AND $3::date
    ORDER BY id DESC`, [empId, from, to]);

  const attendanceList = await getAll(`
    SELECT date, check_in AS "checkIn", check_out AS "checkOut", status
    FROM attendance
    WHERE employee_id = $1 AND date BETWEEN $2::date AND $3::date
    ORDER BY date DESC`, [empId, from, to]);

  const leaveList = await getAll(`
    SELECT id, type, start_date AS "startDate", end_date AS "endDate", days, status
    FROM leave_requests
    WHERE employee_id = $1 AND start_date BETWEEN $2::date AND $3::date
    ORDER BY id DESC`, [empId, from, to]);

  const attendanceToday = await getOne(`
    SELECT check_in AS "checkIn", check_out AS "checkOut"
    FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE`, [empId]);

  const expenseSum = expenseList.reduce((a, x) => a + Number(x.amount), 0);
  ok(res, {
    range: { from, to },
    tasks: { assigned: Number(tasks.assigned), done: Number(tasks.done), overdue: Number(tasks.overdue) },
    todayTasks: numerify(todayTasks),
    expenses: { total: expenseSum, list: numerify(expenseList) },
    advances: {
      remaining: advanceList.filter((a) => a.status === 'approved').reduce((s2, a) => s2 + Number(a.remainingBalance), 0),
      list: numerify(advanceList),
    },
    attendance: { days: attendanceList.length, list: numerify(attendanceList) },
    leaves: numerify(leaveList),
    attendanceToday: attendanceToday || null,
  });
}));

// GET /api/dashboard/workbench (QL, VP) — bàn làm việc: mọi thứ đang chờ xử lý
router.get('/workbench', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const month = new Date().toISOString().slice(0, 7);
  const row = await getOne(`
    SELECT
      (SELECT COUNT(*) FROM expenses WHERE status = 'pending') AS "pendingExpenses",
      (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') AS "pendingLeaves",
      (SELECT COUNT(*) FROM advance_salary WHERE status = 'pending') AS "pendingAdvances",
      (SELECT COUNT(*) FROM expenses WHERE need_reimburse AND status = 'approved' AND reimbursed_at IS NULL) AS "toReimburse",
      (SELECT COUNT(*) FROM repair_requests WHERE status = 'new') AS "newRepairs",
      (SELECT COUNT(*) FROM repair_requests WHERE status IN ('received','in_progress')
         AND created_at < NOW() - INTERVAL '3 days') AS "staleRepairs",
      (SELECT COUNT(*) FROM rent_payments WHERE month = $1 AND status != 'paid') AS "rentUnpaid",
      (SELECT COALESCE(SUM(amount_due - amount_paid), 0) FROM rent_payments WHERE month = $1 AND status != 'paid') AS "rentUnpaidAmount",
      (SELECT COUNT(*) FROM owner_payments WHERE month = $1 AND status != 'paid') AS "ownerUnpaid",
      (SELECT COALESCE(SUM(amount_due - amount_paid), 0) FROM owner_payments WHERE month = $1 AND status != 'paid') AS "ownerUnpaidAmount",
      (SELECT COUNT(*) FROM tax_payments WHERE status = 'pending' AND month <= $1) AS "taxDue",
      (SELECT COUNT(*) FROM apartment_details WHERE contract_end BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS "tenantContractsExpiring",
      (SELECT COUNT(*) FROM apartment_details WHERE owner_contract_end BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS "ownerContractsExpiring",
      (SELECT COUNT(*) FROM apartment_residents WHERE is_active AND residence_expiry <= CURRENT_DATE + 30) AS "residentsExpiring",
      (SELECT COALESCE(SUM(CASE WHEN type = 'Thu' THEN amount ELSE -amount END), 0) FROM fund_transactions) AS "fundBalance",
      (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions WHERE type = 'Thu' AND to_char(date, 'YYYY-MM') = $1) AS "monthIncome",
      (SELECT COALESCE(SUM(amount), 0) FROM fund_transactions WHERE type = 'Chi' AND to_char(date, 'YYYY-MM') = $1) AS "monthExpense"
  `, [month]);
  const out = {};
  Object.entries(row).forEach(([k, v]) => { out[k] = Number(v); });
  out.month = month;
  ok(res, out);
}));

// GET /api/dashboard/performance?month=YYYY-MM (QL) — hiệu suất từng nhân viên
router.get('/performance', requireRole('QL'), asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows = await getAll(`
    SELECT e.id, e.full_name AS "fullName", e.role, e.position,
      (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = e.id
         AND to_char(t.created_at, 'YYYY-MM') <= $1
         AND (t.status != 'completed' OR to_char(t.updated_at, 'YYYY-MM') = $1)) AS "activeInMonth",
      (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = e.id
         AND t.status = 'completed' AND to_char(t.updated_at, 'YYYY-MM') = $1) AS "done",
      (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = e.id
         AND t.status != 'completed' AND t.due_date < CURRENT_DATE) AS "overdue",
      (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = e.id
         AND t.status = 'completed' AND to_char(t.updated_at, 'YYYY-MM') = $1
         AND (t.due_date IS NULL OR t.updated_at::date <= t.due_date)) AS "onTime",
      (SELECT COUNT(*) FROM attendance a WHERE a.employee_id = e.id
         AND to_char(a.date, 'YYYY-MM') = $1 AND a.check_in IS NOT NULL) AS "workDays",
      (SELECT COUNT(*) FROM expenses x JOIN users u ON u.id = x.created_by
         WHERE u.employee_id = e.id AND to_char(x.date, 'YYYY-MM') = $1) AS "expensesEntered",
      (SELECT COUNT(*) FROM task_photos tp WHERE tp.employee_id = e.id
         AND to_char(tp.created_at, 'YYYY-MM') = $1) AS "photosSent"
    FROM employees e WHERE e.status = 'active'
    ORDER BY e.role, e.full_name`, [month]);
  ok(res, { month, employees: numerify(rows) });
}));

module.exports = router;
