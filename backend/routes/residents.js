/**
 * Resident Routes (Tạm Trú Khách Nước Ngoài)
 * Path: routes/residents.js
 *
 * Quản lý khách nước ngoài đăng ký tạm trú theo từng căn hộ:
 * passport, quốc tịch, thời hạn tạm trú + cảnh báo sắp hết hạn.
 */

const router = require('express').Router();
const { getAll, getOne } = require('../config/database');
const { ok, created, numerify } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const telegram = require('../services/telegramService');

const SELECT = `
  SELECT r.id, r.object_id AS "objectId", o.name AS "apartment",
         r.full_name AS "fullName", r.passport_no AS "passportNo",
         r.nationality, r.birth_date AS "birthDate",
         r.residence_start AS "residenceStart", r.residence_expiry AS "residenceExpiry",
         (r.residence_expiry - CURRENT_DATE) AS "daysLeft",
         r.pet_notes AS "petNotes", r.passport_link AS "passportLink", r.trc_link AS "trcLink",
         r.is_active AS "isActive", r.updated_at AS "updatedAt"
  FROM apartment_residents r
  JOIN fund_objects o ON o.id = r.object_id
`;

// GET /api/residents?status=expiring|expired|active&objectId=&q=
router.get('/', asyncHandler(async (req, res) => {
  const { status, objectId, q } = req.query;
  const params = [];
  const conds = ['r.is_active = TRUE'];

  if (status === 'expired') {
    conds.push('r.residence_expiry < CURRENT_DATE');
  } else if (status === 'expiring') {
    conds.push(`r.residence_expiry >= CURRENT_DATE AND r.residence_expiry <= CURRENT_DATE + 14`);
  } else if (status === 'inactive') {
    conds.length = 0;
    conds.push('r.is_active = FALSE');
  }
  if (objectId) { params.push(parseInt(objectId, 10)); conds.push(`r.object_id = $${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    conds.push(`(r.full_name ILIKE $${params.length} OR r.passport_no ILIKE $${params.length} OR o.name ILIKE $${params.length})`);
  }

  const rows = await getAll(
    `${SELECT} WHERE ${conds.join(' AND ')}
     ORDER BY r.residence_expiry ASC NULLS LAST, o.name`,
    params
  );
  ok(res, numerify(rows));
}));

// GET /api/residents/summary — số liệu cảnh báo cho dashboard/tab
router.get('/summary', asyncHandler(async (req, res) => {
  const row = await getOne(`
    SELECT
      COUNT(*) FILTER (WHERE TRUE) AS "total",
      COUNT(*) FILTER (WHERE residence_expiry < CURRENT_DATE) AS "expired",
      COUNT(*) FILTER (WHERE residence_expiry >= CURRENT_DATE AND residence_expiry <= CURRENT_DATE + 14) AS "expiring"
    FROM apartment_residents WHERE is_active = TRUE
  `);
  ok(res, numerify(row));
}));

// GET /api/residents/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(`${SELECT} WHERE r.id = $1`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy khách tạm trú');
  ok(res, numerify(row));
}));

// POST /api/residents (QL, VP)
router.post('/', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const {
    objectId, fullName, passportNo, nationality, birthDate,
    residenceStart, residenceExpiry, petNotes, passportLink, trcLink,
  } = req.body;
  if (!objectId) throw badRequest('Căn hộ là bắt buộc');
  if (!fullName) throw badRequest('Họ tên là bắt buộc');

  const row = await getOne(
    `INSERT INTO apartment_residents
       (object_id, full_name, passport_no, nationality, birth_date,
        residence_start, residence_expiry, pet_notes, passport_link, trc_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      parseInt(objectId, 10), fullName, passportNo || null, nationality || null,
      birthDate || null, residenceStart || null, residenceExpiry || null,
      petNotes || null, passportLink || null, trcLink || null,
    ]
  );
  const resident = await getOne(`${SELECT} WHERE r.id = $1`, [row.id]);

  telegram.sendMessage(
    `🛂 <b>Tạm trú mới</b>\nCăn: <b>${resident.apartment}</b>\nKhách: ${resident.fullName}` +
    (resident.residenceExpiry ? `\nHạn tạm trú: ${new Date(resident.residenceExpiry).toLocaleDateString('vi-VN')}` : '')
  );
  created(res, numerify(resident));
}));

// PUT /api/residents/:id (QL, VP)
router.put('/:id', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const FIELD_MAP = {
    objectId: 'object_id',
    fullName: 'full_name',
    passportNo: 'passport_no',
    nationality: 'nationality',
    birthDate: 'birth_date',
    residenceStart: 'residence_start',
    residenceExpiry: 'residence_expiry',
    petNotes: 'pet_notes',
    passportLink: 'passport_link',
    trcLink: 'trc_link',
    isActive: 'is_active',
  };
  const sets = [];
  const params = [];
  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (key in req.body) {
      let val = req.body[key];
      if (val === '') val = null;
      if (key === 'objectId' && val !== null) val = parseInt(val, 10);
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    }
  }
  if (!sets.length) throw badRequest('Không có dữ liệu cập nhật');
  params.push(req.params.id);

  const row = await getOne(
    `UPDATE apartment_residents SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (!row) throw notFound('Không tìm thấy khách tạm trú');
  const resident = await getOne(`${SELECT} WHERE r.id = $1`, [row.id]);
  ok(res, numerify(resident));
}));

// DELETE /api/residents/:id (QL)
router.delete('/:id', requireRole('QL'), asyncHandler(async (req, res) => {
  const row = await getOne(`DELETE FROM apartment_residents WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!row) throw notFound('Không tìm thấy khách tạm trú');
  ok(res, { id: row.id, message: 'Đã xóa khách tạm trú' });
}));

module.exports = router;
