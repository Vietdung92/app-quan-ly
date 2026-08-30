/**
 * Task Routes
 * Path: routes/tasks.js
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');
const { notifyEmployee } = require('../utils/notify');

const SELECT = `
  SELECT t.id, t.title, t.description, t.priority, t.status,
         t.assigned_to AS "assignedTo", e.full_name AS "assignedToName",
         t.due_date AS "dueDate", t.project_id AS "projectId", p.name AS "projectName",
         t.notes, t.created_at AS "createdAt"
  FROM tasks t
  LEFT JOIN employees e ON e.id = t.assigned_to
  LEFT JOIN projects p ON p.id = t.project_id
`;

// GET /api/tasks?priority=&assignedTo=&status=
router.get('/', asyncHandler(async (req, res) => {
  const { priority, assignedTo, status } = req.query;
  const conditions = [];
  const params = [];
  if (priority) { params.push(priority); conditions.push(`t.priority = $${params.length}`); }
  if (assignedTo) { params.push(assignedTo); conditions.push(`t.assigned_to = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
  // KT chỉ thấy việc của mình
  if (req.user.role === 'KT') {
    params.push(req.user.employeeId);
    conditions.push(`t.assigned_to = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY t.id DESC`, params);
  ok(res, numerify(rows));
}));

// GET /api/tasks/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE t.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy công việc');
  ok(res, numerify(row));
}));

// POST /api/tasks (QL, VP)
router.post('/', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { title, description, priority, assignedTo, dueDate, projectId, notes } = req.body;
  if (!title) throw badRequest('Tiêu đề công việc là bắt buộc');
  const row = await getOne(
    `INSERT INTO tasks (title, description, priority, assigned_to, due_date, project_id, notes, created_by)
     VALUES ($1, $2, COALESCE($3, 'medium'), $4, $5, $6, $7, $8) RETURNING id`,
    [title, description, priority, assignedTo || null, dueDate || null, projectId || null, notes, req.user.userId]
  );
  const task = await getOne(`${SELECT} WHERE t.id = $1`, [row.id]);

  // Thông báo (fire-and-forget)
  if (task.assignedTo) {
    telegram.taskAssigned(task);
    notifyEmployee(task.assignedTo, 'task', 'Công việc mới được giao',
      `${task.title}${task.dueDate ? ` — hạn ${new Date(task.dueDate).toLocaleDateString('vi-VN')}` : ''}`);
  }

  created(res, numerify(task));
}));

// PUT /api/tasks/:id (QL, VP)
router.put('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { title, description, priority, status, assignedTo, dueDate, projectId, notes } = req.body;
  const row = await getOne(
    `UPDATE tasks SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       priority = COALESCE($3, priority),
       status = COALESCE($4, status),
       assigned_to = COALESCE($5, assigned_to),
       due_date = COALESCE($6, due_date),
       project_id = COALESCE($7, project_id),
       notes = COALESCE($8, notes),
       updated_at = NOW()
     WHERE id = $9 RETURNING id`,
    [title, description, priority, status, assignedTo, dueDate, projectId, notes, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy công việc');
  const task = await getOne(`${SELECT} WHERE t.id = $1`, [row.id]);
  ok(res, numerify(task));
}));

// DELETE /api/tasks/:id (QL, VP)
router.delete('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM tasks WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy công việc');
  ok(res, { id: row.id, message: 'Đã xóa công việc' });
}));

// PATCH /api/tasks/:id/status — người được giao hoặc QL/VP đều đổi được
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw badRequest('Thiếu trạng thái');

  const task = await getOne(`SELECT id, assigned_to FROM tasks WHERE id = $1`, [req.params.id]);
  if (!task) throw notFound('Không tìm thấy công việc');
  if (req.user.role === 'KT' && task.assigned_to !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Chỉ được cập nhật công việc của mình' });
  }

  await getOne(`UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`, [status, task.id]);
  ok(res, { id: task.id, status });
}));

// PATCH /api/tasks/:id/assign (QL, VP)
router.patch('/:id/assign', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) throw badRequest('Thiếu nhân viên được giao');
  const row = await getOne(
    `UPDATE tasks SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
    [employeeId, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy công việc');

  // Thông báo (fire-and-forget)
  getOne(`${SELECT} WHERE t.id = $1`, [row.id]).then((task) => {
    telegram.taskAssigned(task);
    notifyEmployee(employeeId, 'task', 'Công việc mới được giao', task.title);
  }).catch(() => {});

  ok(res, { id: row.id, assignedTo: employeeId });
}));

module.exports = router;
