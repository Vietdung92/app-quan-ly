/**
 * Fund (Quỹ Thu Chi) Routes
 * Path: routes/funds.js
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');

const SELECT = `
  SELECT t.id, t.code, t.date, t.type,
         t.group_id AS "groupId", g.name AS "groupName",
         t.object_id AS "objectId", o.name AS "objectName",
         t.category_id AS "categoryId", c.name AS "categoryName",
         t.amount, t.person, t.reimburse, t.notes,
         t.entered_at AS "enteredAt"
  FROM fund_transactions t
  JOIN fund_groups g ON g.id = t.group_id
  LEFT JOIN fund_objects o ON o.id = t.object_id
  LEFT JOIN fund_categories c ON c.id = t.category_id
`;

function buildFilters(query, params, conditions) {
  const { type, groupId, objectId, from, to, search, reimburse } = query;
  if (type) { params.push(type); conditions.push(`t.type = $${params.length}`); }
  if (groupId) { params.push(groupId); conditions.push(`t.group_id = $${params.length}`); }
  if (objectId) { params.push(objectId); conditions.push(`t.object_id = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`t.date >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`t.date <= $${params.length}`); }
  if (reimburse) { params.push(reimburse); conditions.push(`t.reimburse = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(t.notes ILIKE $${params.length} OR t.person ILIKE $${params.length} OR c.name ILIKE $${params.length} OR o.name ILIKE $${params.length})`);
  }
}

// GET /api/funds/meta — nhóm + đối tượng + hạng mục cho form dropdown
router.get('/meta', asyncHandler(async (req, res) => {
  const groups = await getAll(`SELECT id, name, kind FROM fund_groups ORDER BY sort_order, id`);
  const objects = await getAll(
    `SELECT id, group_id AS "groupId", name, status FROM fund_objects ORDER BY name`
  );
  const categories = await getAll(
    `SELECT id, group_id AS "groupId", type, name FROM fund_categories ORDER BY name`
  );
  const people = await getAll(
    `SELECT DISTINCT person FROM fund_transactions WHERE person IS NOT NULL ORDER BY person`
  );
  ok(res, { groups, objects, categories, people: people.map((p) => p.person) });
}));

// GET /api/funds/summary — tổng thu/chi/số dư + breakdown theo nhóm
router.get('/summary', asyncHandler(async (req, res) => {
  const params = [];
  const conditions = [];
  buildFilters(req.query, params, conditions);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totals = await getOne(
    `SELECT COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Thu'), 0) AS thu,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Chi'), 0) AS chi,
            COUNT(*) AS count
     FROM fund_transactions t
     LEFT JOIN fund_categories c ON c.id = t.category_id
     LEFT JOIN fund_objects o ON o.id = t.object_id
     ${where}`,
    params
  );

  const byGroup = await getAll(
    `SELECT g.name,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Thu'), 0) AS thu,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Chi'), 0) AS chi
     FROM fund_transactions t
     JOIN fund_groups g ON g.id = t.group_id
     LEFT JOIN fund_categories c ON c.id = t.category_id
     LEFT JOIN fund_objects o ON o.id = t.object_id
     ${where}
     GROUP BY g.name, g.sort_order ORDER BY g.sort_order`,
    params
  );

  ok(res, {
    thu: Number(totals.thu),
    chi: Number(totals.chi),
    balance: Number(totals.thu) - Number(totals.chi),
    count: Number(totals.count),
    byGroup: byGroup.map((r) => ({ name: r.name, thu: Number(r.thu), chi: Number(r.chi) })),
  });
}));

// GET /api/funds/transactions?type=&groupId=&objectId=&from=&to=&search=&limit=&offset=
router.get('/transactions', asyncHandler(async (req, res) => {
  const params = [];
  const conditions = [];
  buildFilters(req.query, params, conditions);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(parseInt(req.query.limit || '500'), 1000);
  params.push(limit);
  const rows = await getAll(
    `${SELECT} ${where} ORDER BY t.date DESC, t.id DESC LIMIT $${params.length}`,
    params
  );
  ok(res, numerify(rows));
}));

// GET /api/funds/transactions/:id
router.get('/transactions/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE t.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy giao dịch');
  ok(res, numerify(row));
}));

// POST /api/funds/transactions — mọi người đăng nhập đều ghi được (như sheet cũ)
router.post('/transactions', asyncHandler(async (req, res) => {
  const { date, type, groupId, objectId, categoryId, amount, person, reimburse, notes } = req.body;
  if (!type || !['Thu', 'Chi'].includes(type)) throw badRequest('Loại phải là Thu hoặc Chi');
  if (!groupId) throw badRequest('Nhóm là bắt buộc');
  if (!amount || Number(amount) <= 0) throw badRequest('Số tiền phải là số dương');

  const code = 'GDCT' + Date.now();
  const row = await getOne(
    `INSERT INTO fund_transactions (code, date, type, group_id, object_id, category_id, amount, person, reimburse, notes, created_by)
     VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [code, date || null, type, groupId, objectId || null, categoryId || null,
     amount, person || null, reimburse || null, notes || null, req.user.userId]
  );
  const tx = await getOne(`${SELECT} WHERE t.id = $1`, [row.id]);
  created(res, numerify(tx));
}));

// PUT /api/funds/transactions/:id (QL, VP)
router.put('/transactions/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { date, type, groupId, objectId, categoryId, amount, person, reimburse, notes } = req.body;
  const row = await getOne(
    `UPDATE fund_transactions SET
       date = COALESCE($1, date),
       type = COALESCE($2, type),
       group_id = COALESCE($3, group_id),
       object_id = $4,
       category_id = $5,
       amount = COALESCE($6, amount),
       person = COALESCE($7, person),
       reimburse = $8,
       notes = COALESCE($9, notes)
     WHERE id = $10 RETURNING id`,
    [date, type, groupId, objectId || null, categoryId || null, amount, person,
     reimburse || null, notes, req.params.id]
  );
  if (!row) throw notFound('Không tìm thấy giao dịch');
  const tx = await getOne(`${SELECT} WHERE t.id = $1`, [row.id]);
  ok(res, numerify(tx));
}));

// DELETE /api/funds/transactions/:id (QL)
router.delete('/transactions/:id', requireRole('QL'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM fund_transactions WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy giao dịch');
  ok(res, { id: row.id, message: 'Đã xóa giao dịch' });
}));

// GET /api/funds/report/objects?groupId=&from=&to= — lãi/lỗ theo từng đối tượng (căn hộ/dự án)
router.get('/report/objects', asyncHandler(async (req, res) => {
  const { groupId, from, to } = req.query;
  const params = [];
  const conditions = [];
  if (groupId) { params.push(groupId); conditions.push(`t.group_id = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`t.date >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`t.date <= $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await getAll(
    `SELECT COALESCE(o.name, '(Không gắn đối tượng)') AS name,
            g.name AS "groupName",
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Thu'), 0) AS thu,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Chi'), 0) AS chi,
            COUNT(*) AS count,
            MIN(t.date) AS "firstDate",
            MAX(t.date) AS "lastDate"
     FROM fund_transactions t
     JOIN fund_groups g ON g.id = t.group_id
     LEFT JOIN fund_objects o ON o.id = t.object_id
     ${where}
     GROUP BY o.name, g.name
     ORDER BY (COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Thu'), 0) -
               COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'Chi'), 0)) ASC`,
    params
  );

  const result = rows.map((r) => ({
    name: r.name,
    groupName: r.groupName,
    thu: Number(r.thu),
    chi: Number(r.chi),
    balance: Number(r.thu) - Number(r.chi),
    count: Number(r.count),
    firstDate: r.firstDate,
    lastDate: r.lastDate,
  }));

  const totals = result.reduce(
    (acc, r) => ({ thu: acc.thu + r.thu, chi: acc.chi + r.chi }),
    { thu: 0, chi: 0 }
  );

  ok(res, {
    objects: result,
    totals: { ...totals, balance: totals.thu - totals.chi },
  });
}));

// GET /api/funds/recurring — danh sách chi cố định
router.get('/recurring', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT r.id, r.name, g.name AS "groupName", o.name AS "objectName", c.name AS "categoryName",
            r.amount, r.day_of_month AS "dayOfMonth", r.person, r.enabled
     FROM fund_recurring r
     JOIN fund_groups g ON g.id = r.group_id
     LEFT JOIN fund_objects o ON o.id = r.object_id
     LEFT JOIN fund_categories c ON c.id = r.category_id
     ORDER BY r.day_of_month`
  );
  ok(res, numerify(rows));
}));

module.exports = router;
