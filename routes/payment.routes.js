const express = require('express');
const router = express.Router();

const {
  createRazorpayOrder,
  verifyPayment,
  paymentFailed,
} = require('../controllers/payment.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.use(protect, restrictTo('buyer'));

// Create Razorpay order for a given app order
router.post('/:orderId/create', createRazorpayOrder);

// Verify payment signature and confirm order
router.post(
  '/:orderId/verify',
  [
    body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required'),
  ],
  validate,
  verifyPayment
);

// Record payment failure
router.post('/:orderId/failed', paymentFailed);

module.exports = router;
