/**
 * Tenant Portal Routes (Cổng khách thuê)
 * Path: routes/portal.js
 *
 * API cho KHÁCH THUÊ (không phải nhân viên): đăng nhập theo căn hộ,
 * xem thông tin căn + hợp đồng, nhắc tiền thuê + hạn tạm trú,
 * báo hỏng và theo dõi xử lý, tự khai thông tin tạm trú, xem căn trống.
 * Token riêng role TENANT — không dùng chung với token nhân viên.
 */

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getAll, getOne } = require('../config/database');
const { ok, created } = require('../utils/respond');
const { asyncHandler, badRequest, notFound } = require('../middleware/errorHandler');
const telegram = require('../services/telegramService');

// ===== Middleware xác thực khách thuê =====
function authenticateTenant(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Not logged in' });
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err || payload.role !== 'TENANT') {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }
    req.tenant = payload; // { tenantId, objectId, apartment, role: 'TENANT' }
    next();
  });
}

// ===== POST /api/portal/login =====
router.post('/login', asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) throw badRequest('Please enter login and password');

  const account = await getOne(
    `SELECT t.id, t.object_id AS "objectId", t.password_hash AS "passwordHash",
            t.is_active AS "isActive", o.name AS "apartment"
     FROM tenant_accounts t JOIN fund_objects o ON o.id = t.object_id
     WHERE LOWER(t.login) = LOWER($1)`,
    [String(login).trim()]
  );
  if (!account || !account.isActive || !bcrypt.compareSync(password, account.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Incorrect login or password' });
  }

  const token = jwt.sign(
    { tenantId: account.id, objectId: account.objectId, apartment: account.apartment, role: 'TENANT' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  getOne(`UPDATE tenant_accounts SET last_login = NOW() WHERE id = $1 RETURNING id`, [account.id]).catch(() => {});
  ok(res, { token, apartment: account.apartment });
}));

// Các route dưới đây yêu cầu đăng nhập khách thuê
router.use(authenticateTenant);

// ===== GET /api/portal/me — thông tin căn + nhắc nhở =====
router.get('/me', asyncHandler(async (req, res) => {
  const apt = await getOne(
    `SELECT o.name, d.address, d.bedrooms, d.area,
            d.rent_amount AS "rentAmount", d.deposit, d.payment_day AS "paymentDay",
            d.contract_start AS "contractStart", d.contract_end AS "contractEnd",
            d.contract_link AS "contractLink", d.qr_link AS "qrLink",
            d.zalo_link AS "zaloLink", d.rental_form AS "rentalForm",
            d.building_fee AS "buildingFee", d.tenant_name AS "tenantName"
     FROM fund_objects o LEFT JOIN apartment_details d ON d.object_id = o.id
     WHERE o.id = $1`,
    [req.tenant.objectId]
  );
  if (!apt) throw notFound('Apartment not found');

  const month = new Date().toISOString().slice(0, 7);
  const rent = await getOne(
    `SELECT month, amount_due AS "amountDue", amount_paid AS "amountPaid", status
     FROM rent_payments WHERE object_id = $1 AND month = $2`,
    [req.tenant.objectId, month]
  );

  const residents = await getAll(
    `SELECT id, full_name AS "fullName", nationality,
            residence_start AS "residenceStart", residence_expiry AS "residenceExpiry",
            (residence_expiry - CURRENT_DATE) AS "daysLeft"
     FROM apartment_residents
     WHERE object_id = $1 AND is_active = TRUE ORDER BY residence_expiry`,
    [req.tenant.objectId]
  );

  ok(res, {
    apartment: {
      ...apt,
      rentAmount: apt.rentAmount != null ? Number(apt.rentAmount) : null,
      deposit: apt.deposit != null ? Number(apt.deposit) : null,
      buildingFee: apt.buildingFee != null ? Number(apt.buildingFee) : null,
    },
    rentThisMonth: rent
      ? { ...rent, amountDue: Number(rent.amountDue), amountPaid: Number(rent.amountPaid) }
      : null,
    residents: residents.map((r) => ({ ...r, daysLeft: r.daysLeft != null ? Number(r.daysLeft) : null })),
  });
}));

// ===== Repairs =====
router.get('/repairs', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT r.id, r.category, r.description, r.image_link AS "imageLink",
            r.status, r.staff_notes AS "staffNotes",
            r.created_at AS "createdAt", r.resolved_at AS "resolvedAt"
     FROM repair_requests r WHERE r.object_id = $1 ORDER BY r.id DESC`,
    [req.tenant.objectId]
  );
  ok(res, rows);
}));

router.post('/repairs', asyncHandler(async (req, res) => {
  const { category, description, imageLink } = req.body;
  if (!description || !String(description).trim()) throw badRequest('Please describe the issue');
  const CATS = ['electric', 'water', 'aircon', 'lock', 'furniture', 'other'];
  const cat = CATS.includes(category) ? category : 'other';

  const row = await getOne(
    `INSERT INTO repair_requests (object_id, tenant_account_id, category, description, image_link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, category, description, image_link AS "imageLink", status, created_at AS "createdAt"`,
    [req.tenant.objectId, req.tenant.tenantId, cat, String(description).trim().slice(0, 2000), imageLink || null]
  );

  telegram.sendMessage(
    `🔧 <b>[BÁO HỎNG MỚI]</b>\nCăn: <b>${req.tenant.apartment}</b>\nLoại: ${cat}\nNội dung: ${String(description).slice(0, 300)}` +
    (imageLink ? `\nẢnh: ${imageLink}` : '') +
    `\n→ Vào mục Báo Hỏng trong app để tiếp nhận & giao việc`
  );
  created(res, row);
}));

// ===== Tự khai thông tin tạm trú =====
router.post('/residents', asyncHandler(async (req, res) => {
  const { fullName, passportNo, nationality, birthDate, passportLink, trcLink } = req.body;
  if (!fullName || !String(fullName).trim()) throw badRequest('Please enter full name');

  const row = await getOne(
    `INSERT INTO apartment_residents
       (object_id, full_name, passport_no, nationality, birth_date, passport_link, trc_link, pet_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Khách tự khai qua portal - cần kiểm tra')
     RETURNING id, full_name AS "fullName"`,
    [
      req.tenant.objectId, String(fullName).trim().toUpperCase().slice(0, 150),
      passportNo || null, nationality || null, birthDate || null,
      passportLink || null, trcLink || null,
    ]
  );

  telegram.sendMessage(
    `🛂 <b>[KHÁCH TỰ KHAI TẠM TRÚ]</b>\nCăn: <b>${req.tenant.apartment}</b>\nKhách: ${row.fullName}\n→ Kiểm tra và bổ sung hạn tạm trú trong mục Tạm Trú`
  );
  created(res, row);
}));

// ===== Căn trống (remarketing) =====
router.get('/vacant', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT o.name, d.bedrooms, d.area, d.rent_amount AS "rentAmount", d.image_link AS "imageLink"
     FROM fund_objects o JOIN apartment_details d ON d.object_id = o.id
     WHERE d.apt_status = 'Đang trống' ORDER BY d.rent_amount`
  );
  ok(res, rows.map((r) => ({ ...r, rentAmount: r.rentAmount != null ? Number(r.rentAmount) : null })));
}));

// ===== Đổi mật khẩu =====
router.put('/password', asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) throw badRequest('New password must be at least 6 characters');
  const account = await getOne(`SELECT password_hash AS "passwordHash" FROM tenant_accounts WHERE id = $1`, [req.tenant.tenantId]);
  if (!account || !bcrypt.compareSync(currentPassword || '', account.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }
  await getOne(
    `UPDATE tenant_accounts SET password_hash = $1 WHERE id = $2 RETURNING id`,
    [bcrypt.hashSync(String(newPassword), 10), req.tenant.tenantId]
  );
  ok(res, { message: 'Password changed' });
}));

module.exports = router;
