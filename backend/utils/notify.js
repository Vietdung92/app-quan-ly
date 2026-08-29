/**
 * In-app Notification Helper
 * Path: utils/notify.js
 *
 * Tạo notification trong DB cho user — trang Thông Báo của app đọc từ đây.
 * Fire-and-forget: lỗi chỉ log, không throw.
 */

const { query, getAll } = require('../config/database');
const push = require('../services/pushService');

/** Tạo notification cho danh sách user id */
async function notifyUsers(userIds, type, title, message) {
  if (!userIds || userIds.length === 0) return;
  try {
    const values = [];
    const params = [];
    userIds.forEach((uid, i) => {
      const base = i * 4;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      params.push(uid, type, title, message);
    });
    await query(
      `INSERT INTO notifications (user_id, type, title, message) VALUES ${values.join(', ')}`,
      params
    );
    // Đẩy thông báo tới điện thoại (fire-and-forget)
    push.sendToUsers([...new Set(userIds)], { title, body: message }).catch(() => {});
  } catch (err) {
    console.error('[Notify] insert failed:', err.message);
  }
}

/** Thông báo cho tất cả quản lý (QL + VP) */
async function notifyManagers(type, title, message) {
  try {
    const managers = await getAll(
      `SELECT u.id FROM users u JOIN employees e ON e.id = u.employee_id
       WHERE e.role IN ('QL', 'VP') AND u.is_active = TRUE`
    );
    await notifyUsers(managers.map((m) => m.id), type, title, message);
  } catch (err) {
    console.error('[Notify] notifyManagers failed:', err.message);
  }
}

/** Thông báo cho 1 nhân viên (tìm user theo employee_id) */
async function notifyEmployee(employeeId, type, title, message) {
  try {
    const users = await getAll(
      `SELECT id FROM users WHERE employee_id = $1 AND is_active = TRUE`,
      [employeeId]
    );
    await notifyUsers(users.map((u) => u.id), type, title, message);
  } catch (err) {
    console.error('[Notify] notifyEmployee failed:', err.message);
  }
}

/** Lấy tên nhân viên theo employee_id (cho message "Người duyệt: ...") */
async function getEmployeeName(employeeId) {
  try {
    const rows = await getAll(`SELECT full_name FROM employees WHERE id = $1`, [employeeId]);
    return rows[0]?.full_name || null;
  } catch {
    return null;
  }
}

module.exports = { notifyUsers, notifyManagers, notifyEmployee, getEmployeeName };
