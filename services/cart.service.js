const User = require('../models/User.model');
const Product = require('../models/Product.model');
const AppError = require('../utils/AppError');

class CartService {
  async getCart(userId) {
    const user = await User.findById(userId).populate({
      path: 'cart.product',
      select: 'title price discountedPrice images stock isActive seller',
      populate: { path: 'seller', select: 'name' },
    });

    if (!user) throw new AppError('User not found.', 404);

    // Filter out inactive/deleted products
    const activeCart = user.cart.filter((item) => item.product && item.product.isActive);

    // Calculate total
    const total = activeCart.reduce((sum, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    return {
      items: activeCart,
      total: Math.round(total * 100) / 100,
      itemCount: activeCart.length,
    };
  }

  async addToCart(userId, productId, quantity = 1) {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw new AppError('Product not found or unavailable.', 404);
    if (product.stock < quantity) throw new AppError(`Only ${product.stock} units available.`, 400);

    const user = await User.findById(userId);
    const existingItem = user.cart.find((item) => item.product.toString() === productId.toString());

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) throw new AppError(`Only ${product.stock} units available.`, 400);
      existingItem.quantity = newQty;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save({ validateBeforeSave: false });
    return this.getCart(userId);
  }

  async updateCartItem(userId, productId, quantity) {
    if (quantity < 1) throw new AppError('Quantity must be at least 1.', 400);

    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);
    if (product.stock < quantity) throw new AppError(`Only ${product.stock} units available.`, 400);

    const user = await User.findById(userId);
    const item = user.cart.find((i) => i.product.toString() === productId.toString());
    if (!item) throw new AppError('Item not found in cart.', 404);

    item.quantity = quantity;
    await user.save({ validateBeforeSave: false });
    return this.getCart(userId);
  }

  async removeFromCart(userId, productId) {
    await User.findByIdAndUpdate(userId, {
      $pull: { cart: { product: productId } },
    });
    return this.getCart(userId);
  }

  async clearCart(userId) {
    await User.findByIdAndUpdate(userId, { $set: { cart: [] } });
  }
}

module.exports = new CartService();
