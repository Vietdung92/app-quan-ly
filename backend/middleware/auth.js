/**
 * Authentication & Authorization Middleware
 * Path: middleware/auth.js
 */

const jwt = require('jsonwebtoken');

/** Verify JWT from Authorization: Bearer <token>, attach req.user */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    // payload: { userId, employeeId, email, role }
    req.user = payload;
    next();
  });
}

/** Require one of the given roles (QL/VP/KT) */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Không có quyền thực hiện thao tác này' });
    }
    next();
  };
}

/** Admin (QL) only */
const requireAdmin = requireRole('QL');

module.exports = { authenticateToken, requireRole, requireAdmin };
