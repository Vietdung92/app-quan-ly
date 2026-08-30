/**
 * Repair Management Routes (Quản lý báo hỏng - NỘI BỘ)
 * Path: routes/repairs.js
 *
 * Nhân viên xem/tiếp nhận yêu cầu báo hỏng của khách thuê,
 * giao việc cho kỹ thuật, cập nhật trạng thái.
 * Kèm quản lý tài khoản khách thuê (QL/VP cấp tài khoản theo căn).
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getAll, getOne } = require('../config/database');
const { ok, created } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');

const SELECT = `
  SELECT r.id, r.object_id AS "objectId", o.name AS "apartment",
         r.category, r.description, r.image_link AS "imageLink",
         r.status, r.staff_notes AS "staffNotes",
         r.assigned_to AS "assignedTo", e.full_name AS "assignedName",
         r.created_at AS "createdAt", r.updated_at AS "updatedAt", r.resolved_at AS "resolvedAt"
  FROM repair_requests r
  JOIN fund_objects o ON o.id = r.object_id
  LEFT JOIN employees e ON e.id = r.assigned_to
`;

// GET /api/repairs?status=
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status) { params.push(status); where = 'WHERE r.status = $1'; }
  const rows = await getAll(`${SELECT} ${where} ORDER BY (r.status IN ('done','cancelled')), r.id DESC`, params);
  const summary = await getOne(`
    SELECT COUNT(*) FILTER (WHERE status = 'new') AS "new",
           COUNT(*) FILTER (WHERE status IN ('received','in_progress')) AS "inProgress",
           COUNT(*) FILTER (WHERE status = 'done') AS "done"
    FROM repair_requests
  `);
  ok(res, {
    repairs: rows,
    summary: { new: Number(summary.new), inProgress: Number(summary.inProgress), done: Number(summary.done) },
  });
}));

// PUT /api/repairs/:id — cập nhật trạng thái / giao việc / ghi chú (QL, VP, KT)
router.put('/:id', asyncHandler(async (req, res) => {
  const { status, assignedTo, staffNotes, acceptRepair } = req.body;
  const STATUSES = ['new', 'received', 'in_progress', 'done', 'cancelled'];
  if (status && !STATUSES.includes(status)) throw badRequest('Trạng thái không hợp lệ');

  const canAssign = ['QL', 'VP'].includes(req.user.role);
  const repair = await getOne(`${SELECT} WHERE r.id = $1`, [req.params.id]);
  if (!repair) throw notFound('Không tìm thấy yêu cầu báo hỏng');

  // KT tự nhận việc: acceptRepair = true + repair chưa ai nhận (assigned_to = null)
  if (req.user.role === 'KT' && acceptRepair === true) {
    if (repair.assignedTo !== null) throw badRequest('Công việc này đã được giao cho người khác');
    if (repair.status !== 'new') throw badRequest('Chỉ có thể nhận việc ở trạng thái mới');
  }

  const sets = ['updated_at = NOW()'];
  const params = [];
  if (status) {
    params.push(status); sets.push(`status = $${params.length}`);
    if (status === 'done') sets.push('resolved_at = NOW()');
  }
  if (canAssign && 'assignedTo' in req.body) {
    params.push(assignedTo ? parseInt(assignedTo, 10) : null);
    sets.push(`assigned_to = $${params.length}`);
  } else if (req.user.role === 'KT' && acceptRepair === true) {
    // KT tự nhận: gán cho chính mình + đổi status thành 'received'
    params.push(req.user.employeeId); sets.push(`assigned_to = $${params.length}`);
    params.push('received'); sets.push(`status = $${params.length}`);
  }
  if ('staffNotes' in req.body) {
    params.push(staffNotes || null); sets.push(`staff_notes = $${params.length}`);
  }
  params.push(req.params.id);

  const row = await getOne(
    `UPDATE repair_requests SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!row) throw notFound('Không tìm thấy yêu cầu báo hỏng');
  const updatedRepair = await getOne(`${SELECT} WHERE r.id = $1`, [row.id]);

  if (status === 'done') {
    telegram.sendMessage(`✅ <b>Đã xử lý xong báo hỏng</b>\nCăn: <b>${updatedRepair.apartment}</b>\nNội dung: ${updatedRepair.description.slice(0, 200)}`);
  } else if (canAssign && assignedTo && updatedRepair.assignedName) {
    telegram.sendMessage(`🔧 <b>Giao việc sửa chữa</b>\nCăn: <b>${updatedRepair.apartment}</b>\nGiao cho: ${updatedRepair.assignedName}\nNội dung: ${updatedRepair.description.slice(0, 200)}`);
  } else if (req.user.role === 'KT' && acceptRepair === true && updatedRepair.assignedName) {
    telegram.sendMessage(`🔧 <b>Kỹ thuật nhận việc sửa chữa</b>\nCăn: <b>${updatedRepair.apartment}</b>\nNhân viên: ${updatedRepair.assignedName}\nNội dung: ${updatedRepair.description.slice(0, 200)}`);
  }
  ok(res, updatedRepair);
}));

// ===== Quản lý tài khoản khách thuê =====

// GET /api/repairs/tenants — danh sách căn + trạng thái tài khoản (QL, VP)
router.get('/tenants/list', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const rows = await getAll(`
    SELECT o.id AS "objectId", o.name AS "apartment", d.tenant_name AS "tenantName",
           t.id AS "accountId", t.login, t.is_active AS "isActive", t.last_login AS "lastLogin"
    FROM fund_objects o
    JOIN apartment_details d ON d.object_id = o.id
    LEFT JOIN tenant_accounts t ON t.object_id = o.id
    ORDER BY o.name
  `);
  ok(res, rows);
}));

// POST /api/repairs/tenants — cấp tài khoản cho căn (QL, VP)
router.post('/tenants', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { objectId, login, password } = req.body;
  if (!objectId || !login || !password) throw badRequest('Cần đủ: căn hộ, tên đăng nhập, mật khẩu');
  if (String(password).length < 6) throw badRequest('Mật khẩu tối thiểu 6 ký tự');

  const existing = await getOne(`SELECT id FROM tenant_accounts WHERE object_id = $1`, [parseInt(objectId, 10)]);
  if (existing) throw badRequest('Căn này đã có tài khoản — dùng nút đặt lại mật khẩu');

  const row = await getOne(
    `INSERT INTO tenant_accounts (object_id, login, password_hash)
     VALUES ($1, $2, $3) RETURNING id, login`,
    [parseInt(objectId, 10), String(login).trim(), bcrypt.hashSync(String(password), 10)]
  );
  created(res, row);
}));

// PUT /api/repairs/tenants/:id — đặt lại mật khẩu / bật tắt (QL, VP)
router.put('/tenants/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { password, isActive } = req.body;
  const sets = [];
  const params = [];
  if (password) {
    if (String(password).length < 6) throw badRequest('Mật khẩu tối thiểu 6 ký tự');
    params.push(bcrypt.hashSync(String(password), 10));
    sets.push(`password_hash = $${params.length}`);
  }
  if (typeof isActive === 'boolean') {
    params.push(isActive); sets.push(`is_active = $${params.length}`);
  }
  if (!sets.length) throw badRequest('Không có dữ liệu cập nhật');
  params.push(req.params.id);
  const row = await getOne(
    `UPDATE tenant_accounts SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id, login`,
    params
  );
  if (!row) throw notFound('Không tìm thấy tài khoản');
  ok(res, row);
}));

// DELETE /api/repairs/tenants/:id (QL)
router.delete('/tenants/:id', requireRole('QL'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM tenant_accounts WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy tài khoản');
  ok(res, { id: row.id, message: 'Đã xóa tài khoản khách thuê' });
}));

module.exports = router;
