const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

// Middleware to check if user is NOT authenticated
const isNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.status(400).json({ success: false, message: 'Already authenticated' });
};

// Register new user
router.post('/signup', isNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone
    });
    
    await user.save();
    
    // Store user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during sign up'
    });
  }
});

// Login user
router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Store user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

// Get current user
router.get('/user', async (req, res) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user.id).select('-password');
      
      if (!user) {
        req.session.destroy();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          address: user.address,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  } else {
    res.json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Logout user
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

module.exports = router;