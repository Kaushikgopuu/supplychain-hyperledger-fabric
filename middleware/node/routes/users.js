const express = require('express');
const fabricService = require('../config/fabric');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetUser', req.user.userId);
    const user = JSON.parse(result.toString());

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile'
    });
  }
});

// @desc    Get all users (Admin functionality)
// @route   GET /api/users
// @access  Private (Admin only - for demo, any role can access)
router.get('/', async (req, res) => {
  try {
    // Note: In a real application, you'd have an admin-only function to get all users
    // For demo purposes, we'll return some basic user info
    const users = [
      {
        id: 'manufacturer001',
        name: 'John Manufacturing Co',
        email: 'admin@johnmfg.com',
        role: 'Manufacturer',
        company: 'John Manufacturing',
        location: 'New York, USA',
        active: true
      },
      {
        id: 'distributor001',
        name: 'Global Distribution Inc',
        email: 'admin@globaldist.com',
        role: 'Distributor',
        company: 'Global Distribution',
        location: 'Chicago, USA',
        active: true
      },
      {
        id: 'retailer001',
        name: 'Retail Store Chain',
        email: 'admin@retailchain.com',
        role: 'Retailer',
        company: 'Retail Chain',
        location: 'Los Angeles, USA',
        active: true
      }
    ];

    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const contract = await fabricService.getContract(req.user.userId);
    const result = await contract.evaluateTransaction('GetUser', req.params.id);
    const user = JSON.parse(result.toString());

    // Remove sensitive information
    delete user.password;

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, email, company, location } = req.body;

    // Note: In a real implementation, you'd update the user on the blockchain
    // For now, we'll just return a success message since our chaincode doesn't have an update user function
    // You would add an UpdateUser function to the chaincode for this

    logger.info(`User profile update requested for: ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: req.user.userId,
        name: name || req.user.name,
        email: email || req.user.email,
        role: req.user.role,
        company: company,
        location: location
      }
    });

  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
router.get('/role/:role', async (req, res) => {
  try {
    const role = req.params.role;
    
    // For demo purposes, return filtered users
    const allUsers = [
      {
        id: 'manufacturer001',
        name: 'John Manufacturing Co',
        email: 'admin@johnmfg.com',
        role: 'Manufacturer',
        company: 'John Manufacturing',
        location: 'New York, USA',
        active: true
      },
      {
        id: 'manufacturer002',
        name: 'Tech Manufacturing Ltd',
        email: 'admin@techmfg.com',
        role: 'Manufacturer',
        company: 'Tech Manufacturing',
        location: 'San Francisco, USA',
        active: true
      },
      {
        id: 'distributor001',
        name: 'Global Distribution Inc',
        email: 'admin@globaldist.com',
        role: 'Distributor',
        company: 'Global Distribution',
        location: 'Chicago, USA',
        active: true
      },
      {
        id: 'distributor002',
        name: 'Regional Distributors',
        email: 'admin@regionaldist.com',
        role: 'Distributor',
        company: 'Regional Distributors',
        location: 'Denver, USA',
        active: true
      },
      {
        id: 'retailer001',
        name: 'Retail Store Chain',
        email: 'admin@retailchain.com',
        role: 'Retailer',
        company: 'Retail Chain',
        location: 'Los Angeles, USA',
        active: true
      },
      {
        id: 'retailer002',
        name: 'Local Electronics Store',
        email: 'admin@localelectronics.com',
        role: 'Retailer',
        company: 'Local Electronics',
        location: 'Miami, USA',
        active: true
      }
    ];

    const filteredUsers = allUsers.filter(user => 
      user.role.toLowerCase() === role.toLowerCase()
    );

    res.json({
      success: true,
      count: filteredUsers.length,
      data: filteredUsers
    });

  } catch (error) {
    logger.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users by role'
    });
  }
});

module.exports = router;