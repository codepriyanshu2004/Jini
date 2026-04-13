const Product = require('../models/Product.model');
const Category = require('../models/Category.model');
const AppError = require('../utils/AppError');
const { cloudinary } = require('../config/cloudinary');

class ProductService {
  async createProduct(sellerId, data, files) {
    const { title, description, price, discountedPrice, category, stock, tags } = data;

    // Validate category exists
    const cat = await Category.findById(category);
    if (!cat) throw new AppError('Category not found.', 404);

    const images = (files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const product = await Product.create({
      title,
      description,
      price,
      discountedPrice,
      category,
      stock,
      seller: sellerId,
      images,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    });

    return product.populate(['category', 'seller']);
  }

  async getProducts({ search, category, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt' }) {
    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) query.category = category;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('seller', 'name businessName')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('-reviews'),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    };
  }

  async getProductById(id) {
    const product = await Product.findOne({ _id: id, isActive: true })
      .populate('category', 'name slug')
      .populate('seller', 'name businessName email')
      .populate('reviews.user', 'name avatar');

    if (!product) throw new AppError('Product not found.', 404);
    return product;
  }

  async updateProduct(productId, sellerId, role, data, files) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    // Only the seller who owns it or admin can update
    if (role !== 'admin' && product.seller.toString() !== sellerId.toString()) {
      throw new AppError('Not authorized to update this product.', 403);
    }

    const allowedFields = ['title', 'description', 'price', 'discountedPrice', 'stock', 'category', 'tags', 'isActive'];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        product[field] = data[field];
      }
    });

    // Append new images if provided
    if (files && files.length > 0) {
      const newImages = files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      product.images.push(...newImages);
    }

    await product.save();
    return product.populate(['category', 'seller']);
  }

  async deleteProduct(productId, sellerId, role) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    if (role !== 'admin' && product.seller.toString() !== sellerId.toString()) {
      throw new AppError('Not authorized to delete this product.', 403);
    }

    // Delete images from Cloudinary
    const deletePromises = product.images
      .filter((img) => img.publicId)
      .map((img) => cloudinary.uploader.destroy(img.publicId));

    await Promise.allSettled(deletePromises);
    await product.deleteOne();
  }

  async removeProductImage(productId, publicId, sellerId, role) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    if (role !== 'admin' && product.seller.toString() !== sellerId.toString()) {
      throw new AppError('Not authorized.', 403);
    }

    await cloudinary.uploader.destroy(publicId);
    product.images = product.images.filter((img) => img.publicId !== publicId);
    await product.save();
    return product;
  }

  async getSellerProducts(sellerId, { page = 1, limit = 12 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find({ seller: sellerId })
        .populate('category', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments({ seller: sellerId }),
    ]);

    return {
      products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    };
  }
}

module.exports = new ProductService();
