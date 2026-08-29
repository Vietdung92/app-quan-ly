/**
 * Telegram Notification Service
 * Path: services/telegramService.js
 *
 * Gửi thông báo vào nhóm Telegram của công ty qua Bot API.
 * - Tự tắt an toàn khi chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
 * - Không bao giờ throw — lỗi Telegram không được làm hỏng API chính
 * - Dùng fetch có sẵn của Node 18+, không cần thêm dependency
 *
 * Cách lấy token: chat với @BotFather trên Telegram → /newbot
 * Cách lấy chat_id: thêm bot vào nhóm, gửi 1 tin nhắn, mở
 *   https://api.telegram.org/bot<TOKEN>/getUpdates → xem "chat":{"id":-123...}
 */

const API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';

function isEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Gửi tin nhắn text (HTML). Trả về { sent: boolean }. Không bao giờ throw. */
async function sendMessage(text) {
  if (!isEnabled()) return { sent: false, reason: 'not_configured' };
  try {
    const url = `${API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Telegram] sendMessage failed:', res.status, body.slice(0, 200));
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error('[Telegram] sendMessage error:', err.message);
    return { sent: false, reason: err.message };
  }
}

/** Test kết nối bot (getMe) */
async function testConnection() {
  if (!isEnabled()) return { ok: false, reason: 'not_configured' };
  try {
    const res = await fetch(`${API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { ok: Boolean(data.ok), bot: data.result?.username };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// ===== Định dạng tiền tệ =====
const money = (n) => `${Number(n).toLocaleString('vi-VN')} đ`;
const dateVN = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');

// ===== Templates tiếng Việt =====
// Mỗi hàm gọi sendMessage và trả promise — caller dùng fire-and-forget.

const templates = {
  expenseCreated: (e) =>
    sendMessage(
      `💸 <b>Chi phí mới chờ duyệt</b>\n` +
      `📋 ${e.name}\n` +
      `💰 Số tiền: <b>${money(e.amount)}</b>\n` +
      `👤 Người tạo: ${e.createdBy || '—'}\n` +
      `📅 Ngày chi: ${dateVN(e.date)}`
    ),

  expenseApproved: (e, approver) =>
    sendMessage(
      `✅ <b>Chi phí đã được duyệt</b>\n` +
      `📋 ${e.name} — <b>${money(e.amount)}</b>\n` +
      `👤 Người duyệt: ${approver || '—'}`
    ),

  expenseRejected: (e, approver, reason) =>
    sendMessage(
      `❌ <b>Chi phí bị từ chối</b>\n` +
      `📋 ${e.name} — ${money(e.amount)}\n` +
      `👤 Người từ chối: ${approver || '—'}` +
      (reason ? `\n📝 Lý do: ${reason}` : '')
    ),

  leaveRequested: (l) =>
    sendMessage(
      `🏖 <b>Đơn xin nghỉ phép mới</b>\n` +
      `👤 ${l.employeeName}\n` +
      `📅 ${dateVN(l.startDate)} → ${dateVN(l.endDate)} (${l.days} ngày)\n` +
      `📝 Lý do: ${l.reason || '—'}`
    ),

  leaveDecided: (l, status, approver) =>
    sendMessage(
      `${status === 'approved' ? '✅' : '❌'} <b>Đơn nghỉ phép ${status === 'approved' ? 'được duyệt' : 'bị từ chối'}</b>\n` +
      `👤 ${l.employeeName} — ${l.days} ngày (${dateVN(l.startDate)} → ${dateVN(l.endDate)})\n` +
      `👤 Người xử lý: ${approver || '—'}`
    ),

  advanceRequested: (a) =>
    sendMessage(
      `💵 <b>Đơn xin ứng lương mới</b>\n` +
      `👤 ${a.employeeName}\n` +
      `💰 Số tiền: <b>${money(a.amount)}</b>\n` +
      `📝 Lý do: ${a.reason || '—'}`
    ),

  advanceDecided: (a, status, approver) =>
    sendMessage(
      `${status === 'approved' ? '✅' : '❌'} <b>Đơn ứng lương ${status === 'approved' ? 'được duyệt' : 'bị từ chối'}</b>\n` +
      `👤 ${a.employeeName} — <b>${money(a.amount)}</b>\n` +
      `👤 Người xử lý: ${approver || '—'}`
    ),

  taskAssigned: (t) =>
    sendMessage(
      `📌 <b>Công việc mới được giao</b>\n` +
      `📋 ${t.title}\n` +
      `👤 Giao cho: ${t.assignedToName || '—'}\n` +
      `⏰ Hạn: ${dateVN(t.dueDate) || '—'}` +
      (t.priority === 'high' ? `\n🔴 Ưu tiên CAO` : '')
    ),

  payrollGenerated: (month, count) =>
    sendMessage(
      `🧾 <b>Đã tạo bảng lương tháng ${month}</b>\n` +
      `👥 Số nhân viên: ${count}`
    ),

  payrollPaid: (p) =>
    sendMessage(
      `💰 <b>Đã thanh toán lương</b>\n` +
      `👤 ${p.employeeName} — tháng ${p.month}\n` +
      `💵 Thực nhận: <b>${money(p.netSalary)}</b>`
    ),
};

/** Gửi ảnh kèm chú thích. buffer: Buffer ảnh. Không bao giờ throw. */
async function sendPhoto(buffer, filename, caption) {
  if (!isEnabled()) return { sent: false, reason: 'not_configured' };
  try {
    const url = `${API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const form = new FormData();
    form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
    form.append('caption', String(caption || '').slice(0, 1000));
    form.append('photo', new Blob([buffer]), filename || 'photo.jpg');
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Telegram] sendPhoto failed:', res.status, body.slice(0, 200));
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error('[Telegram] sendPhoto error:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { isEnabled, sendMessage, testConnection, ...templates, sendPhoto };
