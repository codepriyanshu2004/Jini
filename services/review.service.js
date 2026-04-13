const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const AppError = require('../utils/AppError');

class ReviewService {
  async addReview(productId, userId, { rating, comment }) {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw new AppError('Product not found.', 404);

    // Check if buyer has purchased the product
    const hasPurchased = await Order.findOne({
      buyer: userId,
      'items.product': productId,
      paymentStatus: 'paid',
    });
    if (!hasPurchased) {
      throw new AppError('You can only review products you have purchased.', 403);
    }

    // Prevent duplicate reviews
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed) {
      throw new AppError('You have already reviewed this product.', 400);
    }

    product.reviews.push({ user: userId, rating, comment });
    product.calculateAverageRating();
    await product.save();

    await product.populate('reviews.user', 'name avatar');
    return product.reviews[product.reviews.length - 1];
  }

  async updateReview(productId, reviewId, userId, { rating, comment }) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    const review = product.reviews.id(reviewId);
    if (!review) throw new AppError('Review not found.', 404);
    if (review.user.toString() !== userId.toString()) {
      throw new AppError('Not authorized to update this review.', 403);
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    product.calculateAverageRating();
    await product.save();
    return review;
  }

  async deleteReview(productId, reviewId, userId, role) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    const review = product.reviews.id(reviewId);
    if (!review) throw new AppError('Review not found.', 404);

    if (role !== 'admin' && review.user.toString() !== userId.toString()) {
      throw new AppError('Not authorized to delete this review.', 403);
    }

    product.reviews.pull(reviewId);
    product.calculateAverageRating();
    await product.save();
  }

  async getProductReviews(productId, { page = 1, limit = 10 }) {
    const product = await Product.findById(productId).populate('reviews.user', 'name avatar');
    if (!product) throw new AppError('Product not found.', 404);

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const reviews = product.reviews.slice(start, end);

    return {
      reviews,
      averageRating: product.averageRating,
      numReviews: product.numReviews,
      pagination: {
        total: product.reviews.length,
        page: Number(page),
        pages: Math.ceil(product.reviews.length / Number(limit)),
      },
    };
  }
}

module.exports = new ReviewService();
