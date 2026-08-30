/**
 * Expense Routes v2 (Chi phí phát sinh — KT/VP nhập, VP/QL duyệt → tự ghi vào Quỹ)
 * Path: routes/expenses.js
 *
 * Luồng: nhân viên nhập chi phí (dự án hoặc văn phòng, hạng mục Quỹ, ảnh chuyển khoản)
 * → ảnh + thông tin gửi Telegram ngay [CHỜ DUYỆT]
 * → VP/QL duyệt → TỰ TẠO giao dịch Chi trong Thu Chi Quỹ đúng dự án + hạng mục
 * → khoản "chi tiền túi" vào danh sách cần hoàn, VP bấm "Đã hoàn" khi chuyển khoản lại.
 */

const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getAll, getOne, transaction } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');
const { notifyManagers, notifyUsers, getEmployeeName } = require('../utils/notify');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, `expense-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

const SELECT = `
  SELECT x.id, x.name, x.description, x.amount, x.category, x.date, x.status,
         x.notes, x.project_id AS "projectId", p.name AS "projectName",
         x.fund_group_id AS "fundGroupId", g.name AS "fundGroupName",
         x.fund_category_id AS "fundCategoryId", fc.name AS "fundCategoryName",
         x.need_reimburse AS "needReimburse", x.reimbursed_at AS "reimbursedAt",
         x.image_path AS "imagePath", x.fund_transaction_id AS "fundTransactionId",
         x.rejected_reason AS "rejectedReason",
         ce.full_name AS "createdBy", ae.full_name AS "approvedBy",
         x.created_at AS "createdAt"
  FROM expenses x
  LEFT JOIN projects p ON p.id = x.project_id
  LEFT JOIN fund_groups g ON g.id = x.fund_group_id
  LEFT JOIN fund_categories fc ON fc.id = x.fund_category_id
  LEFT JOIN users cu ON cu.id = x.created_by
  LEFT JOIN employees ce ON ce.id = cu.employee_id
  LEFT JOIN users au ON au.id = x.approved_by
  LEFT JOIN employees ae ON ae.id = au.employee_id
`;

// GET /api/expenses?status=&from=&to=&needReimburse=1
router.get('/', asyncHandler(async (req, res) => {
  const { status, from, to, needReimburse } = req.query;
  const params = [];
  const conditions = [];
  if (status) { params.push(status); conditions.push(`x.status = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`x.date >= $${params.length}::date`); }
  if (to) { params.push(to); conditions.push(`x.date <= $${params.length}::date`); }
  if (needReimburse === '1') {
    conditions.push(`x.need_reimburse = TRUE AND x.status = 'approved' AND x.reimbursed_at IS NULL`);
  }
  // Nhân viên thường chỉ thấy chi phí do chính mình tạo
  if (!['QL', 'VP'].includes(req.user.role)) {
    params.push(req.user.userId);
    conditions.push(`x.created_by = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await getAll(`${SELECT} ${where} ORDER BY x.id DESC`, params);

  const summary = await getOne(`
    SELECT COUNT(*) FILTER (WHERE status = 'pending') AS "pending",
           COUNT(*) FILTER (WHERE need_reimburse AND status = 'approved' AND reimbursed_at IS NULL) AS "toReimburse"
    FROM expenses`);
  ok(res, {
    expenses: numerify(rows),
    summary: { pending: Number(summary.pending), toReimburse: Number(summary.toReimburse) },
  });
}));

// GET /api/expenses/meta — nhóm + hạng mục Chi của Quỹ cho form nhập
router.get('/meta', asyncHandler(async (req, res) => {
  const groups = await getAll(
    `SELECT id, name FROM fund_groups WHERE name IN ('Dự án', 'Văn phòng')`
  );
  const groupIds = groups.map((r) => r.id);
  const categories = await getAll(
    `SELECT id, group_id AS "groupId", name FROM fund_categories
     WHERE type = 'Chi' AND group_id = ANY($1::int[]) ORDER BY name`,
    [groupIds]
  );
  ok(res, {
    projectGroupId: groups.find((r) => r.name === 'Dự án')?.id || null,
    officeGroupId: groups.find((r) => r.name === 'Văn phòng')?.id || null,
    categories,
  });
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
  if (!['QL', 'VP'].includes(req.user.role) && row.createdBy !== null) {
    const mine = await getOne(`SELECT 1 FROM expenses WHERE id = $1 AND created_by = $2`, [req.params.id, req.user.userId]);
    if (!mine) return res.status(403).json({ success: false, error: 'Bạn chỉ xem được chi phí của mình' });
  }
  ok(res, numerify(row));
}));

// POST /api/expenses — multipart (ảnh chuyển khoản tùy chọn)
router.post('/', upload.single('photo'), asyncHandler(async (req, res) => {
  const { name, description, amount, date, notes, projectId, fundCategoryId, needReimburse } = req.body;
  if (!name || !amount) throw badRequest('Nội dung chi và số tiền là bắt buộc');
  if (Number(amount) <= 0) throw badRequest('Số tiền phải là số dương');

  // Xác định nhóm Quỹ: có dự án → nhóm "Dự án", không → "Văn phòng"
  const groupName = projectId ? 'Dự án' : 'Văn phòng';
  const group = await getOne(`SELECT id FROM fund_groups WHERE name = $1`, [groupName]);
  if (!group) throw badRequest(`Chưa có nhóm "${groupName}" trong Quỹ`);

  // Hạng mục (nếu chọn) phải là hạng mục Chi của đúng nhóm
  let catId = null;
  if (fundCategoryId) {
    const cat = await getOne(
      `SELECT id FROM fund_categories WHERE id = $1 AND group_id = $2 AND type = 'Chi'`,
      [parseInt(fundCategoryId, 10), group.id]
    );
    if (!cat) throw badRequest('Hạng mục không thuộc nhóm đã chọn');
    catId = cat.id;
  }

  const row = await getOne(
    `INSERT INTO expenses
       (name, description, amount, category, date, notes, project_id, created_by,
        fund_group_id, fund_category_id, need_reimburse, image_path)
     VALUES ($1, $2, $3, 'other', COALESCE($4, CURRENT_DATE), $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      name, description || null, amount, date || null, notes || null,
      projectId ? parseInt(projectId, 10) : null, req.user.userId,
      group.id, catId,
      needReimburse === 'true' || needReimburse === true || needReimburse === '1',
      req.file ? req.file.filename : null,
    ]
  );
  const expense = await getOne(`${SELECT} WHERE x.id = $1`, [row.id]);

  // Telegram: caption theo mẫu cấu hình, kèm ảnh nếu có
  const cfg = await getOne(`SELECT value FROM config WHERE key = 'expense_photo_caption'`);
  const caption = String(cfg?.value || '💸 [CHỜ DUYỆT] {name} — {amount} đ — {employee}')
    .replaceAll('{name}', expense.name)
    .replaceAll('{project}', expense.projectName || 'Văn phòng')
    .replaceAll('{amount}', Number(expense.amount).toLocaleString('vi-VN'))
    .replaceAll('{employee}', expense.createdBy || '')
    .replaceAll('{note}', expense.notes || '')
    .replaceAll('{date}', new Date(expense.date).toLocaleDateString('vi-VN'));
  if (req.file) {
    fs.promises.readFile(req.file.path)
      .then((buf) => telegram.sendPhoto(buf, req.file.filename, caption))
      .catch(() => {});
  } else {
    telegram.sendMessage(caption);
  }
  notifyManagers('expense', 'Chi phí mới chờ duyệt',
    `${expense.name} — ${Number(expense.amount).toLocaleString('vi-VN')} đ (${expense.createdBy || 'N/A'})`);

  created(res, numerify(expense));
}));

// PUT /api/expenses/:id — chỉ sửa được khi còn pending
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, description, amount, date, notes } = req.body;
  const row = await getOne(
    `UPDATE expenses SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       amount = COALESCE($3, amount),
       date = COALESCE($4, date),
       notes = COALESCE($5, notes)
     WHERE id = $6 AND status = 'pending' RETURNING id`,
    [name, description, amount, date, notes, req.params.id]
  );
  if (!row) throw badRequest('Chi phí không tồn tại hoặc đã được duyệt (không sửa được)');
  const expense = await getOne(`${SELECT} WHERE x.id = $1`, [row.id]);
  ok(res, numerify(expense));
}));

// DELETE /api/expenses/:id (QL, VP)
router.delete('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM expenses WHERE id = $1 RETURNING id, image_path`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy chi phí');
  if (row.image_path) fs.unlink(path.join(UPLOAD_DIR, row.image_path), () => {});
  ok(res, { id: row.id, message: 'Đã xóa chi phí' });
}));

// POST /api/expenses/:id/approve (QL, VP) — duyệt → TỰ GHI VÀO QUỸ
router.post('/:id/approve', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const result = await transaction(async (client) => {
    const cur = await client.query(
      `SELECT x.*, ce.full_name AS creator_name, p.name AS project_name, p.fund_object_id
       FROM expenses x
       LEFT JOIN users cu ON cu.id = x.created_by
       LEFT JOIN employees ce ON ce.id = cu.employee_id
       LEFT JOIN projects p ON p.id = x.project_id
       WHERE x.id = $1 AND x.status = 'pending' FOR UPDATE OF x`,
      [req.params.id]
    );
    if (cur.rows.length === 0) return null;
    const x = cur.rows[0];

    // Nhóm Quỹ (dữ liệu cũ có thể chưa gắn nhóm → suy ra)
    let groupId = x.fund_group_id;
    if (!groupId) {
      const g = await client.query(`SELECT id FROM fund_groups WHERE name = $1`, [x.project_id ? 'Dự án' : 'Văn phòng']);
      groupId = g.rows[0]?.id;
    }

    // Đối tượng = đối tượng Quỹ của dự án (tạo nếu dự án chưa có)
    let objectId = null;
    if (x.project_id) {
      objectId = x.fund_object_id;
      if (!objectId && x.project_name) {
        const og = await client.query(`SELECT id FROM fund_groups WHERE name = 'Dự án'`);
        const oRes = await client.query(
          `INSERT INTO fund_objects (group_id, name, status) VALUES ($1, $2, 'Đang hoạt động')
           ON CONFLICT (group_id, name) DO UPDATE SET status = fund_objects.status RETURNING id`,
          [og.rows[0].id, x.project_name]
        );
        objectId = oRes.rows[0].id;
        await client.query(`UPDATE projects SET fund_object_id = $1 WHERE id = $2`, [objectId, x.project_id]);
      }
    }

    // Giao dịch Chi trong Quỹ
    const txRes = await client.query(
      `INSERT INTO fund_transactions (type, date, group_id, object_id, category_id, amount, person, reimburse, notes, created_by)
       VALUES ('Chi', $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        x.date, groupId, objectId, x.fund_category_id, x.amount,
        x.creator_name || null,
        x.need_reimburse ? 'Chưa hoàn' : null,
        `[Chi phí #${x.id}] ${x.name}${x.notes ? ' — ' + x.notes : ''}`,
        req.user.userId,
      ]
    );

    await client.query(
      `UPDATE expenses SET status = 'approved', approved_by = $1, fund_transaction_id = $2 WHERE id = $3`,
      [req.user.userId, txRes.rows[0].id, x.id]
    );
    if (x.project_id) {
      await client.query(`UPDATE projects SET spent = spent + $1, updated_at = NOW() WHERE id = $2`, [x.amount, x.project_id]);
    }
    return { id: x.id, name: x.name, amount: x.amount, created_by: x.created_by, fundTxId: txRes.rows[0].id };
  });
  if (!result) throw badRequest('Chi phí không tồn tại hoặc đã được xử lý');

  getEmployeeName(req.user.employeeId).then((approver) => {
    telegram.sendMessage(`✅ <b>Đã duyệt chi phí</b>: ${result.name} — ${Number(result.amount).toLocaleString('vi-VN')} đ (đã ghi vào Quỹ)\nNgười duyệt: ${approver || ''}`);
  });
  if (result.created_by) {
    notifyUsers([result.created_by], 'expense', 'Chi phí đã được duyệt',
      `${result.name} — ${Number(result.amount).toLocaleString('vi-VN')} đ (đã ghi vào Quỹ)`);
  }
  ok(res, { id: result.id, status: 'approved', fundTransactionId: result.fundTxId });
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

  getEmployeeName(req.user.employeeId).then((approver) => {
    telegram.sendMessage(`❌ <b>Từ chối chi phí</b>: ${row.name}${reason ? `\nLý do: ${reason}` : ''}\nNgười từ chối: ${approver || ''}`);
  });
  if (row.created_by) {
    notifyUsers([row.created_by], 'expense', 'Chi phí bị từ chối',
      `${row.name}${reason ? ` — Lý do: ${reason}` : ''}`);
  }
  ok(res, { id: row.id, status: 'rejected' });
}));

// POST /api/expenses/:id/reimburse (QL, VP) — đã chuyển khoản hoàn tiền cho nhân viên
router.post('/:id/reimburse', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const row = await getOne(
    `UPDATE expenses SET reimbursed_at = NOW()
     WHERE id = $1 AND need_reimburse = TRUE AND status = 'approved' AND reimbursed_at IS NULL
     RETURNING id, name, amount, created_by, fund_transaction_id`,
    [req.params.id]
  );
  if (!row) throw badRequest('Khoản này không nằm trong danh sách cần hoàn');
  if (row.fund_transaction_id) {
    await getOne(`UPDATE fund_transactions SET reimburse = 'Đã hoàn' WHERE id = $1 RETURNING id`, [row.fund_transaction_id]).catch(() => {});
  }
  if (row.created_by) {
    notifyUsers([row.created_by], 'expense', 'Đã hoàn tiền',
      `${row.name} — ${Number(row.amount).toLocaleString('vi-VN')} đ đã được chuyển hoàn cho bạn`);
  }
  ok(res, { id: row.id, message: 'Đã đánh dấu hoàn tiền' });
}));

module.exports = router;
