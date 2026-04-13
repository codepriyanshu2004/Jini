const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  removeProductImage,
  getMyProducts,
} = require('../controllers/product.controller');

const { protect, requireApprovedSeller } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');
const validate = require('../middleware/validate');
const {
  createProductValidator,
  updateProductValidator,
  productQueryValidator,
} = require('../middleware/validators/product.validators');

// Public routes
router.get('/', productQueryValidator, validate, getProducts);
router.get('/:id', getProductById);

// Protected seller routes
router.use(protect);
router.get('/seller/my-products', requireApprovedSeller, getMyProducts);

router.post(
  '/',
  requireApprovedSeller,
  upload.array('images', 6),
  createProductValidator,
  validate,
  createProduct
);

router.patch(
  '/:id',
  requireApprovedSeller,
  upload.array('images', 6),
  updateProductValidator,
  validate,
  updateProduct
);

router.delete('/:id', requireApprovedSeller, deleteProduct);
router.delete('/:id/images/:publicId', requireApprovedSeller, removeProductImage);

module.exports = router;
