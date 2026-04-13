const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Order = require('../models/Order.model');
const orderService = require('./order.service');
const AppError = require('../utils/AppError');

class PaymentService {
  async createRazorpayOrder(orderId, buyerId) {
    const order = await Order.findOne({ _id: orderId, buyer: buyerId });
    if (!order) throw new AppError('Order not found.', 404);
    if (order.paymentStatus === 'paid') throw new AppError('Order already paid.', 400);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_${orderId}`,
      notes: {
        orderId: orderId.toString(),
        buyerId: buyerId.toString(),
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save({ validateBeforeSave: false });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifyAndProcessPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }) {
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      // Mark order as payment failed
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    // Confirm the order
    const order = await orderService.confirmOrderAfterPayment(orderId, {
      paymentId: razorpayPaymentId,
      razorpayOrderId,
    });

    return order;
  }

  async handlePaymentFailure(orderId, buyerId) {
    const order = await Order.findOne({ _id: orderId, buyer: buyerId });
    if (!order) throw new AppError('Order not found.', 404);

    order.paymentStatus = 'failed';
    await order.save({ validateBeforeSave: false });
    return order;
  }
}

module.exports = new PaymentService();
