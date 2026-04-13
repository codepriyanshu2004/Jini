const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');

/**
 * Protect routes - verify JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return next(new AppError('User not found or token is invalid.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please login again.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    next(error);
  }
};

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(' or ')}.`, 403));
    }
    next();
  };
};

/**
 * Seller must be approved to use seller features
 */
const requireApprovedSeller = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return next(new AppError('Seller account required.', 403));
  }
  if (req.user.role === 'seller' && req.user.sellerStatus !== 'approved') {
    return next(
      new AppError(
        `Your seller account is ${req.user.sellerStatus}. Please wait for admin approval.`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, restrictTo, requireApprovedSeller };
