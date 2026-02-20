/**
 * Global error handling middleware
 * Catches and formats errors from all endpoints
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware - must be last in middleware chain
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new AppError(message, 400);
  }

  // JWT expired error
  if (err.name === 'JsonWebTokenError') {
    const message = `JSON Web Token is invalid`;
    err = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = `JSON Web Token is expired`;
    err = new AppError(message, 401);
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    err = new AppError(message, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    const message = `${key} already exists`;
    err = new AppError(message, 400);
  }

  const response = {
    success: false,
    error: err.message,
    status: err.statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Log error
  console.error(`[${new Date().toISOString()}] Error:`, {
    status: err.statusCode,
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  res.status(err.statusCode).json(response);
};

// Async error wrapper - simplifies try-catch in async route handlers
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler
};
