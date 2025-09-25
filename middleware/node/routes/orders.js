const express = require('express');
const fabricService = require('../config/fabric');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { id, productId, sellerId, quantity, totalPrice } = req.body;

    // Validate required fields
    if (!id || !productId || !sellerId || !quantity || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const contract = await fabricService.getContract(req.user.userId);
    
    // Create order on blockchain
    await contract.submitTransaction(
      'CreateOrder',
      id,
      productId,
      req.user.userId, // buyerId
      sellerId,
      quantity.toString(),
      totalPrice.toString()
    );

    logger.info(`Order created: ${id} by ${req.user.userId}`);

    // Send notifications
    req.io.to(`user-${sellerId}`).emit('new-order', {
      orderId: id,
      productId: productId,
      buyerId: req.user.userId,
      quantity: quantity,
      totalPrice: totalPrice
    });

    req.io.to(`user-${req.user.userId}`).emit('order-created', {
      orderId: id,
      productId: productId,
      sellerId: sellerId
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id,
        productId,
        buyerId: req.user.userId,
        sellerId,
        quantity,
        totalPrice,
        status: 'Pending'
      }
    });

  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

// @desc    Get all orders for current user
// @route   GET /api/orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetOrdersByUser', req.user.userId);
    const orders = JSON.parse(result.toString());

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetOrder', req.params.id);
    const order = JSON.parse(result.toString());

    // Check if user is authorized to view this order
    if (order.buyerId !== req.user.userId && order.sellerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Get order error:', error);
    res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const contract = await fabricService.getContract(req.user.userId);
    
    // First get the order to check permissions
    const orderResult = await contract.evaluateTransaction('GetOrder', req.params.id);
    const order = JSON.parse(orderResult.toString());

    // Check if user is authorized to update this order
    if (order.buyerId !== req.user.userId && order.sellerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order'
      });
    }

    // Update order status
    await contract.submitTransaction('UpdateOrderStatus', req.params.id, status);

    logger.info(`Order ${req.params.id} status updated to ${status} by ${req.user.userId}`);

    // Send notifications to both buyer and seller
    const notificationData = {
      orderId: req.params.id,
      status: status,
      updatedBy: req.user.userId
    };

    req.io.to(`user-${order.buyerId}`).emit('order-status-updated', notificationData);
    req.io.to(`user-${order.sellerId}`).emit('order-status-updated', notificationData);

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
});

// @desc    Get orders by status
// @route   GET /api/orders/status/:status
// @access  Private
router.get('/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    const contract = await fabricService.getContract(req.user.userId);
    
    // Get all orders for the user
    const result = await contract.evaluateTransaction('GetOrdersByUser', req.user.userId);
    const allOrders = JSON.parse(result.toString());
    
    // Filter by status
    const filteredOrders = allOrders.filter(order => 
      order.status.toLowerCase() === status.toLowerCase()
    );

    res.json({
      success: true,
      count: filteredOrders.length,
      data: filteredOrders
    });

  } catch (error) {
    logger.error('Get orders by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders by status'
    });
  }
});

// @desc    Get my buy orders
// @route   GET /api/orders/my/purchases
// @access  Private
router.get('/my/purchases', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetOrdersByUser', req.user.userId);
    const allOrders = JSON.parse(result.toString());
    
    // Filter to only orders where current user is the buyer
    const purchaseOrders = allOrders.filter(order => order.buyerId === req.user.userId);

    res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders
    });

  } catch (error) {
    logger.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchase orders'
    });
  }
});

// @desc    Get my sell orders
// @route   GET /api/orders/my/sales
// @access  Private
router.get('/my/sales', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetOrdersByUser', req.user.userId);
    const allOrders = JSON.parse(result.toString());
    
    // Filter to only orders where current user is the seller
    const salesOrders = allOrders.filter(order => order.sellerId === req.user.userId);

    res.json({
      success: true,
      count: salesOrders.length,
      data: salesOrders
    });

  } catch (error) {
    logger.error('Get sales orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sales orders'
    });
  }
});

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    
    // First get the order to check permissions and status
    const orderResult = await contract.evaluateTransaction('GetOrder', req.params.id);
    const order = JSON.parse(orderResult.toString());

    // Check if user is authorized to cancel this order
    if (order.buyerId !== req.user.userId && order.sellerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in its current status'
      });
    }

    // Update order status to cancelled
    await contract.submitTransaction('UpdateOrderStatus', req.params.id, 'Cancelled');

    logger.info(`Order ${req.params.id} cancelled by ${req.user.userId}`);

    // Send notifications
    const notificationData = {
      orderId: req.params.id,
      status: 'Cancelled',
      cancelledBy: req.user.userId
    };

    req.io.to(`user-${order.buyerId}`).emit('order-cancelled', notificationData);
    req.io.to(`user-${order.sellerId}`).emit('order-cancelled', notificationData);

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
});

module.exports = router;