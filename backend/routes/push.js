/**
 * Push + App Config Routes
 * Path: routes/push.js
 *
 * - Đăng ký/hủy thông báo đẩy Web Push cho user hiện tại
 * - Cấu hình app: link nhóm Telegram, các mẫu caption (key nằm trong whitelist)
 */

const router = require('express').Router();
const { getOne, getAll, query } = require('../config/database');
const { ok } = require('../utils/respond');
const { asyncHandler, badRequest } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/auth');
const push = require('../services/pushService');

// GET /api/push/key — VAPID public key để frontend đăng ký
router.get('/key', asyncHandler(async (req, res) => {
  const key = await push.getPublicKey();
  ok(res, { key });
}));

// POST /api/push/subscribe — lưu subscription của thiết bị này
router.post('/subscribe', asyncHandler(async (req, res) => {
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    throw badRequest('Subscription không hợp lệ');
  }
  await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
    [req.user.userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
  );
  ok(res, { message: 'Đã bật thông báo đẩy trên thiết bị này' });
}));

// DELETE /api/push/subscribe — tắt trên thiết bị này
router.delete('/subscribe', asyncHandler(async (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) {
    await query(`DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2`, [endpoint, req.user.userId]);
  }
  ok(res, { message: 'Đã tắt thông báo đẩy' });
}));

// ===== App config =====
const EDITABLE_KEYS = ['telegram_group_link', 'expense_photo_caption', 'task_photo_caption'];

// GET /api/push/app-config — các cấu hình chung (mọi nhân viên đọc được)
router.get('/app-config', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `SELECT key, value FROM config WHERE key = ANY($1::text[])`,
    [EDITABLE_KEYS]
  );
  const out = {};
  rows.forEach((r) => { out[r.key] = r.value; });
  ok(res, out);
}));

// PUT /api/push/app-config (QL, VP) — sửa 1 key trong whitelist
router.put('/app-config', requireRole('QL', 'VP'), asyncHandler(async (req, res) => {
  const { key, value } = req.body || {};
  if (!EDITABLE_KEYS.includes(key)) throw badRequest('Không được sửa cấu hình này');
  await query(
    `INSERT INTO config (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, String(value ?? '')]
  );
  ok(res, { key, value });
}));

module.exports = router;
