const express = require('express');
const router = express.Router();

const {
  createOrder,
  getBuyerOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatusBySeller,
  adminUpdateOrderStatus,
  getAllOrders,
} = require('../controllers/order.controller');

const { protect, restrictTo, requireApprovedSeller } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createOrderValidator } = require('../middleware/validators/order.validators');
const { body } = require('express-validator');

router.use(protect);

// Buyer routes
router.post('/', restrictTo('buyer'), createOrderValidator, validate, createOrder);
router.get('/my-orders', restrictTo('buyer'), getBuyerOrders);

// Seller routes
router.get('/seller/orders', requireApprovedSeller, getSellerOrders);
router.patch(
  '/seller/:id/status',
  requireApprovedSeller,
  [body('status').isIn(['shipped', 'delivered']).withMessage('Sellers can only set status to shipped or delivered')],
  validate,
  updateOrderStatusBySeller
);

// Admin routes
router.get('/admin/all', restrictTo('admin'), getAllOrders);
router.patch(
  '/admin/:id/status',
  restrictTo('admin'),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  adminUpdateOrderStatus
);

// Shared - must come after specific routes
router.get('/:id', getOrderById);

module.exports = router;
