const wishlistService = require('../services/wishlist.service');
const { successResponse } = require('../utils/apiResponse');

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user._id);
    successResponse(res, 200, 'Wishlist fetched', { wishlist });
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.addToWishlist(req.user._id, req.params.productId);
    successResponse(res, 200, 'Added to wishlist', { wishlist });
  } catch (err) {
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.removeFromWishlist(req.user._id, req.params.productId);
    successResponse(res, 200, 'Removed from wishlist', { wishlist });
  } catch (err) {
    next(err);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const result = await wishlistService.toggleWishlist(req.user._id, req.params.productId);
    successResponse(res, 200, result.inWishlist ? 'Added to wishlist' : 'Removed from wishlist', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist };
