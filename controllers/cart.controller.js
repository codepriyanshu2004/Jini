const cartService = require('../services/cart.service');
const { successResponse } = require('../utils/apiResponse');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    successResponse(res, 200, 'Cart fetched', { cart });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user._id, productId, quantity);
    successResponse(res, 200, 'Item added to cart', { cart });
  } catch (err) {
    next(err);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateCartItem(req.user._id, req.params.productId, req.body.quantity);
    successResponse(res, 200, 'Cart updated', { cart });
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const cart = await cartService.removeFromCart(req.user._id, req.params.productId);
    successResponse(res, 200, 'Item removed from cart', { cart });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user._id);
    successResponse(res, 200, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
