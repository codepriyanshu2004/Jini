const express = require('express');
const router = express.Router();

const {
  addReview,
  updateReview,
  deleteReview,
  getProductReviews,
} = require('../controllers/review.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { reviewValidator } = require('../middleware/validators/order.validators');

// Public
router.get('/:productId', getProductReviews);

// Protected
router.use(protect);
router.post('/:productId', restrictTo('buyer'), reviewValidator, validate, addReview);
router.patch('/:productId/:reviewId', restrictTo('buyer'), reviewValidator, validate, updateReview);
router.delete('/:productId/:reviewId', deleteReview); // buyer owns it or admin

module.exports = router;
