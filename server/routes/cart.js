const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Middleware to ensure cart exists in session
const ensureCart = (req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// View cart
router.get('/', ensureCart, (req, res) => {
  res.render('cart', {
    title: 'Shopping Cart',
    cart: req.session.cart,
    totalAmount: req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  });
});

// Add item to cart
router.post('/add/:id', ensureCart, async (req, res) => {
  try {
    const menuItemId = req.params.id;
    const { quantity = 1, dietPreference = 'Normal',calories } = req.body;
    
    // Store diet preference in session for checkout
    req.session.dietPreference = dietPreference;
    
    // Find menu item
    const menuItem = await MenuItem.findById(menuItemId);
    
    if (!menuItem || !menuItem.isAvailable) {
      return res.status(404).json({ success: false, message: 'Item not available' });
    }
    
    // Check if item already in cart
    const existingItemIndex = req.session.cart.findIndex(item => item.id === menuItemId);
    
    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      req.session.cart[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item to cart
      req.session.cart.push({
        id: menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        quantity: parseInt(quantity),
        dietCalories: menuItem.calories || menuItem.dietCalories,
        isVegetarian: menuItem.isVegetarian
      });
    }
    
    if (req.xhr) {
      return res.json({ 
        success: true, 
        cartCount: req.session.cart.reduce((acc, item) => acc + item.quantity, 0)
      });
    }
    
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    if (req.xhr) {
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Server Error' }
    });
  }
});

// Update item quantity
router.post('/update/:index', ensureCart, (req, res) => {
  const { index } = req.params;
  const { quantity } = req.body;
  
  if (index >= 0 && index < req.session.cart.length) {
    req.session.cart[index].quantity = parseInt(quantity);
    
    // Remove item if quantity is 0
    if (req.session.cart[index].quantity <= 0) {
      req.session.cart.splice(index, 1);
    }
  }
  
  res.redirect('/cart');
});

// Remove item from cart
router.post('/remove/:index', ensureCart, (req, res) => {
  const { index } = req.params;
  
  if (index >= 0 && index < req.session.cart.length) {
    req.session.cart.splice(index, 1);
  }
  
  res.redirect('/cart');
});

// Checkout page
router.get('/checkout', isAuthenticated, ensureCart, async (req, res) => {
  try {
    if (req.session.cart.length === 0) {
      return res.redirect('/cart');
    }
    
    // Get user data for pre-filling checkout form
    const user = await require('../models/User').findById(req.session.user.id);
    
    res.render('checkout', {
      title: 'Checkout',
      cart: req.session.cart,
      totalAmount: req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      user,
      dietPreference: req.session.dietPreference || 'Normal'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Server Error' }
    });
  }
});

// Clear cart
router.post('/clear', ensureCart, (req, res) => {
  req.session.cart = [];
  res.redirect('/cart');
});

module.exports = router;