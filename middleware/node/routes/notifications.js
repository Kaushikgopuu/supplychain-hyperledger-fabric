const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory notification store (in production, use a database)
const notifications = new Map();

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
router.get('/', (req, res) => {
  try {
    const userNotifications = notifications.get(req.user.userId) || [];
    
    res.json({
      success: true,
      count: userNotifications.length,
      data: userNotifications
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', (req, res) => {
  try {
    const notificationId = req.params.id;
    const userNotifications = notifications.get(req.user.userId) || [];
    
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date().toISOString();

    notifications.set(req.user.userId, userNotifications);

    logger.info(`Notification ${notificationId} marked as read by ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', (req, res) => {
  try {
    const userNotifications = notifications.get(req.user.userId) || [];
    
    userNotifications.forEach(notification => {
      notification.read = true;
      notification.readAt = new Date().toISOString();
    });

    notifications.set(req.user.userId, userNotifications);

    logger.info(`All notifications marked as read by ${req.user.userId}`);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', (req, res) => {
  try {
    const notificationId = req.params.id;
    const userNotifications = notifications.get(req.user.userId) || [];
    
    const notificationIndex = userNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    userNotifications.splice(notificationIndex, 1);
    notifications.set(req.user.userId, userNotifications);

    logger.info(`Notification ${notificationId} deleted by ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread/count
// @access  Private
router.get('/unread/count', (req, res) => {
  try {
    const userNotifications = notifications.get(req.user.userId) || [];
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread notifications count'
    });
  }
});

// @desc    Create notification (internal function)
// @access  Private (used by other routes)
const createNotification = (userId, type, title, message, data = {}) => {
  try {
    const userNotifications = notifications.get(userId) || [];
    
    const notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: type,
      title: title,
      message: message,
      data: data,
      read: false,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    userNotifications.unshift(notification); // Add to beginning
    
    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.splice(100);
    }

    notifications.set(userId, userNotifications);

    logger.info(`Notification created for user ${userId}: ${title}`);

    return notification;
  } catch (error) {
    logger.error('Create notification error:', error);
    return null;
  }
};

// @desc    Send test notification
// @route   POST /api/notifications/test
// @access  Private
router.post('/test', (req, res) => {
  try {
    const notification = createNotification(
      req.user.userId,
      'test',
      'Test Notification',
      'This is a test notification to verify the notification system is working.',
      { testData: true }
    );

    if (notification) {
      // Send real-time notification
      req.io.to(`user-${req.user.userId}`).emit('notification', notification);

      res.json({
        success: true,
        message: 'Test notification sent successfully',
        data: notification
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create test notification'
      });
    }

  } catch (error) {
    logger.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
router.delete('/', (req, res) => {
  try {
    notifications.set(req.user.userId, []);

    logger.info(`All notifications cleared for user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'All notifications cleared successfully'
    });

  } catch (error) {
    logger.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
});

module.exports = { router, createNotification };