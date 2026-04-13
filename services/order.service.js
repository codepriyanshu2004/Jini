const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const AppError = require('../utils/AppError');
const { sendOrderConfirmationEmail } = require('../utils/email');

class OrderService {
  async createOrder(buyerId, { items, shippingAddress, notes }) {
    // Fetch all products and validate
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    if (products.length !== items.length) {
      throw new AppError('One or more products are unavailable or not found.', 400);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.product.toString());
      if (!product) throw new AppError(`Product ${item.product} not found.`, 404);
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.title}". Available: ${product.stock}`, 400);
      }

      const price = product.discountedPrice || product.price;
      totalAmount += price * item.quantity;

      orderItems.push({
        product: product._id,
        seller: product.seller,
        quantity: item.quantity,
        price,
        title: product.title,
      });
    }

    const order = await Order.create({
      buyer: buyerId,
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      shippingAddress,
      notes,
    });

    return order.populate([
      { path: 'buyer', select: 'name email' },
      { path: 'items.product', select: 'title images' },
      { path: 'items.seller', select: 'name businessName' },
    ]);
  }

  async confirmOrderAfterPayment(orderId, { paymentId, razorpayOrderId }) {
    const order = await Order.findById(orderId).populate([
      { path: 'buyer', select: 'name email' },
      { path: 'items.product', select: 'title images' },
    ]);

    if (!order) throw new AppError('Order not found.', 404);
    if (order.paymentStatus === 'paid') throw new AppError('Order already paid.', 400);

    // Deduct stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    order.paymentId = paymentId;
    order.razorpayOrderId = razorpayOrderId;
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    await order.save();

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail({ to: order.buyer.email, order });

    return order;
  }

  async getBuyerOrders(buyerId, { page = 1, limit = 10 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find({ buyer: buyerId })
        .populate('items.product', 'title images')
        .populate('items.seller', 'name businessName')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments({ buyer: buyerId }),
    ]);

    return {
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    };
  }

  async getOrderById(orderId, userId, role) {
    const order = await Order.findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'title images price')
      .populate('items.seller', 'name businessName');

    if (!order) throw new AppError('Order not found.', 404);

    // Access control
    const isBuyer = order.buyer._id.toString() === userId.toString();
    const isSeller = order.items.some((item) => item.seller?._id?.toString() === userId.toString());

    if (role !== 'admin' && !isBuyer && !isSeller) {
      throw new AppError('Not authorized to view this order.', 403);
    }

    return order;
  }

  async getSellerOrders(sellerId, { page = 1, limit = 10, status }) {
    const skip = (Number(page) - 1) * Number(limit);
    const query = { 'items.seller': sellerId };
    if (status) query.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('buyer', 'name email')
        .populate('items.product', 'title images')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    };
  }

  async updateOrderStatusBySeller(orderId, sellerId, newStatus) {
    const allowedTransitions = {
      confirmed: 'shipped',
      shipped: 'delivered',
    };

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found.', 404);

    // Seller must own at least one item in this order
    const isSeller = order.items.some((item) => item.seller.toString() === sellerId.toString());
    if (!isSeller) throw new AppError('Not authorized to update this order.', 403);

    const expectedNext = allowedTransitions[order.orderStatus];
    if (!expectedNext || expectedNext !== newStatus) {
      throw new AppError(
        `Cannot transition from '${order.orderStatus}' to '${newStatus}'. Allowed: ${expectedNext || 'none'}.`,
        400
      );
    }

    if (newStatus === 'shipped' && order.paymentStatus !== 'paid') {
      throw new AppError('Cannot ship an unpaid order.', 400);
    }

    order.orderStatus = newStatus;
    await order.save();
    return order;
  }

  async adminUpdateOrderStatus(orderId, newStatus, adminId, cancelReason) {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError(`Invalid status: ${newStatus}.`, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found.', 404);

    order.orderStatus = newStatus;

    if (newStatus === 'cancelled') {
      order.cancelledBy = adminId;
      order.cancelReason = cancelReason || 'Cancelled by admin';

      // Restore stock if order was previously paid
      if (order.paymentStatus === 'paid') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    }

    await order.save();
    return order;
  }

  async getAllOrders({ page = 1, limit = 20, status, paymentStatus }) {
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('buyer', 'name email')
        .populate('items.product', 'title')
        .populate('items.seller', 'name businessName')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    };
  }
}

module.exports = new OrderService();
