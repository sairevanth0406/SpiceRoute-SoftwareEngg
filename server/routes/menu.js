const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all menu items
router.get('/', async (req, res) => {
  try {
    // Get filter parameters
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
    
    res.render('menu', {
      title: 'Our Menu',
      menuItems,
      categories,
      selectedCategory: category || 'All',
      selectedVeg: vegetarian || 'All'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Server Error' }
    });
  }
});

// Get menu item details
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).render('error', {
        title: 'Error',
        error: { status: 404, message: 'Menu item not found' }
      });
    }
    
    res.render('menu-detail', {
      title: menuItem.name,
      menuItem
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      error: { status: 500, message: 'Server Error' }
    });
  }
});

module.exports = router;