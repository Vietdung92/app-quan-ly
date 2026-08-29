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
const path = require('path');
const fs = require('fs');

const { pool } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const telegramService = require('./services/telegramService');
const { bootstrapDb } = require('./scripts/bootstrapDb');

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// ===== Middleware =====
// CSP nới style-src cho inline styles của React (progress bar, chart...)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
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
app.use('/api/funds', authenticateToken, require('./routes/funds'));
app.use('/api/apartments', authenticateToken, require('./routes/apartments'));
app.use('/api/residents', authenticateToken, require('./routes/residents'));
app.use('/api/taxes', authenticateToken, require('./routes/taxes'));

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

// ===== Serve frontend build (chế độ 1 service: Render/demo) =====
// Đặt FRONTEND_DIST=../app/dist để Express serve luôn giao diện.
// Trên VPS có nginx thì bỏ qua biến này (nginx serve dist riêng, nhanh hơn).
const distDir = process.env.FRONTEND_DIST
  ? path.resolve(__dirname, process.env.FRONTEND_DIST)
  : null;
if (distDir && fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, { maxAge: '30d', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
  console.log(`📦 Serving frontend từ ${distDir}`);
}

// ===== Error handler (cuối cùng) =====
app.use(errorHandler);

// ===== Start =====
const server = app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    await bootstrapDb();
  } catch (err) {
    console.error('❌ Database connection/bootstrap failed:', err.message);
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
