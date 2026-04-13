const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getMe,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} = require('../middleware/validators/auth.validators');

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/change-password', changePasswordValidator, validate, changePassword);

module.exports = router;
