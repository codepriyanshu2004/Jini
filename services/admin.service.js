const User = require('../models/User.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const Category = require('../models/Category.model');
const AppError = require('../utils/AppError');
const { sendSellerApprovalEmail } = require('../utils/email');

class AdminService {
  async getAllUsers({ page = 1, limit = 20, role, search }) {
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    };
  }

  async getPendingSellers({ page = 1, limit = 20 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const query = { role: 'seller', sellerStatus: 'pending' };

    const [sellers, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return {
      sellers,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    };
  }

  async reviewSellerApplication(sellerId, { action, reason }) {
    if (!['approve', 'reject'].includes(action)) {
      throw new AppError("Action must be 'approve' or 'reject'.", 400);
    }

    const seller = await User.findOne({ _id: sellerId, role: 'seller' });
    if (!seller) throw new AppError('Seller not found.', 404);

    seller.sellerStatus = action === 'approve' ? 'approved' : 'rejected';
    await seller.save({ validateBeforeSave: false });

    // Send email notification
    sendSellerApprovalEmail({
      to: seller.email,
      name: seller.name,
      approved: action === 'approve',
    });

    return seller;
  }

  async toggleUserStatus(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);
    if (user.role === 'admin') throw new AppError('Cannot deactivate an admin account.', 403);

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return user;
  }

  async getAnalytics() {
    const [
      totalOrders,
      revenueResult,
      totalUsers,
      totalProducts,
      ordersByStatus,
      topProducts,
    ] = await Promise.all([
      Order.countDocuments(),

      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),

      User.countDocuments({ role: { $ne: 'admin' } }),

      Product.countDocuments({ isActive: true }),

      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: 1,
            totalSold: 1,
            totalRevenue: 1,
            'product.title': 1,
            'product.images': { $arrayElemAt: ['$product.images', 0] },
            'product.price': 1,
          },
        },
      ]),
    ]);

    // Monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const statusMap = {};
    ordersByStatus.forEach((s) => (statusMap[s._id] = s.count));

    return {
      overview: {
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        totalOrders,
        totalUsers,
        totalProducts,
      },
      ordersByStatus: statusMap,
      topProducts,
      monthlyRevenue,
    };
  }

  // Category CRUD
  async createCategory({ name, description, image }) {
    const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) throw new AppError('Category already exists.', 409);
    return Category.create({ name, description, image });
  }

  async updateCategory(id, data) {
    const cat = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!cat) throw new AppError('Category not found.', 404);
    return cat;
  }

  async deleteCategory(id) {
    const cat = await Category.findById(id);
    if (!cat) throw new AppError('Category not found.', 404);

    // Check if products use this category
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw new AppError(`Cannot delete: ${productCount} products use this category.`, 400);
    }

    await cat.deleteOne();
  }
}

module.exports = new AdminService();
