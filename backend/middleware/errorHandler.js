/**
 * Centralized Error Handler
 * Path: middleware/errorHandler.js
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const badRequest = (msg = 'Dữ liệu không hợp lệ') => new AppError(msg, 400);
const unauthorized = (msg = 'Chưa đăng nhập') => new AppError(msg, 401);
const forbidden = (msg = 'Không có quyền') => new AppError(msg, 403);
const notFound = (msg = 'Không tìm thấy') => new AppError(msg, 404);

/** Map PostgreSQL errors to HTTP errors */
function mapPgError(err) {
  switch (err.code) {
    case '23505': return new AppError('Dữ liệu đã tồn tại (trùng lặp)', 409);
    case '23503': return new AppError('Dữ liệu tham chiếu không tồn tại', 400);
    case '23514': return new AppError('Giá trị không hợp lệ', 400);
    case '22P02': return new AppError('Định dạng dữ liệu không hợp lệ', 400);
    default: return null;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const pgError = err.code ? mapPgError(err) : null;
  const finalError = pgError || err;
  const status = finalError.statusCode || 500;

  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message, err.stack);
  }

  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Lỗi hệ thống, vui lòng thử lại' : finalError.message,
  });
}

/** Wrap async route handlers so thrown errors reach errorHandler */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError, badRequest, unauthorized, forbidden, notFound,
  errorHandler, asyncHandler,
};
