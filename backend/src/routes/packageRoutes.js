const express = require('express');
const router = express.Router();
const { getPublicPackages, getPublicPackageById, purchasePackage } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// @desc  Get visible packages for user store
// @route GET /api/packages
// @access Public
router.get('/', getPublicPackages);

// @desc  Get visible package detail for user store
// @route GET /api/packages/:id
// @access Public
router.get('/:id', getPublicPackageById);

// @desc  Purchase a package
// @route POST /api/packages/purchase/:id
// @access Private
router.post('/purchase/:id', protect, purchasePackage);

module.exports = router;
