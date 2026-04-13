const reviewService = require('../services/review.service');
const { successResponse } = require('../utils/apiResponse');

const addReview = async (req, res, next) => {
  try {
    const review = await reviewService.addReview(req.params.productId, req.user._id, req.body);
    successResponse(res, 201, 'Review added', { review });
  } catch (err) {
    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(
      req.params.productId,
      req.params.reviewId,
      req.user._id,
      req.body
    );
    successResponse(res, 200, 'Review updated', { review });
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(
      req.params.productId,
      req.params.reviewId,
      req.user._id,
      req.user.role
    );
    successResponse(res, 200, 'Review deleted');
  } catch (err) {
    next(err);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getProductReviews(req.params.productId, req.query);
    successResponse(res, 200, 'Reviews fetched', data);
  } catch (err) {
    next(err);
  }
};

module.exports = { addReview, updateReview, deleteReview, getProductReviews };
