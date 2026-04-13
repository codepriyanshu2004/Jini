const User = require('../models/User.model');
const Product = require('../models/Product.model');
const AppError = require('../utils/AppError');

class WishlistService {
  async getWishlist(userId) {
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      match: { isActive: true },
      select: 'title price discountedPrice images averageRating numReviews stock',
      populate: { path: 'seller', select: 'name businessName' },
    });

    if (!user) throw new AppError('User not found.', 404);
    return user.wishlist;
  }

  async addToWishlist(userId, productId) {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw new AppError('Product not found.', 404);

    const user = await User.findById(userId);
    if (user.wishlist.includes(productId)) {
      throw new AppError('Product already in wishlist.', 400);
    }

    user.wishlist.push(productId);
    await user.save({ validateBeforeSave: false });
    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId, productId) {
    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: productId },
    });
    return this.getWishlist(userId);
  }

  async toggleWishlist(userId, productId) {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw new AppError('Product not found.', 404);

    const user = await User.findById(userId);
    const isInWishlist = user.wishlist.some((id) => id.toString() === productId.toString());

    if (isInWishlist) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
    } else {
      user.wishlist.push(productId);
    }

    await user.save({ validateBeforeSave: false });
    return { inWishlist: !isInWishlist };
  }
}

module.exports = new WishlistService();
