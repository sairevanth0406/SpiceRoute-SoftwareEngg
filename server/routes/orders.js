const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// Place order
router.post('/place', isAuthenticated, async (req, res) => {
  try {
    // Check if cart is empty
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.redirect('/cart');
    }
    
    const {
      street, city, state, zipCode,
      phone, paymentMethod, dietPreference
    } = req.body;
    
    // Calculate total amount
    const totalAmount = req.session.cart.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    
    // Create order items
    const orderItems = req.session.cart.map(item => ({
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
    
    res.render('order-confirmation', {
      title: 'Order Confirmation',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to place order' }
    });
  }
});

// View order history
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .sort({ orderDate: -1 });
    
    res.render('order-history', {
      title: 'Order History',
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to fetch order history' }
    });
  }
});

// View order details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem');
    
    if (!order || order.user.toString() !== req.session.user.id) {
      return res.status(404).render('error', {
        title: 'Error',
        error: { status: 404, message: 'Order not found' }
      });
    }
    
    res.render('order-detail', {
      title: 'Order Details',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Failed to fetch order details' }
    });
  }
});

module.exports = router;