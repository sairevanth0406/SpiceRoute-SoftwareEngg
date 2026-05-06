require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const morgan = require('morgan');

const indexRoutes = require('./server/routes/index');
const menuRoutes = require('./server/routes/menu');
const cartRoutes = require('./server/routes/cart');
const authRoutes = require('./server/routes/auth');
const apiRoutes = require('./server/routes/api');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spice-route')
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'spice-route-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  const cart = req.session.cart || [];
  res.locals.currentUser = req.session.user || null;
  res.locals.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  next();
});

app.use('/', indexRoutes);
app.use('/menu', menuRoutes);
app.use('/cart', cartRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Spice Route server is running' });
});

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    error: { status: 404, message: 'Page not found' }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
