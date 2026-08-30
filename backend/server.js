/**
 * App Quản Lý Công Ty - Backend Server
 * Path: server.js
 * Express + PostgreSQL, port 3000
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { pool } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const telegramService = require('./services/telegramService');

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// ===== Middleware =====
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// ===== Health check =====
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ success: false, status: 'error', database: 'disconnected' });
  }
});

// ===== Routes =====
app.use('/api/auth', require('./routes/auth'));

// Tất cả route dưới đây yêu cầu đăng nhập
app.use('/api/employees', authenticateToken, require('./routes/employees'));
app.use('/api/projects', authenticateToken, require('./routes/projects'));
app.use('/api/tasks', authenticateToken, require('./routes/tasks'));
app.use('/api/expenses', authenticateToken, require('./routes/expenses'));
app.use('/api/attendance', authenticateToken, require('./routes/attendance'));
app.use('/api/leaves', authenticateToken, require('./routes/leaves'));
app.use('/api/advances', authenticateToken, require('./routes/advances'));
app.use('/api/payroll', authenticateToken, require('./routes/payroll'));
app.use('/api/notifications', authenticateToken, require('./routes/notifications'));
app.use('/api/dashboard', authenticateToken, require('./routes/dashboard'));

// Test kết nối Telegram (QL only): kiểm tra bot + gửi tin nhắn thử
app.post('/api/telegram/test', authenticateToken, requireAdmin, async (req, res) => {
  if (!telegramService.isEnabled()) {
    return res.json({
      success: true,
      data: { configured: false, message: 'Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong .env' },
    });
  }
  const conn = await telegramService.testConnection();
  const sent = await telegramService.sendMessage('🔔 Tin nhắn thử từ App Quản Lý Công Ty');
  res.json({ success: true, data: { configured: true, bot: conn.bot || null, connectionOk: conn.ok, messageSent: sent.sent } });
});

// 404 cho API không tồn tại
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}` });
});

// ===== Error handler (cuối cùng) =====
app.use(errorHandler);

// ===== Start =====
const server = app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => pool.end());
});
process.on('SIGINT', () => {
  server.close(() => pool.end());
  process.exit(0);
});

module.exports = app;
