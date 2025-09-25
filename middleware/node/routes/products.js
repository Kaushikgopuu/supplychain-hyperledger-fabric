const express = require('express');
const QRCode = require('qrcode');
const fabricService = require('../config/fabric');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Manufacturer only)
router.post('/', authorize(['Manufacturer']), async (req, res) => {
  try {
    const { id, name, description, category, price } = req.body;

    // Validate required fields
    if (!id || !name || !description || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Generate QR code
    const qrData = {
      productId: id,
      name: name,
      manufacturer: req.user.userId,
      timestamp: new Date().toISOString()
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create product on blockchain
    const contract = await fabricService.getContract(req.user.userId);
    await contract.submitTransaction(
      'CreateProduct',
      id,
      name,
      description,
      category,
      price.toString(),
      qrCode,
      req.user.userId
    );

    logger.info(`Product created: ${id} by ${req.user.userId}`);

    // Send notification to connected clients
    req.io.emit('product-created', {
      productId: id,
      name: name,
      manufacturer: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id,
        name,
        description,
        category,
        price,
        qrCode,
        status: 'Created',
        owner: req.user.userId
      }
    });

  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product'
    });
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetAllProducts');
    const products = JSON.parse(result.toString());

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetProduct', req.params.id);
    const product = JSON.parse(result.toString());

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    logger.error('Get product error:', error);
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
});

// @desc    Get products by owner
// @route   GET /api/products/owner/:ownerId
// @access  Private
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetProductsByOwner', req.params.ownerId);
    const products = JSON.parse(result.toString());

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    logger.error('Get products by owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
});

// @desc    Transfer product
// @route   PUT /api/products/:id/transfer
// @access  Private
router.put('/:id/transfer', async (req, res) => {
  try {
    const { newOwner, location, description } = req.body;

    if (!newOwner || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide newOwner, location, and description'
      });
    }

    const contract = await fabricService.getContract(req.user.userId);
    
    // First get the product to check ownership
    const productResult = await contract.evaluateTransaction('GetProduct', req.params.id);
    const product = JSON.parse(productResult.toString());

    if (product.owner !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only transfer products you own'
      });
    }

    await contract.submitTransaction(
      'TransferProduct',
      req.params.id,
      newOwner,
      location,
      description
    );

    logger.info(`Product ${req.params.id} transferred from ${req.user.userId} to ${newOwner}`);

    // Send notifications
    req.io.to(`user-${newOwner}`).emit('product-received', {
      productId: req.params.id,
      from: req.user.userId,
      location: location
    });

    req.io.to(`user-${req.user.userId}`).emit('product-transferred', {
      productId: req.params.id,
      to: newOwner,
      location: location
    });

    res.json({
      success: true,
      message: 'Product transferred successfully'
    });

  } catch (error) {
    logger.error('Transfer product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to transfer product'
    });
  }
});

// @desc    Update product status
// @route   PUT /api/products/:id/status
// @access  Private
router.put('/:id/status', async (req, res) => {
  try {
    const { status, location, description } = req.body;

    if (!status || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status, location, and description'
      });
    }

    const contract = await fabricService.getContract(req.user.userId);
    
    // Check if user has permission to update this product
    const productResult = await contract.evaluateTransaction('GetProduct', req.params.id);
    const product = JSON.parse(productResult.toString());

    if (product.owner !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update products you own'
      });
    }

    await contract.submitTransaction(
      'UpdateProductStatus',
      req.params.id,
      status,
      location,
      description
    );

    logger.info(`Product ${req.params.id} status updated to ${status} by ${req.user.userId}`);

    // Send notification
    req.io.emit('product-status-updated', {
      productId: req.params.id,
      status: status,
      location: location,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Product status updated successfully'
    });

  } catch (error) {
    logger.error('Update product status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product status'
    });
  }
});

// @desc    Get product history
// @route   GET /api/products/:id/history
// @access  Private
router.get('/:id/history', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetProductHistory', req.params.id);
    const history = JSON.parse(result.toString());

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Get product history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product history'
    });
  }
});

// @desc    Get my products
// @route   GET /api/products/my/products
// @access  Private
router.get('/my/products', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetProductsByOwner', req.user.userId);
    const products = JSON.parse(result.toString());

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    logger.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your products'
    });
  }
});

module.exports = router;