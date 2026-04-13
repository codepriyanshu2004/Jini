const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getPendingSellers,
  reviewSellerApplication,
  toggleUserStatus,
  getAnalytics,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/admin.controller');

const { getAllOrders, adminUpdateOrderStatus } = require('../controllers/order.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');

// All admin routes require auth + admin role
router.use(protect, restrictTo('admin'));

// Users
router.get('/users', getAllUsers);
router.patch('/users/:userId/toggle-status', toggleUserStatus);

// Sellers
router.get('/sellers/pending', getPendingSellers);
router.patch('/sellers/:sellerId/review', reviewSellerApplication);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', adminUpdateOrderStatus);

// Analytics
router.get('/analytics', getAnalytics);

// Categories
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
