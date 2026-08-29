/**
 * Tax Routes (Thuế Hộ Chủ Nhà)
 * Path: routes/taxes.js
 *
 * Theo dõi đóng thuế hộ chủ nhà theo từng căn:
 * hồ sơ thuế (MST, kỳ hạn, tiền thuê khai thuế) + checklist đóng theo tháng.
 * Đánh dấu đã đóng → tự tạo giao dịch Chi trong Quỹ.
 */

const router = require('express').Router();
const { getAll, getOne, transaction } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');

const APARTMENT_GROUP = 'QLCH - Căn hộ';
const TAX_CATEGORY = 'Thuế & phí pháp lý căn hộ';

const SELECT = `
  SELECT t.id, t.label, t.owner_name AS "ownerName", t.tax_code AS "taxCode",
         t.months, t.start_date AS "startDate", t.end_date AS "endDate",
         t.declared_rent AS "declaredRent", t.monthly_tax AS "monthlyTax",
         t.file_label AS "fileLabel", t.drive_link AS "driveLink",
         t.notes, t.is_active AS "isActive",
         (SELECT COUNT(*) FROM tax_payments p WHERE p.tax_id = t.id AND p.status = 'paid') AS "paidMonths",
         (SELECT COUNT(*) FROM tax_payments p WHERE p.tax_id = t.id) AS "totalMonths",
         (SELECT COUNT(*) FROM tax_payments p WHERE p.tax_id = t.id AND p.status = 'pending'
            AND p.month <= to_char(CURRENT_DATE, 'YYYY-MM')) AS "overdueMonths",
         (SELECT COALESCE(SUM(p.amount), 0) FROM tax_payments p WHERE p.tax_id = t.id AND p.status = 'paid') AS "paidTotal"
  FROM apartment_taxes t
`;

const PAYMENTS_SELECT = `
  SELECT p.id, p.tax_id AS "taxId", p.month, p.amount, p.status,
         p.paid_date AS "paidDate", p.fund_transaction_id AS "fundTransactionId", p.notes
  FROM tax_payments p
`;

// Sinh danh sách tháng YYYY-MM từ start đến end
function monthRange(start, end) {
  const out = [];
  const d = new Date(start.slice(0, 7) + '-01T00:00:00Z');
  const stop = end.slice(0, 7);
  for (let i = 0; i < 60; i++) {
    const m = d.toISOString().slice(0, 7);
    out.push(m);
    if (m >= stop) break;
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

// GET /api/taxes — danh sách hồ sơ thuế + tiến độ
router.get('/', asyncHandler(async (req, res) => {
  const rows = await getAll(`${SELECT} WHERE t.is_active = TRUE ORDER BY t.id`);
  const summary = {
    total: rows.length,
    overdue: rows.filter((r) => Number(r.overdueMonths) > 0).length,
    monthlyTaxTotal: rows.reduce((s, r) => s + Number(r.monthlyTax || 0), 0),
  };
  ok(res, { taxes: numerify(rows), summary: numerify(summary) });
}));

// GET /api/taxes/:id — hồ sơ + checklist tháng
router.get('/:id', asyncHandler(async (req, res) => {
  const tax = await getOne(`${SELECT} WHERE t.id = $1`, [req.params.id]);
  if (!tax) throw notFound('Không tìm thấy hồ sơ thuế');
  const payments = await getAll(
    `${PAYMENTS_SELECT} WHERE p.tax_id = $1 ORDER BY p.month`,
    [req.params.id]
  );
  ok(res, { ...numerify(tax), payments: numerify(payments) });
}));

// POST /api/taxes (QL, VP) — tạo hồ sơ + tự sinh checklist theo kỳ hạn
router.post('/', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const {
    label, ownerName, taxCode, months, startDate, endDate,
    declaredRent, monthlyTax, fileLabel, driveLink, notes,
  } = req.body;
  if (!label) throw badRequest('Tên căn (dự án_mã căn) là bắt buộc');

  const mTax = monthlyTax || (declaredRent ? Math.round(declaredRent * 0.1) : 0);

  const taxId = await transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO apartment_taxes
         (label, owner_name, tax_code, months, start_date, end_date,
          declared_rent, monthly_tax, file_label, drive_link, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        label, ownerName || null, taxCode || null,
        months ? parseInt(months, 10) : null,
        startDate || null, endDate || null,
        declaredRent || null, mTax || null,
        fileLabel || null, driveLink || null, notes || null,
      ]
    );
    const id = result.rows[0].id;
    if (startDate && endDate) {
      for (const m of monthRange(startDate, endDate)) {
        await client.query(
          `INSERT INTO tax_payments (tax_id, month, amount) VALUES ($1, $2, $3)
           ON CONFLICT (tax_id, month) DO NOTHING`,
          [id, m, mTax || 0]
        );
      }
    }
    return id;
  });

  const tax = await getOne(`${SELECT} WHERE t.id = $1`, [taxId]);
  created(res, numerify(tax));
}));

// PUT /api/taxes/:id (QL, VP)
router.put('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const FIELD_MAP = {
    label: 'label', ownerName: 'owner_name', taxCode: 'tax_code',
    months: 'months', startDate: 'start_date', endDate: 'end_date',
    declaredRent: 'declared_rent', monthlyTax: 'monthly_tax',
    fileLabel: 'file_label', driveLink: 'drive_link', notes: 'notes',
    isActive: 'is_active',
  };
  const sets = [];
  const params = [];
  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (key in req.body) {
      let val = req.body[key];
      if (val === '') val = null;
      if (key === 'months' && val !== null) val = parseInt(val, 10);
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (!sets.length) throw badRequest('Không có dữ liệu cập nhật');
  params.push(req.params.id);
  const row = await getOne(
    `UPDATE apartment_taxes SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!row) throw notFound('Không tìm thấy hồ sơ thuế');
  const tax = await getOne(`${SELECT} WHERE t.id = $1`, [row.id]);
  ok(res, numerify(tax));
}));

// POST /api/taxes/:id/generate (QL, VP) — sinh thêm tháng còn thiếu theo kỳ hạn
router.post('/:id/generate', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const tax = await getOne(`${SELECT} WHERE t.id = $1`, [req.params.id]);
  if (!tax) throw notFound('Không tìm thấy hồ sơ thuế');
  if (!tax.startDate || !tax.endDate) throw badRequest('Cần có ngày bắt đầu và kết thúc để sinh checklist');

  const start = new Date(tax.startDate).toISOString();
  const end = new Date(tax.endDate).toISOString();
  let createdCount = 0;
  await transaction(async (client) => {
    for (const m of monthRange(start, end)) {
      const r = await client.query(
        `INSERT INTO tax_payments (tax_id, month, amount) VALUES ($1, $2, $3)
         ON CONFLICT (tax_id, month) DO NOTHING`,
        [tax.id, m, Number(tax.monthlyTax) || 0]
      );
      createdCount += r.rowCount;
    }
  });
  ok(res, { created: createdCount, message: `Đã sinh ${createdCount} tháng mới` });
}));

// POST /api/taxes/payments/:paymentId/pay (QL, VP) — đánh dấu đã đóng → Chi trong Quỹ
router.post('/payments/:paymentId/pay', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { amount, paidDate } = req.body;

  const result = await transaction(async (client) => {
    const pRes = await client.query(
      `SELECT p.*, t.label FROM tax_payments p
       JOIN apartment_taxes t ON t.id = p.tax_id
       WHERE p.id = $1 FOR UPDATE`,
      [req.params.paymentId]
    );
    if (!pRes.rows.length) throw notFound('Không tìm thấy kỳ thuế');
    const payment = pRes.rows[0];
    if (payment.status === 'paid') throw badRequest('Kỳ thuế này đã được đánh dấu đóng rồi');

    const payAmount = amount ? Number(amount) : Number(payment.amount);
    const date = paidDate || new Date().toISOString().slice(0, 10);

    // Giao dịch Chi trong Quỹ
    const groupRes = await client.query(`SELECT id FROM fund_groups WHERE name = $1`, [APARTMENT_GROUP]);
    let fundTxId = null;
    if (groupRes.rows.length) {
      const groupId = groupRes.rows[0].id;
      const catRes = await client.query(
        `SELECT id FROM fund_categories WHERE group_id = $1 AND type = 'Chi' AND name = $2`,
        [groupId, TAX_CATEGORY]
      );
      const txRes = await client.query(
        `INSERT INTO fund_transactions (type, date, group_id, category_id, amount, notes, created_by)
         VALUES ('Chi', $1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          date, groupId, catRes.rows.length ? catRes.rows[0].id : null,
          payAmount, `Đóng thuế hộ ${payment.label} tháng ${payment.month}`, req.user.userId,
        ]
      );
      fundTxId = txRes.rows[0].id;
    }

    await client.query(
      `UPDATE tax_payments SET status = 'paid', amount = $1, paid_date = $2, fund_transaction_id = $3
       WHERE id = $4`,
      [payAmount, date, fundTxId, payment.id]
    );
    return { label: payment.label, month: payment.month, payAmount };
  });

  telegram.sendMessage(
    `🧾 <b>Đã đóng thuế hộ</b>\nCăn: <b>${result.label}</b>\nTháng: ${result.month}\nSố tiền: ${result.payAmount.toLocaleString('vi-VN')} đ`
  );
  ok(res, { message: 'Đã đánh dấu đóng thuế', ...result });
}));

// POST /api/taxes/payments/:paymentId/unpay (QL) — hoàn tác đánh dấu (xóa cả giao dịch Quỹ)
router.post('/payments/:paymentId/unpay', requireRole('QL'), asyncHandler(async (req, res) => {
  await transaction(async (client) => {
    const pRes = await client.query(
      `SELECT * FROM tax_payments WHERE id = $1 FOR UPDATE`,
      [req.params.paymentId]
    );
    if (!pRes.rows.length) throw notFound('Không tìm thấy kỳ thuế');
    const payment = pRes.rows[0];
    if (payment.status !== 'paid') throw badRequest('Kỳ thuế này chưa được đánh dấu đóng');
    if (payment.fund_transaction_id) {
      await client.query(`DELETE FROM fund_transactions WHERE id = $1`, [payment.fund_transaction_id]);
    }
    await client.query(
      `UPDATE tax_payments SET status = 'pending', paid_date = NULL, fund_transaction_id = NULL WHERE id = $1`,
      [payment.id]
    );
  });
  ok(res, { message: 'Đã hoàn tác — kỳ thuế trở về chưa đóng' });
}));

// DELETE /api/taxes/:id (QL)
router.delete('/:id', requireRole('QL'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM apartment_taxes WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy hồ sơ thuế');
  ok(res, { id: row.id, message: 'Đã xóa hồ sơ thuế' });
}));

module.exports = router;
