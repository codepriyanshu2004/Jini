const adminService = require('../services/admin.service');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

const getAllUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await adminService.getAllUsers(req.query);
    paginatedResponse(res, 'Users fetched', { users }, pagination);
  } catch (err) {
    next(err);
  }
};

const getPendingSellers = async (req, res, next) => {
  try {
    const { sellers, pagination } = await adminService.getPendingSellers(req.query);
    paginatedResponse(res, 'Pending sellers fetched', { sellers }, pagination);
  } catch (err) {
    next(err);
  }
};

const reviewSellerApplication = async (req, res, next) => {
  try {
    const seller = await adminService.reviewSellerApplication(req.params.sellerId, req.body);
    successResponse(res, 200, `Seller application ${req.body.action}d`, { seller });
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.userId);
    successResponse(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, { user });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics();
    successResponse(res, 200, 'Analytics fetched', { analytics });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await adminService.createCategory(req.body);
    successResponse(res, 201, 'Category created', { category });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await adminService.updateCategory(req.params.id, req.body);
    successResponse(res, 200, 'Category updated', { category });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await adminService.deleteCategory(req.params.id);
    successResponse(res, 200, 'Category deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getPendingSellers,
  reviewSellerApplication,
  toggleUserStatus,
  getAnalytics,
  createCategory,
  updateCategory,
  deleteCategory,
};
