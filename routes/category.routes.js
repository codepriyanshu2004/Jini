const express = require('express');
const router = express.Router();

const Category = require('../models/Category.model');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// GET /api/v1/categories — public
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    successResponse(res, 200, 'Categories fetched', { categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories/:id — public
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isActive: true });
    if (!category) return next(new AppError('Category not found.', 404));
    successResponse(res, 200, 'Category fetched', { category });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
