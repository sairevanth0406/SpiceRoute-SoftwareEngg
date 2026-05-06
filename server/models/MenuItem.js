const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Veg', 'Non-Veg']
  },
  isVegetarian: {
    type: Boolean,
    required: true,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  calories: {
    type: Number,
    min: 0,
    default: function() {
      // Generate random calories between 100-800 based on category
      const baseCalories = {
        'Appetizers': 200,
        'Main Course': 500,
        'Desserts': 350,
        'Beverages': 150,
        'Veg': 300,
        'Non-Veg': 400
      };
      
      const base = baseCalories[this.category] || 300;
      return base + Math.floor(Math.random() * 200);
    }
  }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;