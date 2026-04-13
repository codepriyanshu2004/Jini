const paymentService = require('../services/payment.service');
const { successResponse } = require('../utils/apiResponse');

const createRazorpayOrder = async (req, res, next) => {
  try {
    const data = await paymentService.createRazorpayOrder(req.params.orderId, req.user._id);
    successResponse(res, 200, 'Razorpay order created', data);
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const order = await paymentService.verifyAndProcessPayment({
      ...req.body,
      orderId: req.params.orderId,
    });
    successResponse(res, 200, 'Payment verified and order confirmed', { order });
  } catch (err) {
    next(err);
  }
};

const paymentFailed = async (req, res, next) => {
  try {
    const order = await paymentService.handlePaymentFailure(req.params.orderId, req.user._id);
    successResponse(res, 200, 'Payment failure recorded', { order });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRazorpayOrder, verifyPayment, paymentFailed };
