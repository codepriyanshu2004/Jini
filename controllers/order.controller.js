const orderService = require('../services/order.service');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    successResponse(res, 201, 'Order created successfully', { order });
  } catch (err) {
    next(err);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await orderService.getBuyerOrders(req.user._id, req.query);
    paginatedResponse(res, 'Orders fetched', { orders }, pagination);
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id, req.user.role);
    successResponse(res, 200, 'Order fetched', { order });
  } catch (err) {
    next(err);
  }
};

const getSellerOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await orderService.getSellerOrders(req.user._id, req.query);
    paginatedResponse(res, 'Seller orders fetched', { orders }, pagination);
  } catch (err) {
    next(err);
  }
};

const updateOrderStatusBySeller = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatusBySeller(
      req.params.id,
      req.user._id,
      req.body.status
    );
    successResponse(res, 200, 'Order status updated', { order });
  } catch (err) {
    next(err);
  }
};

const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.adminUpdateOrderStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.body.cancelReason
    );
    successResponse(res, 200, 'Order status updated by admin', { order });
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await orderService.getAllOrders(req.query);
    paginatedResponse(res, 'All orders fetched', { orders }, pagination);
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getBuyerOrders, getOrderById, getSellerOrders, updateOrderStatusBySeller, adminUpdateOrderStatus, getAllOrders };
