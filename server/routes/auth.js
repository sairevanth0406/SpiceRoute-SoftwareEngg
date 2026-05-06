const express = require('express');
const router = express.Router();
const User = require('../models/User');

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.status(400).json({ success: false, message: 'Already authenticated' });
};

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', errorMessage: null });
});

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up', errorMessage: null });
});

router.post('/signup', isNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const user = new User({ name, email, password, phone });
    await user.save();

    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred during sign up' });
  }
});

router.post('/signup-form', isNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).render('signup', {
        title: 'Sign Up',
        errorMessage: 'Passwords do not match'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('signup', {
        title: 'Sign Up',
        errorMessage: 'Email is already registered'
      });
    }

    const user = new User({ name, email, password, phone });
    await user.save();
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).render('signup', {
      title: 'Sign Up',
      errorMessage: 'An error occurred during sign up'
    });
  }
});

router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});

router.post('/login-form', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render('login', {
        title: 'Login',
        errorMessage: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render('login', {
        title: 'Login',
        errorMessage: 'Invalid email or password'
      });
    }

    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).render('login', {
      title: 'Login',
      errorMessage: 'An error occurred during login'
    });
  }
});

router.get('/user', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.session.user.id).select('-password');
    if (!user) {
      req.session.destroy(() => {});
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        phone: user.phone,
        walletBalance: user.walletBalance || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

router.get('/logout', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).render('error', {
        title: 'Error',
        error: { status: 500, message: 'Server Error' }
      });
    }
    res.redirect('/');
  });
});

module.exports = router;
