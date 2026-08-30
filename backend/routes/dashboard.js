/**
 * Dashboard Routes
 * Path: routes/dashboard.js
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok } = require('../utils/respond');
const { asyncHandler } = require('../middleware/errorHandler');

async function buildStats() {
  const month = new Date().toISOString().slice(0, 7);
  const row = await getOne(
    `SELECT
       (SELECT COUNT(*) FROM projects) AS "totalProjects",
       (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved') AS "totalExpenses",
       (SELECT COUNT(*) FROM employees WHERE status = 'active') AS "totalEmployees",
       (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress')) AS "pendingTasks",
       (SELECT COALESCE(SUM(net_salary), 0) FROM payroll_history WHERE month = $1) AS "monthlyPayroll",
       (SELECT COALESCE(SUM(amount), 0) FROM expenses
        WHERE status = 'approved' AND to_char(date, 'YYYY-MM') = $1) AS "monthlyExpenses",
       (SELECT COALESCE(SUM(budget), 0) FROM projects
        WHERE status IN ('in_progress', 'completed')
          AND to_char(COALESCE(end_date, start_date), 'YYYY-MM') = $1) AS "monthlyIncome"`,
    [month]
  );
  return {
    totalProjects: Number(row.totalProjects),
    totalExpenses: Number(row.totalExpenses),
    totalEmployees: Number(row.totalEmployees),
    pendingTasks: Number(row.pendingTasks),
    monthlyIncome: Number(row.monthlyIncome),
    monthlyExpenses: Number(row.monthlyExpenses),
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

module.exports = router;
