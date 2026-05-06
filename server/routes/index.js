const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Home page route
router.get('/', async (req, res) => {
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
    
    res.render('index', { 
      title: 'Spice Route - Authentic Indian Cuisine',
      featuredItems,
      vegItems,
      nonVegItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { 
      title: 'Error', 
      error: { status: 500, message: 'Server Error' } 
    });
  }
});

// About page route
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

// Contact page route
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

module.exports = router;