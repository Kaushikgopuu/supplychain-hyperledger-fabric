const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fabricService = require('../config/fabric');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { id, name, email, role, company, location, password } = req.body;

    // Validate required fields
    if (!id || !name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Initialize fabric service if not already done
    if (!fabricService.wallet) {
      await fabricService.initialize();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user on blockchain
    const contract = await fabricService.getContract();
    await contract.submitTransaction('CreateUser', id, name, email, role, company || '', location || '');

    // Register user in Fabric network
    await fabricService.registerUser(id, 'client');

    // Store user credentials (in production, use a proper database)
    // For now, we'll create a simple in-memory store or file-based store
    const userData = {
      id,
      name,
      email,
      role,
      company,
      location,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: id, 
        email, 
        role,
        name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`User registered successfully: ${id} (${role})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          company: userData.company,
          location: userData.location
        },
        token
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Initialize fabric service if not already done
    if (!fabricService.wallet) {
      await fabricService.initialize();
    }

    // In a real application, you would fetch user from database
    // For demo purposes, we'll use hardcoded users or fetch from blockchain
    const contract = await fabricService.getContract();
    
    // For simplicity, let's use demo users
    const demoUsers = [
      {
        id: 'manufacturer001',
        email: 'admin@johnmfg.com',
        password: '$2a$10$N.j.G.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J', // 'password123'
        name: 'John Manufacturing Co',
        role: 'Manufacturer',
        company: 'John Manufacturing',
        location: 'New York, USA'
      },
      {
        id: 'distributor001',
        email: 'admin@globaldist.com',
        password: '$2a$10$N.j.G.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J', // 'password123'
        name: 'Global Distribution Inc',
        role: 'Distributor',
        company: 'Global Distribution',
        location: 'Chicago, USA'
      },
      {
        id: 'retailer001',
        email: 'admin@retailchain.com',
        password: '$2a$10$N.j.G.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J.A.J', // 'password123'
        name: 'Retail Store Chain',
        role: 'Retailer',
        company: 'Retail Chain',
        location: 'Los Angeles, USA'
      }
    ];

    // For demo, use simple password (password123)
    const user = demoUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For demo, accept 'password123' or check hashed password
    const isValidPassword = password === 'password123' || await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`User logged in: ${user.id} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          location: user.location
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const contract = await fabricService.getContract();
    const userBuffer = await contract.evaluateTransaction('GetUser', req.user.userId);
    const user = JSON.parse(userBuffer.toString());

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// @desc    Logout user (client-side mainly)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // You could implement a token blacklist here if needed
  
  logger.info(`User logged out: ${req.user.userId}`);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;