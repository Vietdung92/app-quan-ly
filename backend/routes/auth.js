/**
 * Auth Routes
 * Path: routes/auth.js
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, transaction } = require('../config/database');
const { ok, created } = require('../utils/respond');
const { asyncHandler, badRequest, unauthorized } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

function signTokens(user) {
  const payload = {
    userId: user.id,
    employeeId: user.employee_id,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
  const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
}

function publicUser(user) {
  return {
    id: user.id,
    employeeId: user.employee_id,
    email: user.email,
    role: user.role,
    // Cả 3 biến thể tên để tương thích các trang frontend
    full_name: user.full_name,
    fullName: user.full_name,
    name: user.full_name,
  };
}

const USER_QUERY = `
  SELECT u.id, u.employee_id, u.email, u.password_hash, u.is_active,
         e.full_name, e.role
  FROM users u
  JOIN employees e ON e.id = u.employee_id
`;

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw badRequest('Email và mật khẩu là bắt buộc');

  const user = await getOne(`${USER_QUERY} WHERE u.email = $1`, [email]);
  if (!user || !user.is_active) throw unauthorized('Email hoặc mật khẩu không đúng');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw unauthorized('Email hoặc mật khẩu không đúng');

  await getOne('UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING id', [user.id]);

  const tokens = signTokens(user);
  ok(res, { ...tokens, user: publicUser(user) });
}));

// POST /api/auth/refresh-token
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw badRequest('Thiếu refresh token');

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch {
    throw unauthorized('Refresh token không hợp lệ hoặc đã hết hạn');
  }
  if (payload.type !== 'refresh') throw unauthorized('Token không hợp lệ');

  const user = await getOne(`${USER_QUERY} WHERE u.id = $1`, [payload.userId]);
  if (!user || !user.is_active) throw unauthorized('Tài khoản không tồn tại hoặc đã khóa');

  const tokens = signTokens(user);
  ok(res, { ...tokens, user: publicUser(user) });
}));

// POST /api/auth/logout (stateless JWT - client tự xóa token)
router.post('/logout', (req, res) => ok(res, { message: 'Đã đăng xuất' }));

// POST /api/auth/register — tạo employee (role KT) + tài khoản đăng nhập
router.post('/register', asyncHandler(async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;
  if (!fullName || !email || !password) throw badRequest('Họ tên, email và mật khẩu là bắt buộc');
  if (password.length < 6) throw badRequest('Mật khẩu phải có ít nhất 6 ký tự');
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw badRequest('Mật khẩu xác nhận không khớp');
  }

  const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) throw badRequest('Email đã được sử dụng');

  const hash = await bcrypt.hash(password, 10);
  const result = await transaction(async (client) => {
    const emp = await client.query(
      `INSERT INTO employees (full_name, email, role) VALUES ($1, $2, 'KT') RETURNING id`,
      [fullName, email]
    );
    const user = await client.query(
      `INSERT INTO users (employee_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [emp.rows[0].id, email, hash]
    );
    return { employeeId: emp.rows[0].id, userId: user.rows[0].id };
  });

  created(res, result);
}));

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) throw badRequest('Thiếu mật khẩu cũ hoặc mới');
  if (newPassword.length < 6) throw badRequest('Mật khẩu mới phải có ít nhất 6 ký tự');

  const user = await getOne('SELECT id, password_hash FROM users WHERE id = $1', [req.user.userId]);
  const match = await bcrypt.compare(oldPassword, user.password_hash);
  if (!match) throw badRequest('Mật khẩu cũ không đúng');

  const hash = await bcrypt.hash(newPassword, 10);
  await getOne('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [hash, user.id]);
  ok(res, { message: 'Đổi mật khẩu thành công' });
}));

// POST /api/auth/verify
router.post('/verify', authenticateToken, (req, res) => ok(res, { valid: true, user: req.user }));

// PUT /api/auth/profile — cập nhật hồ sơ của chính mình
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { fullName, phone, address } = req.body;
  await getOne(
    `UPDATE employees SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       address = COALESCE($3, address),
       updated_at = NOW()
     WHERE id = $4 RETURNING id`,
    [fullName, phone, address, req.user.employeeId]
  );
  const user = await getOne(`${USER_QUERY} WHERE u.id = $1`, [req.user.userId]);
  ok(res, { user: publicUser(user) });
}));

module.exports = router;
