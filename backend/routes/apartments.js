/**
 * Apartment Management Routes (Quản Lý Căn Hộ)
 * Path: routes/apartments.js
 *
 * Hồ sơ hợp đồng từng căn + theo dõi thu tiền thuê hàng tháng.
 * Thu tiền → tự tạo giao dịch Thu trong Quỹ gắn đúng căn.
 */

const router = require('express').Router();
const { getAll, getOne, transaction } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');

const APARTMENT_GROUP = 'QLCH - Căn hộ';
const RENT_CATEGORY = 'Thu hộ tiền thuê';
const OWNER_PAY_CATEGORY = 'Trả chủ nhà';

const LIST_SELECT = `
  SELECT o.id, o.name, o.status,
         d.bedrooms, d.area, d.electric_code AS "electricCode", d.water_code AS "waterCode",
         d.image_link AS "imageLink", d.zalo_link AS "zaloLink",
         d.contract_link AS "contractLink", d.qr_link AS "qrLink",
         d.owner_name AS "ownerName", d.owner_phone AS "ownerPhone",
         d.owner_passport AS "ownerPassport", d.owner_bank AS "ownerBank",
         d.owner_rent AS "ownerRent", d.owner_deposit AS "ownerDeposit",
         d.owner_contract_start AS "ownerContractStart", d.owner_contract_end AS "ownerContractEnd",
         d.owner_payment_note AS "ownerPaymentNote",
         d.tenant_name AS "tenantName", d.tenant_phone AS "tenantPhone",
         d.rent_amount AS "rentAmount", d.deposit,
         d.contract_start AS "contractStart", d.contract_end AS "contractEnd",
         d.payment_day AS "paymentDay", d.payment_note AS "paymentNote",
         d.rental_form AS "rentalForm", d.building_fee AS "buildingFee",
         d.management_type AS "managementType", d.company_fee AS "companyFee",
         d.apt_status AS "aptStatus", d.address, d.notes,
         d.project_name AS "projectName", d.map_link AS "mapLink",
         (d.rent_amount - d.owner_rent) AS "grossMargin",
         (d.contract_end IS NOT NULL AND d.contract_end < CURRENT_DATE) AS "contractExpired",
         (d.contract_end IS NOT NULL AND d.contract_end >= CURRENT_DATE
          AND d.contract_end <= CURRENT_DATE + INTERVAL '30 days') AS "contractExpiringSoon",
         (d.owner_contract_end IS NOT NULL AND d.owner_contract_end < CURRENT_DATE) AS "ownerContractExpired",
         (d.owner_contract_end IS NOT NULL AND d.owner_contract_end >= CURRENT_DATE
          AND d.owner_contract_end <= CURRENT_DATE + INTERVAL '30 days') AS "ownerContractExpiringSoon"
  FROM fund_objects o
  JOIN fund_groups g ON g.id = o.group_id AND g.name = '${APARTMENT_GROUP}'
  LEFT JOIN apartment_details d ON d.object_id = o.id
`;

// GET /api/apartments?month=YYYY-MM&all=1 — danh sách căn + trạng thái thu/trả tháng
// Mặc định chỉ hiện căn CÓ HỒ SƠ (34 căn Eureka); all=1 hiện cả tên cũ trong Quỹ
router.get('/', asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const showAll = req.query.all === '1';
  const where = showAll ? '' : 'WHERE d.object_id IS NOT NULL';
  const apartments = await getAll(`${LIST_SELECT} ${where} ORDER BY o.name`);

  const rents = await getAll(
    `SELECT id, object_id AS "objectId", amount_due AS "amountDue",
            amount_paid AS "amountPaid", paid_date AS "paidDate", status
     FROM rent_payments WHERE month = $1`,
    [month]
  );
  const owed = await getAll(
    `SELECT id, object_id AS "objectId", amount_due AS "amountDue",
            amount_paid AS "amountPaid", paid_date AS "paidDate", status
     FROM owner_payments WHERE month = $1`,
    [month]
  );
  const rentMap = Object.fromEntries(rents.map((r) => [r.objectId, r]));
  const owedMap = Object.fromEntries(owed.map((r) => [r.objectId, r]));
  const result = apartments.map((a) => ({
    ...a,
    rent: rentMap[a.id] ? numerify(rentMap[a.id]) : null,
    ownerPay: owedMap[a.id] ? numerify(owedMap[a.id]) : null,
  }));

  const withContract = result.filter((a) => a.rentAmount > 0 || a.tenantName);
  const summary = {
    month,
    total: result.length,
    withContract: withContract.length,
    renting: result.filter((a) => a.aptStatus === 'Đang thuê').length,
    vacant: result.filter((a) => a.aptStatus === 'Đang trống').length,
    expiringSoon: result.filter((a) => a.contractExpiringSoon || a.ownerContractExpiringSoon).length,
    expired: result.filter((a) => a.contractExpired || a.ownerContractExpired).length,
    paid: rents.filter((r) => r.status === 'paid').length,
    unpaid: rents.filter((r) => r.status !== 'paid').length,
    totalDue: rents.reduce((s, r) => s + Number(r.amountDue), 0),
    totalPaid: rents.reduce((s, r) => s + Number(r.amountPaid), 0),
    ownerPaid: owed.filter((r) => r.status === 'paid').length,
    ownerUnpaid: owed.filter((r) => r.status !== 'paid').length,
    ownerTotalDue: owed.reduce((s, r) => s + Number(r.amountDue), 0),
    ownerTotalPaid: owed.reduce((s, r) => s + Number(r.amountPaid), 0),
  };

  ok(res, { apartments: numerify(result), summary });
}));

// GET /api/apartments/:objectId — chi tiết căn + lịch sử thu tiền
router.get('/:objectId', asyncHandler(async (req, res) => {
  const apartment = await getOne(`${LIST_SELECT} WHERE o.id = $1`, [req.params.objectId]);
  if (!apartment) throw notFound('Không tìm thấy căn hộ');

  const payments = await getAll(
    `SELECT id, month, amount_due AS "amountDue", amount_paid AS "amountPaid",
            paid_date AS "paidDate", status, notes,
            fund_transaction_id AS "fundTransactionId"
     FROM rent_payments WHERE object_id = $1 ORDER BY month DESC`,
    [req.params.objectId]
  );
  const ownerPayments = await getAll(
    `SELECT id, month, amount_due AS "amountDue", amount_paid AS "amountPaid",
            paid_date AS "paidDate", status, notes
     FROM owner_payments WHERE object_id = $1 ORDER BY month DESC`,
    [req.params.objectId]
  );

  ok(res, { ...numerify(apartment), payments: numerify(payments), ownerPayments: numerify(ownerPayments) });
}));

// PUT /api/apartments/:objectId — cập nhật hồ sơ (QL, VP)
router.put('/:objectId', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  // Verify object thuộc nhóm căn hộ
  const obj = await getOne(
    `SELECT o.id FROM fund_objects o JOIN fund_groups g ON g.id = o.group_id
     WHERE o.id = $1 AND g.name = '${APARTMENT_GROUP}'`,
    [req.params.objectId]
  );
  if (!obj) throw notFound('Không tìm thấy căn hộ');

  // Map field API (camelCase) → cột DB
  const FIELD_MAP = {
    bedrooms: 'bedrooms', area: 'area', electricCode: 'electric_code', waterCode: 'water_code',
    imageLink: 'image_link', zaloLink: 'zalo_link', contractLink: 'contract_link', qrLink: 'qr_link',
    ownerName: 'owner_name', ownerPhone: 'owner_phone', ownerPassport: 'owner_passport',
    ownerBank: 'owner_bank', ownerRent: 'owner_rent', ownerDeposit: 'owner_deposit',
    ownerContractStart: 'owner_contract_start', ownerContractEnd: 'owner_contract_end',
    ownerPaymentNote: 'owner_payment_note',
    tenantName: 'tenant_name', tenantPhone: 'tenant_phone',
    rentAmount: 'rent_amount', deposit: 'deposit',
    contractStart: 'contract_start', contractEnd: 'contract_end',
    paymentDay: 'payment_day', paymentNote: 'payment_note',
    rentalForm: 'rental_form', buildingFee: 'building_fee',
    managementType: 'management_type', companyFee: 'company_fee',
    aptStatus: 'apt_status', address: 'address', notes: 'notes',
    projectName: 'project_name', mapLink: 'map_link',
  };

  const cols = [];
  const vals = [];
  for (const [apiKey, col] of Object.entries(FIELD_MAP)) {
    if (apiKey in req.body) {
      cols.push(col);
      vals.push(req.body[apiKey] === '' ? null : req.body[apiKey]);
    }
  }
  if (cols.length === 0) throw badRequest('Không có trường nào để cập nhật');

  const placeholders = cols.map((_, i) => `$${i + 2}`);
  const updates = cols.map((c) => `${c} = EXCLUDED.${c}`);
  await getOne(
    `INSERT INTO apartment_details (object_id, ${cols.join(', ')}, updated_at)
     VALUES ($1, ${placeholders.join(', ')}, NOW())
     ON CONFLICT (object_id) DO UPDATE SET ${updates.join(', ')}, updated_at = NOW()
     RETURNING object_id`,
    [req.params.objectId, ...vals]
  );

  const apartment = await getOne(`${LIST_SELECT} WHERE o.id = $1`, [req.params.objectId]);
  ok(res, numerify(apartment));
}));

// POST /api/apartments/generate-rents { month } (QL, VP)
// Sinh kỳ thu tiền tháng cho mọi căn có giá thuê > 0 và HĐ còn hiệu lực
router.post('/generate-rents', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) throw badRequest('Tháng không hợp lệ (YYYY-MM)');

  const monthStart = `${month}-01`;
  const result = await getAll(
    `INSERT INTO rent_payments (object_id, month, amount_due)
     SELECT d.object_id, $1, d.rent_amount
     FROM apartment_details d
     WHERE d.rent_amount > 0
       AND (d.contract_start IS NULL OR d.contract_start <= ($2::date + INTERVAL '1 month - 1 day'))
       AND (d.contract_end IS NULL OR d.contract_end >= $2::date)
     ON CONFLICT (object_id, month) DO NOTHING
     RETURNING id`,
    [month, monthStart]
  );

  ok(res, { month, generated: result.length, message: `Đã tạo ${result.length} kỳ thu tiền tháng ${month}` });
}));

// POST /api/apartments/rents/:id/pay { amount?, paidDate?, person?, notes? } (QL, VP)
// Ghi nhận thu tiền → tự tạo giao dịch Thu trong Quỹ gắn đúng căn
router.post('/rents/:id/pay', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { amount, paidDate, person, notes } = req.body;

  const result = await transaction(async (client) => {
    const rentQ = await client.query(
      `SELECT r.id, r.object_id, r.month, r.amount_due, r.amount_paid, r.status,
              o.name AS object_name, o.group_id
       FROM rent_payments r JOIN fund_objects o ON o.id = r.object_id
       WHERE r.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (rentQ.rows.length === 0) return { error: 'Không tìm thấy kỳ thu tiền' };
    const rent = rentQ.rows[0];
    if (rent.status === 'paid') return { error: 'Kỳ này đã thu đủ tiền' };

    const payAmount = Number(amount) || (Number(rent.amount_due) - Number(rent.amount_paid));
    if (payAmount <= 0) return { error: 'Số tiền thu phải là số dương' };

    // Tạo giao dịch Thu trong Quỹ
    const catQ = await client.query(
      `SELECT c.id FROM fund_categories c
       WHERE c.group_id = $1 AND c.type = 'Thu' AND c.name = $2`,
      [rent.group_id, RENT_CATEGORY]
    );
    const txQ = await client.query(
      `INSERT INTO fund_transactions
         (code, date, type, group_id, object_id, category_id, amount, person, notes, created_by)
       VALUES ($1, COALESCE($2, CURRENT_DATE), 'Thu', $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      ['GDCT' + Date.now(), paidDate || null, rent.group_id, rent.object_id,
       catQ.rows[0]?.id || null, payAmount, person || null,
       notes || `Thu tiền thuê tháng ${rent.month} căn ${rent.object_name}`, req.user.userId]
    );

    // Cập nhật kỳ thu
    const newPaid = Number(rent.amount_paid) + payAmount;
    const newStatus = newPaid >= Number(rent.amount_due) ? 'paid' : 'partial';
    await client.query(
      `UPDATE rent_payments SET
         amount_paid = $1, status = $2,
         paid_date = COALESCE($3, CURRENT_DATE),
         fund_transaction_id = COALESCE(fund_transaction_id, $4),
         notes = COALESCE($5, notes)
       WHERE id = $6`,
      [newPaid, newStatus, paidDate || null, txQ.rows[0].id, notes || null, rent.id]
    );

    return {
      id: rent.id, objectName: rent.object_name, month: rent.month,
      amountPaid: newPaid, status: newStatus, fundTransactionId: txQ.rows[0].id, payAmount,
    };
  });

  if (result.error) throw badRequest(result.error);

  // Thông báo Telegram (fire-and-forget)
  telegram.sendMessage(
    `🏠 <b>Đã thu tiền thuê</b>\n` +
    `Căn: ${result.objectName} — tháng ${result.month}\n` +
    `💰 ${Number(result.payAmount).toLocaleString('vi-VN')} đ` +
    (result.status === 'partial' ? '\n⚠️ Mới thu một phần' : '')
  );

  ok(res, numerify(result));
}));

// POST /api/apartments/generate-owner-dues { month } (QL, VP)
// Sinh kỳ TRẢ CHỦ NHÀ cho căn thuê lại (sublease) có owner_rent > 0 và HĐ chủ còn hiệu lực
router.post('/generate-owner-dues', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { month } = req.body;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) throw badRequest('Tháng không hợp lệ (YYYY-MM)');

  const monthStart = `${month}-01`;
  const result = await getAll(
    `INSERT INTO owner_payments (object_id, month, amount_due)
     SELECT d.object_id, $1, d.owner_rent
     FROM apartment_details d
     WHERE d.management_type = 'sublease' AND d.owner_rent > 0
       AND (d.owner_contract_start IS NULL OR d.owner_contract_start <= ($2::date + INTERVAL '1 month - 1 day'))
       AND (d.owner_contract_end IS NULL OR d.owner_contract_end >= $2::date)
     ON CONFLICT (object_id, month) DO NOTHING
     RETURNING id`,
    [month, monthStart]
  );

  ok(res, { month, generated: result.length, message: `Đã tạo ${result.length} kỳ trả chủ nhà tháng ${month}` });
}));

// POST /api/apartments/owner-dues/:id/pay { amount?, paidDate?, person?, notes? } (QL, VP)
// Ghi nhận đã trả chủ nhà → tự tạo giao dịch Chi "Trả chủ nhà" trong Quỹ gắn đúng căn
router.post('/owner-dues/:id/pay', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { amount, paidDate, person, notes } = req.body;

  const result = await transaction(async (client) => {
    const dueQ = await client.query(
      `SELECT p.id, p.object_id, p.month, p.amount_due, p.amount_paid, p.status,
              o.name AS object_name, o.group_id
       FROM owner_payments p JOIN fund_objects o ON o.id = p.object_id
       WHERE p.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (dueQ.rows.length === 0) return { error: 'Không tìm thấy kỳ trả chủ nhà' };
    const due = dueQ.rows[0];
    if (due.status === 'paid') return { error: 'Kỳ này đã trả đủ' };

    const payAmount = Number(amount) || (Number(due.amount_due) - Number(due.amount_paid));
    if (payAmount <= 0) return { error: 'Số tiền phải là số dương' };

    const catQ = await client.query(
      `SELECT c.id FROM fund_categories c
       WHERE c.group_id = $1 AND c.type = 'Chi' AND c.name = $2`,
      [due.group_id, OWNER_PAY_CATEGORY]
    );
    const txQ = await client.query(
      `INSERT INTO fund_transactions
         (code, date, type, group_id, object_id, category_id, amount, person, notes, created_by)
       VALUES ($1, COALESCE($2, CURRENT_DATE), 'Chi', $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      ['GDCT' + Date.now(), paidDate || null, due.group_id, due.object_id,
       catQ.rows[0]?.id || null, payAmount, person || null,
       notes || `Trả chủ nhà tháng ${due.month} căn ${due.object_name}`, req.user.userId]
    );

    const newPaid = Number(due.amount_paid) + payAmount;
    const newStatus = newPaid >= Number(due.amount_due) ? 'paid' : 'partial';
    await client.query(
      `UPDATE owner_payments SET
         amount_paid = $1, status = $2,
         paid_date = COALESCE($3, CURRENT_DATE),
         fund_transaction_id = COALESCE(fund_transaction_id, $4),
         notes = COALESCE($5, notes)
       WHERE id = $6`,
      [newPaid, newStatus, paidDate || null, txQ.rows[0].id, notes || null, due.id]
    );

    return {
      id: due.id, objectName: due.object_name, month: due.month,
      amountPaid: newPaid, status: newStatus, fundTransactionId: txQ.rows[0].id, payAmount,
    };
  });

  if (result.error) throw badRequest(result.error);

  telegram.sendMessage(
    `🏦 <b>Đã trả tiền chủ nhà</b>\n` +
    `Căn: ${result.objectName} — tháng ${result.month}\n` +
    `💰 ${Number(result.payAmount).toLocaleString('vi-VN')} đ` +
    (result.status === 'partial' ? '\n⚠️ Mới trả một phần' : '')
  );

  ok(res, numerify(result));
}));

module.exports = router;
