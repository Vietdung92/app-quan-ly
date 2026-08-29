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
  const { priority, assignedTo, status, projectId, from, to } = req.query;
  const conditions = [];
  const params = [];
  if (priority) { params.push(priority); conditions.push(`t.priority = $${params.length}`); }
  if (assignedTo) { params.push(assignedTo); conditions.push(`t.assigned_to = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
  if (projectId) { params.push(projectId); conditions.push(`t.project_id = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`COALESCE(t.due_date, t.created_at::date) >= $${params.length}::date`); }
  if (to) { params.push(to); conditions.push(`COALESCE(t.due_date, t.created_at::date) <= $${params.length}::date`); }
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
  if (!['QL', 'VP'].includes(req.user.role) && row.assignedTo !== req.user.employeeId) {
    return res.status(403).json({ success: false, error: 'Bạn chỉ xem được công việc của mình' });
  }
  ok(res, numerify(row));
}));

// POST /api/tasks — QL/VP giao cho ai cũng được; KT tự tạo việc CHO CHÍNH MÌNH
router.post('/', asyncHandler(async (req, res) => {
  const { title, description, priority, dueDate, projectId, notes } = req.body;
  let { assignedTo } = req.body;
  if (!title) throw badRequest('Tiêu đề công việc là bắt buộc');
  if (!['QL', 'VP'].includes(req.user.role)) {
    assignedTo = req.user.employeeId; // KT luôn tự gán cho mình
  }
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

// ===== Ảnh báo cáo công việc =====
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, `task-${req.params.id}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype));
  },
});

// GET /api/tasks/:id/photos — danh sách ảnh của công việc
router.get('/:id/photos', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT p.id, p.file_path AS "filePath", p.note, p.created_at AS "createdAt",
            e.full_name AS "employeeName"
     FROM task_photos p LEFT JOIN employees e ON e.id = p.employee_id
     WHERE p.task_id = $1 ORDER BY p.id DESC`,
    [req.params.id]
  );
  ok(res, rows);
}));

// POST /api/tasks/:id/photos — chụp/tải ảnh, tự gửi Telegram kèm caption cấu hình
router.post('/:id/photos', upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('Vui lòng chọn ảnh (JPG/PNG, tối đa 10MB)');
  const task = await getOne(`${SELECT} WHERE t.id = $1`, [req.params.id]);
  if (!task) {
    fs.unlink(req.file.path, () => {});
    throw notFound('Không tìm thấy công việc');
  }
  const note = String(req.body.note || '').trim().slice(0, 500);

  const row = await getOne(
    `INSERT INTO task_photos (task_id, employee_id, file_path, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, file_path AS "filePath", note, created_at AS "createdAt"`,
    [req.params.id, req.user.employeeId, req.file.filename, note || null]
  );

  // Caption theo mẫu cấu hình trong bảng config
  const cfg = await getOne(`SELECT value FROM config WHERE key = 'task_photo_caption'`);
  const employee = await getOne(`SELECT full_name AS "fullName" FROM employees WHERE id = $1`, [req.user.employeeId]);
  const caption = String(cfg?.value || '📸 {task} - {employee}\n{note}')
    .replaceAll('{task}', task.title)
    .replaceAll('{employee}', employee?.fullName || '')
    .replaceAll('{note}', note)
    .replaceAll('{date}', new Date().toLocaleDateString('vi-VN'));

  // Gửi ảnh Telegram (fire-and-forget, không chặn phản hồi)
  fs.promises.readFile(req.file.path)
    .then((buf) => telegram.sendPhoto(buf, req.file.filename, caption))
    .catch(() => {});

  created(res, row);
}));

// GET/PUT /api/tasks/config/photo-caption — mẫu chú thích Telegram (sửa: QL, VP)
router.get('/config/photo-caption', asyncHandler(async (req, res) => {
  const cfg = await getOne(`SELECT value FROM config WHERE key = 'task_photo_caption'`);
  ok(res, { value: cfg?.value || '' });
}));
router.put('/config/photo-caption', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const value = String(req.body.value || '').trim();
  if (!value) throw badRequest('Mẫu chú thích không được để trống');
  await getOne(
    `INSERT INTO config (key, value) VALUES ('task_photo_caption', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1 RETURNING key`,
    [value]
  );
  ok(res, { value });
}));

module.exports = router;
