const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const menuData = require('../../menuData').data;
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spice-route', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const seedDatabase = async () => {
  try {
    // Clear existing data
    await MenuItem.deleteMany({});
    console.log('Cleared menu items collection');
    
    // Add calories to each menu item
    const enhancedMenuData = menuData.map(item => {
      // Generate random calories based on food type
      const baseCalories = item.isVegetarian ? 250 : 350;
      const variation = Math.floor(Math.random() * 150);
      
      return {
        ...item,
        calories: baseCalories + variation
      };
    });
    
    // Insert new data
    await MenuItem.insertMany(enhancedMenuData);
    console.log(`Seeded ${enhancedMenuData.length} menu items`);
    
    // Close connection
    mongoose.connection.close();
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();