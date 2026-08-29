/**
 * Notification Routes
 * Path: routes/notifications.js
 */

const router = require('express').Router();
const { getAll, getOne, query } = require('../config/database');
const { ok } = require('../utils/respond');
const { asyncHandler, notFound } = require('../middleware/errorHandler');

const SELECT = `
  SELECT id, type, title, message, is_read AS "isRead", created_at AS "createdAt"
  FROM notifications
`;

// GET /api/notifications?type=
router.get('/', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const params = [req.user.userId];
  let extra = '';
  if (type) { params.push(type); extra = `AND type = $2`; }
  const rows = await getAll(`${SELECT} WHERE user_id = $1 ${extra} ORDER BY id DESC LIMIT 100`, params);
  ok(res, rows);
}));

// GET /api/notifications/unread
router.get('/unread', asyncHandler(async (req, res) => {
  const rows = await getAll(
    `${SELECT} WHERE user_id = $1 AND is_read = FALSE ORDER BY id DESC`,
    [req.user.userId]
  );
  ok(res, rows);
}));

// PUT /api/notifications/read-all
router.put('/read-all', asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [req.user.userId]
  );
  ok(res, { updated: result.rowCount });
}));

// PUT /api/notifications/:id/read
router.put('/:id/read', asyncHandler(async (req, res) => {
  const row = await getOne(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.user.userId]
  );
  if (!row) throw notFound('Không tìm thấy thông báo');
  ok(res, { id: row.id, isRead: true });
}));

// DELETE /api/notifications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const row = await getOne(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.user.userId]
  );
  if (!row) throw notFound('Không tìm thấy thông báo');
  ok(res, { id: row.id, message: 'Đã xóa thông báo' });
}));

// DELETE /api/notifications — xóa tất cả của user
router.delete('/', asyncHandler(async (req, res) => {
  const result = await query(`DELETE FROM notifications WHERE user_id = $1`, [req.user.userId]);
  ok(res, { deleted: result.rowCount });
}));

// POST /api/notifications/subscribe — placeholder cho web push
router.post('/subscribe', (req, res) => ok(res, { subscribed: true }));

module.exports = router;
