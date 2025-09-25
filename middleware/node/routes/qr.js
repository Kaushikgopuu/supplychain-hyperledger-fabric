const express = require('express');
const QRCode = require('qrcode');
const fabricService = require('../config/fabric');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Validate QR code and get product information
// @route   POST /api/qr/validate
// @access  Public (for consumer scanning)
router.post('/validate', async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required'
      });
    }

    // Initialize fabric service if needed
    if (!fabricService.wallet) {
      await fabricService.initialize();
    }

    const contract = await fabricService.getContract();
    const result = await contract.evaluateTransaction('ValidateQRCode', qrCode);
    const product = JSON.parse(result.toString());

    logger.info(`QR code validated for product: ${product.id}`);

    res.json({
      success: true,
      message: 'QR code is valid',
      data: product
    });

  } catch (error) {
    logger.error('QR code validation error:', error);
    res.status(404).json({
      success: false,
      message: 'Invalid QR code or product not found'
    });
  }
});

// @desc    Generate QR code for a product
// @route   POST /api/qr/generate
// @access  Private (Manufacturer only, but we'll allow all authenticated users for demo)
router.post('/generate', async (req, res) => {
  try {
    const { productId, data } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Create QR code data
    const qrData = {
      productId: productId,
      timestamp: new Date().toISOString(),
      generatedBy: req.user?.userId || 'system',
      ...data
    };

    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate QR code as SVG
    const qrCodeSVG = await QRCode.toString(JSON.stringify(qrData), {
      type: 'svg',
      width: 256
    });

    logger.info(`QR code generated for product: ${productId}`);

    res.json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        productId: productId,
        qrData: qrData,
        qrCodeImage: qrCodeImage,
        qrCodeSVG: qrCodeSVG
      }
    });

  } catch (error) {
    logger.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    });
  }
});

// @desc    Scan QR code and get product journey
// @route   POST /api/qr/scan
// @access  Public
router.post('/scan', async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    if (!parsedData.productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID not found in QR code'
      });
    }

    // Initialize fabric service if needed
    if (!fabricService.wallet) {
      await fabricService.initialize();
    }

    const contract = await fabricService.getContract();
    
    // Get product information
    const productResult = await contract.evaluateTransaction('GetProduct', parsedData.productId);
    const product = JSON.parse(productResult.toString());

    // Get product history
    const historyResult = await contract.evaluateTransaction('GetProductHistory', parsedData.productId);
    const history = JSON.parse(historyResult.toString());

    logger.info(`QR code scanned for product: ${parsedData.productId}`);

    res.json({
      success: true,
      message: 'Product information retrieved successfully',
      data: {
        product: product,
        history: history,
        scanInfo: {
          scannedAt: new Date().toISOString(),
          qrData: parsedData
        }
      }
    });

  } catch (error) {
    logger.error('QR code scan error:', error);
    res.status(404).json({
      success: false,
      message: 'Product not found or invalid QR code'
    });
  }
});

// @desc    Get QR code for existing product
// @route   GET /api/qr/product/:productId
// @access  Private
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;

    if (!fabricService.wallet) {
      await fabricService.initialize();
    }

    const contract = await fabricService.getContract(req.user?.userId);
    const result = await contract.evaluateTransaction('GetProduct', productId);
    const product = JSON.parse(result.toString());

    if (!product.qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found for this product'
      });
    }

    res.json({
      success: true,
      data: {
        productId: productId,
        productName: product.name,
        qrCode: product.qrCode
      }
    });

  } catch (error) {
    logger.error('Get product QR code error:', error);
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
});

// @desc    Verify product authenticity
// @route   POST /api/qr/verify
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { qrData, expectedProductId } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    if (!fabricService.wallet) {
      await fabricService.initialize();
    }

    const contract = await fabricService.getContract();
    
    // Validate the QR code matches a real product
    const result = await contract.evaluateTransaction('ValidateQRCode', qrData);
    const product = JSON.parse(result.toString());

    // Additional verification if expected product ID is provided
    if (expectedProductId && product.id !== expectedProductId) {
      return res.status(400).json({
        success: false,
        message: 'QR code does not match expected product',
        data: {
          scannedProductId: product.id,
          expectedProductId: expectedProductId
        }
      });
    }

    const isAuthentic = product && product.id === parsedData.productId;

    logger.info(`Product authenticity verified: ${product.id} - ${isAuthentic ? 'AUTHENTIC' : 'FAKE'}`);

    res.json({
      success: true,
      message: isAuthentic ? 'Product is authentic' : 'Product authenticity could not be verified',
      data: {
        isAuthentic: isAuthentic,
        product: product,
        verificationTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Product verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Product verification failed - potentially fake product',
      data: {
        isAuthentic: false,
        verificationTimestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;