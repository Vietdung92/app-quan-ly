/**
 * Web Push Service
 * Path: services/pushService.js
 *
 * Thông báo đẩy tới điện thoại/máy tính nhân viên (chuông + rung),
 * hoạt động cả khi app đang đóng. Yêu cầu HTTPS ở phía trình duyệt.
 * - Cặp khóa VAPID sinh 1 lần, lưu trong bảng config → giữ nguyên qua các lần restart
 * - Không bao giờ throw — lỗi push không được làm hỏng API chính
 */

const webpush = require('web-push');
const { getOne, getAll, query } = require('../config/database');

let vapidReady = null;

/** Lấy (hoặc sinh lần đầu) cặp khóa VAPID từ bảng config */
async function ensureVapid() {
  if (vapidReady) return vapidReady;
  vapidReady = (async () => {
    let pub = await getOne(`SELECT value FROM config WHERE key = 'vapid_public'`);
    let priv = await getOne(`SELECT value FROM config WHERE key = 'vapid_private'`);
    if (!pub || !priv) {
      const keys = webpush.generateVAPIDKeys();
      await query(
        `INSERT INTO config (key, value, description) VALUES
           ('vapid_public', $1, 'Web Push VAPID public key'),
           ('vapid_private', $2, 'Web Push VAPID private key')
         ON CONFLICT (key) DO NOTHING`,
        [keys.publicKey, keys.privateKey]
      );
      pub = await getOne(`SELECT value FROM config WHERE key = 'vapid_public'`);
      priv = await getOne(`SELECT value FROM config WHERE key = 'vapid_private'`);
    }
    webpush.setVapidDetails('mailto:vietdung4792@gmail.com', pub.value, priv.value);
    return pub.value;
  })().catch((err) => {
    console.error('[Push] VAPID init failed:', err.message);
    vapidReady = null;
    return null;
  });
  return vapidReady;
}

/** Public key cho frontend đăng ký */
async function getPublicKey() {
  return ensureVapid();
}

/** Gửi push tới danh sách user id. Fire-and-forget. */
async function sendToUsers(userIds, { title, body, url }) {
  if (!userIds || userIds.length === 0) return;
  try {
    if (!(await ensureVapid())) return;
    const subs = await getAll(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::int[])`,
      [userIds]
    );
    const payload = JSON.stringify({ title, body, url: url || '/' });
    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 3600 }
          )
          .catch((err) => {
            // Subscription hết hạn/bị thu hồi → dọn
            if (err.statusCode === 404 || err.statusCode === 410) {
              return query(`DELETE FROM push_subscriptions WHERE id = $1`, [s.id]).catch(() => {});
            }
          })
      )
    );
  } catch (err) {
    console.error('[Push] sendToUsers failed:', err.message);
  }
}

module.exports = { getPublicKey, sendToUsers };
