const productService = require('../services/product.service');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.user._id, req.body, req.files);
    successResponse(res, 201, 'Product created successfully', { product });
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const { products, pagination } = await productService.getProducts(req.query);
    paginatedResponse(res, 'Products fetched', { products }, pagination);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    successResponse(res, 200, 'Product fetched', { product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body,
      req.files
    );
    successResponse(res, 200, 'Product updated', { product });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id, req.user._id, req.user.role);
    successResponse(res, 200, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

const removeProductImage = async (req, res, next) => {
  try {
    const product = await productService.removeProductImage(
      req.params.id,
      req.params.publicId,
      req.user._id,
      req.user.role
    );
    successResponse(res, 200, 'Image removed', { product });
  } catch (err) {
    next(err);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const { products, pagination } = await productService.getSellerProducts(req.user._id, req.query);
    paginatedResponse(res, 'Seller products fetched', { products }, pagination);
  } catch (err) {
    next(err);
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct, removeProductImage, getMyProducts };
