const express = require('express');
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require('../controllers/wishlist.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect, restrictTo('buyer'));

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.patch('/:productId/toggle', toggleWishlist);

module.exports = router;
