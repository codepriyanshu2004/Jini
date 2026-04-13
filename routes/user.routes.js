const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, getUserById } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/:id', getUserById);

module.exports = router;
