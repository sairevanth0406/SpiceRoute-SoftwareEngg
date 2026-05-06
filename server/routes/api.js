const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

// Get menu items
router.get('/menu', async (req, res) => {
  try {
    const { category, vegetarian } = req.query;
    
    // Build filter object
    const filter = { isAvailable: true };
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (vegetarian === 'true') {
      filter.isVegetarian = true;
    } else if (vegetarian === 'false') {
      filter.isVegetarian = false;
    }
    
    // Get menu items
    const menuItems = await MenuItem.find(filter);
    
    // Get all categories for filter dropdown
    const categories = await MenuItem.distinct('category');
    
    res.json({
      success: true,
      menuItems,
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get menu item by ID
router.get('/menu/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    
    res.json({
      success: true,
      menuItem
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get featured menu items for home page
router.get('/featured', async (req, res) => {
  try {
    // Get featured menu items (available items, limit to 6)
    const featuredItems = await MenuItem.find({ isAvailable: true })
      .sort({ price: -1 })
      .limit(6);
    
    // Get vegetarian menu items
    const vegItems = await MenuItem.find({ isVegetarian: true, isAvailable: true })
      .limit(4);
    
    // Get non-vegetarian menu items
    const nonVegItems = await MenuItem.find({ isVegetarian: false, isAvailable: true })
      .limit(4);
    
    res.json({
      success: true,
      featuredItems,
      vegItems,
      nonVegItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Cart management
router.post('/cart/add/:id', isAuthenticated, async (req, res) => {
  try {
    const menuItemId = req.params.id;
    const { quantity = 1, dietPreference = 'Normal' ,dietCalories} = req.body;
    
    // Store diet preference in session for checkout
    req.session.dietPreference = dietPreference;
    
    // Find menu item
    const menuItem = await MenuItem.findById(menuItemId);
    
    if (!menuItem || !menuItem.isAvailable) {
      return res.status(404).json({ success: false, message: 'Item not available' });
    }
    
    // Initialize cart if not exists
    if (!req.session.cart) {
      req.session.cart = [];
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
        dietCalories: parseInt(dietCalories || menuItem.dietCalories),
        isVegetarian: menuItem.isVegetarian
      });
    }
    
    res.json({
      success: true,
      cart: req.session.cart,
      cartCount: req.session.cart.reduce((acc, item) => acc + item.quantity, 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get cart
router.get('/cart', isAuthenticated, (req, res) => {
  const cart = req.session.cart || [];
  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalCalories = cart.reduce((acc, item) => acc + (item.dietCalories * item.quantity), 0);
  res.json({
    success: true,
    cart,
    totalAmount,
    dietPreference: req.session.dietPreference || 'Normal'
    // dietCalories: menuItem.dietCalories,
  });
});

// Update cart item quantity
router.put('/cart/update/:index', isAuthenticated, (req, res) => {
  const { index } = req.params;
  const { quantity } = req.body;
  const cart = req.session.cart || [];
  
  if (index >= 0 && index < cart.length) {
    cart[index].quantity = parseInt(quantity);
    
    // Remove item if quantity is 0
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    
    req.session.cart = cart;
  }
  
  res.json({
    success: true,
    cart,
    totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    cartCount: cart.reduce((acc, item) => acc + item.quantity, 0)
  });
});

// Remove item from cart
router.delete('/cart/remove/:index', isAuthenticated, (req, res) => {
  const { index } = req.params;
  const cart = req.session.cart || [];
  
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    req.session.cart = cart;
  }
  
  res.json({
    success: true,
    cart,
    totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    cartCount: cart.reduce((acc, item) => acc + item.quantity, 0)
  });
});

// Clear cart
router.delete('/cart/clear', isAuthenticated, (req, res) => {
  req.session.cart = [];
  
  res.json({
    success: true,
    cart: [],
    totalAmount: 0,
    cartCount: 0
  });
});

// Place order
router.post('/orders/place', isAuthenticated, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    
    // Check if cart is empty
    if (cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    const {
      street, city, state, zipCode,
      phone, paymentMethod, dietPreference
    } = req.body;
    
    // Calculate total amount
    const totalAmount = cart.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    
    // Create order items
    const orderItems = cart.map(item => ({
      menuItem: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    
    // Create new order
    const order = new Order({
      user: req.session.user.id,
      items: orderItems,
      totalAmount,
      deliveryAddress: {
        street,
        city,
        state,
        zipCode
      },
      phoneNumber: phone,
      dietPreference: dietPreference || 'Normal',
      paymentMethod
    });
    
    await order.save();
    
    // Clear cart after successful order
    req.session.cart = [];
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// Get user's order history
router.get('/orders/history', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .sort({ orderDate: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
});

// Get order details
router.get('/orders/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem');
    
    if (!order || order.user.toString() !== req.session.user.id) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const { name, phone, street, city, state, zipCode } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      {
        name,
        phone,
        address: {
          street,
          city,
          state,
          zipCode
        }
      },
      { new: true }
    ).select('-password');
    
    // Update session
    req.session.user.name = name;
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;