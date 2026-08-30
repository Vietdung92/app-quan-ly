/**
 * Project Routes
 * Path: routes/projects.js
 */

const router = require('express').Router();
const { getAll, getOne, transaction } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');

const SELECT = `
  SELECT p.id, p.name, p.description, p.status, p.budget, p.spent,
         p.start_date AS "startDate", p.end_date AS "endDate",
         m.full_name AS "manager",
         COALESCE(
           (SELECT array_agg(e.full_name ORDER BY e.full_name)
            FROM project_members pm JOIN employees e ON e.id = pm.employee_id
            WHERE pm.project_id = p.id),
           '{}'
         ) AS "team"
  FROM projects p
  LEFT JOIN employees m ON m.id = p.manager_id
`;

// GET /api/projects?status=
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status) { params.push(status); where = `WHERE p.status = $1`; }
  const rows = await getAll(`${SELECT} ${where} ORDER BY p.id DESC`, params);
  ok(res, numerify(rows));
}));

// GET /api/projects/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE p.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy dự án');
  ok(res, numerify(row));
}));

// GET /api/projects/:id/budget
router.get('/:id/budget', asyncHandler(async (req, res) => {
  const row = await getOne(
    `SELECT budget, spent, (budget - spent) AS remaining FROM projects WHERE id = $1`,
    [req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy dự án');
  ok(res, { budget: Number(row.budget), spent: Number(row.spent), remaining: Number(row.remaining) });
}));

// POST /api/projects — QL/VP đầy đủ; KT tạo nhanh (chỉ tên) để gắn chi phí/công việc
router.post('/', asyncHandler(async (req, res) => {
  const isManager = ['QL', 'VP'].includes(req.user.role);
  const { description, status, budget, startDate, endDate, managerId, team } = isManager ? req.body : {};
  const name = String(req.body.name || '').trim();
  if (!name) throw badRequest('Tên dự án là bắt buộc');

  const dup = await getOne(`SELECT id FROM projects WHERE LOWER(name) = LOWER($1)`, [name]);
  if (dup) throw badRequest(`Dự án "${name}" đã tồn tại`);

  // Chuẩn hóa: chuỗi rỗng từ form → null; người quản lý mặc định là người tạo
  const mgr = managerId ? parseInt(managerId, 10) : req.user.employeeId;

  const projectId = await transaction(async (client) => {
    // Đồng bộ: tạo đối tượng Quỹ trùng tên trong nhóm "Dự án"
    const og = await client.query(`SELECT id FROM fund_groups WHERE name = 'Dự án'`);
    let fundObjectId = null;
    if (og.rows.length) {
      const oRes = await client.query(
        `INSERT INTO fund_objects (group_id, name, status) VALUES ($1, $2, 'Đang hoạt động')
         ON CONFLICT (group_id, name) DO UPDATE SET status = fund_objects.status RETURNING id`,
        [og.rows[0].id, name]
      );
      fundObjectId = oRes.rows[0].id;
    }
    const result = await client.query(
      `INSERT INTO projects (name, description, status, budget, start_date, end_date, manager_id, created_by, fund_object_id)
       VALUES ($1, $2, COALESCE($3, 'pending'), COALESCE($4, 0), $5, $6, $7, $8, $9)
       RETURNING id`,
      [name, description || null, status || null, budget || null, startDate || null, endDate || null, mgr, req.user.userId, fundObjectId]
    );
    const id = result.rows[0].id;
    if (Array.isArray(team)) {
      for (const employeeId of team) {
        await client.query(
          `INSERT INTO project_members (project_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, employeeId]
        );
      }
    }
    return id;
  });

  const project = await getOne(`${SELECT} WHERE p.id = $1`, [projectId]);
  created(res, numerify(project));
}));

// PUT /api/projects/:id (QL, VP)
router.put('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  let { name, description, status, budget, spent, startDate, endDate, managerId } = req.body;
  // Chuỗi rỗng từ form → null để COALESCE giữ giá trị cũ
  budget = budget === '' ? null : budget;
  spent = spent === '' ? null : spent;
  startDate = startDate || null;
  endDate = endDate || null;
  managerId = managerId ? parseInt(managerId, 10) : null;
  // Đổi tên → đồng bộ đối tượng Quỹ (lịch sử giao dịch giữ nguyên vì nối bằng id)
  if (name) {
    const dup = await getOne(`SELECT id FROM projects WHERE LOWER(name) = LOWER($1) AND id != $2`, [name, req.params.id]);
    if (dup) throw badRequest(`Dự án "${name}" đã tồn tại`);
    const cur = await getOne(`SELECT fund_object_id FROM projects WHERE id = $1`, [req.params.id]);
    if (cur?.fund_object_id) {
      await getOne(`UPDATE fund_objects SET name = $1 WHERE id = $2 RETURNING id`, [name, cur.fund_object_id]).catch(() => {});
    }
  }
  const row = await getOne(
    `UPDATE projects SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       status = COALESCE($3, status),
       budget = COALESCE($4, budget),
       spent = COALESCE($5, spent),
       start_date = COALESCE($6, start_date),
       end_date = COALESCE($7, end_date),
       manager_id = COALESCE($8, manager_id),
       updated_at = NOW()
     WHERE id = $9 RETURNING id`,
    [name, description, status, budget, spent, startDate, endDate, managerId, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy dự án');
  const project = await getOne(`${SELECT} WHERE p.id = $1`, [row.id]);
  ok(res, numerify(project));
}));

// DELETE /api/projects/:id (QL)
router.delete('/:id', requireRole('QL'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM projects WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy dự án');
  ok(res, { id: row.id, message: 'Đã xóa dự án' });
}));

// PATCH /api/projects/:id/status (QL, VP)
router.patch('/:id/status', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw badRequest('Thiếu trạng thái');
  const row = await getOne(
    `UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
    [status, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy dự án');
  ok(res, { id: row.id, status });
}));

module.exports = router;
