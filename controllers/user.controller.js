const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');
const { cloudinary } = require('../config/cloudinary');

const getProfile = async (req, res, next) => {
  try {
    successResponse(res, 200, 'Profile fetched', { user: req.user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'businessName'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    successResponse(res, 200, 'Profile updated', { user });
  } catch (err) {
    next(err);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Please upload an image.', 400);

    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`ecommerce/avatars/${publicId}`).catch(() => {});
    }

    user.avatar = req.file.path;
    await user.save({ validateBeforeSave: false });

    successResponse(res, 200, 'Avatar updated', { avatar: user.avatar });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name businessName avatar role createdAt');
    if (!user) throw new AppError('User not found.', 404);
    successResponse(res, 200, 'User fetched', { user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, updateAvatar, getUserById };
