 const express = require('express');
 const router = express.Router();
 const MenuItem = require('../models/MenuItem');
 const Order = require('../models/Order');
 const User = require('../models/User');
 const { calculatePricing } = require('../utils/pricing');
 const { sendOrderPlacedMessage } = require('../utils/orderSms');
 const { buildChatbotReply } = require('../utils/chatbotEngine');
 const {
   createStegoReceiptForOrder,
   extractStegoMessageFromReceipt
 } = require('../utils/steganography');
 
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentication required' });
};

const buildImageDataUrl = (imageData, mimeType = 'image/png') => {
  if (!Buffer.isBuffer(imageData) || imageData.length === 0) {
    return null;
  }
  return `data:${mimeType};base64,${imageData.toString('base64')}`;
};
 
 router.get('/menu', async (req, res) => {
   try {
     const { category, vegetarian } = req.query;
     const filter = { isAvailable: true };
 
     if (category && category !== 'All') {
       filter.category = category;
     }
 
     if (vegetarian === 'true') {
       filter.isVegetarian = true;
     } else if (vegetarian === 'false') {
       filter.isVegetarian = false;
     }
 
     const menuItems = await MenuItem.find(filter);
     const categories = await MenuItem.distinct('category');
 
     res.json({ success: true, menuItems, categories });
   } catch (err) {
     console.error(err);
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 });
 
 router.get('/menu/:id', async (req, res) => {
   try {
     const menuItem = await MenuItem.findById(req.params.id);
     if (!menuItem) {
       return res.status(404).json({ success: false, message: 'Menu item not found' });
     }
 
     res.json({ success: true, menuItem });
   } catch (err) {
     console.error(err);
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 });
 
 router.get('/featured', async (req, res) => {
   try {
     const featuredItems = await MenuItem.find({ isAvailable: true }).sort({ price: -1 }).limit(6);
     const vegItems = await MenuItem.find({ isVegetarian: true, isAvailable: true }).limit(4);
     const nonVegItems = await MenuItem.find({ isVegetarian: false, isAvailable: true }).limit(4);
 
     res.json({ success: true, featuredItems, vegItems, nonVegItems });
   } catch (err) {
     console.error(err);
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 });
 
 router.post('/chatbot/message', async (req, res) => {
   try {
     const { message } = req.body;
     const chatContext = {
       isLoggedIn: Boolean(req.session.user),
       name: req.session.user ? req.session.user.name : null,
       walletBalance: null
     };
 
     if (req.session.user && req.session.user.id) {
       const user = await User.findById(req.session.user.id).select('walletBalance');
       if (user) {
         chatContext.walletBalance = user.walletBalance || 0;
       }
     }
 
     const response = buildChatbotReply(message, chatContext);
     res.json({
       success: true,
       ...response
     });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Failed to process chatbot message' });
   }
 });
 
 router.post('/cart/add/:id', isAuthenticated, async (req, res) => {
   try {
     const menuItemId = req.params.id;
     const { quantity = 1, dietPreference = 'Normal', dietCalories } = req.body;
     req.session.dietPreference = dietPreference;
 
     const menuItem = await MenuItem.findById(menuItemId);
     if (!menuItem || !menuItem.isAvailable) {
       return res.status(404).json({ success: false, message: 'Item not available' });
     }
 
     if (!req.session.cart) {
       req.session.cart = [];
     }
 
     const existingItemIndex = req.session.cart.findIndex((item) => item.id === menuItemId);
     if (existingItemIndex !== -1) {
       req.session.cart[existingItemIndex].quantity += parseInt(quantity, 10);
     } else {
       req.session.cart.push({
         id: menuItemId,
         name: menuItem.name,
         price: menuItem.price,
         image: menuItem.image,
         quantity: parseInt(quantity, 10),
         dietCalories: parseInt(dietCalories || menuItem.calories || 0, 10),
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
 
 router.get('/cart', isAuthenticated, (req, res) => {
   const cart = req.session.cart || [];
   const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
   const pricing = calculatePricing(subtotal);
   const totalCalories = cart.reduce((acc, item) => acc + ((item.dietCalories || 0) * item.quantity), 0);
 
   res.json({
     success: true,
     cart,
     totalAmount: pricing.subtotal,
     pricing,
     totalCalories,
     dietPreference: req.session.dietPreference || 'Normal'
   });
 });
 
 router.put('/cart/update/:index', isAuthenticated, (req, res) => {
   const { index } = req.params;
   const { quantity } = req.body;
   const cart = req.session.cart || [];
   const itemIndex = parseInt(index, 10);
 
   if (itemIndex >= 0 && itemIndex < cart.length) {
     cart[itemIndex].quantity = parseInt(quantity, 10);
     if (cart[itemIndex].quantity <= 0) {
       cart.splice(itemIndex, 1);
     }
     req.session.cart = cart;
   }
 
   const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
   const pricing = calculatePricing(subtotal);
 
   res.json({
     success: true,
     cart,
     totalAmount: pricing.subtotal,
     pricing,
     cartCount: cart.reduce((acc, item) => acc + item.quantity, 0)
   });
 });
 
 router.delete('/cart/remove/:index', isAuthenticated, (req, res) => {
   const { index } = req.params;
   const cart = req.session.cart || [];
   const itemIndex = parseInt(index, 10);
 
   if (itemIndex >= 0 && itemIndex < cart.length) {
     cart.splice(itemIndex, 1);
     req.session.cart = cart;
   }
 
   const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
   const pricing = calculatePricing(subtotal);
 
   res.json({
     success: true,
     cart,
     totalAmount: pricing.subtotal,
     pricing,
     cartCount: cart.reduce((acc, item) => acc + item.quantity, 0)
   });
 });
 
 router.delete('/cart/clear', isAuthenticated, (req, res) => {
   req.session.cart = [];
   res.json({
     success: true,
     cart: [],
     totalAmount: 0,
     pricing: calculatePricing(0),
     cartCount: 0
   });
 });
 
 router.get('/wallet', isAuthenticated, async (req, res) => {
   try {
     const user = await User.findById(req.session.user.id).select('walletBalance walletTransactions');
     if (!user) {
       return res.status(404).json({ success: false, message: 'User not found' });
     }
 
     res.json({
       success: true,
       walletBalance: user.walletBalance || 0,
       walletTransactions: (user.walletTransactions || []).slice(-10).reverse()
     });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 });
 
 router.post('/wallet/add-funds', isAuthenticated, async (req, res) => {
   try {
     const amount = Number(req.body.amount);
     if (!Number.isFinite(amount) || amount <= 0) {
       return res.status(400).json({ success: false, message: 'Enter a valid amount greater than 0' });
     }
 
     const updatedUser = await User.findByIdAndUpdate(
       req.session.user.id,
       {
         $inc: { walletBalance: amount },
         $push: {
           walletTransactions: {
             type: 'credit',
             amount,
             description: 'Wallet top-up by user'
           }
         }
       },
       { new: true }
     ).select('walletBalance');
 
     if (!updatedUser) {
       return res.status(404).json({ success: false, message: 'User not found' });
     }
 
     res.json({
       success: true,
       message: 'Wallet updated successfully',
       walletBalance: updatedUser.walletBalance
     });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Failed to add funds' });
   }
 });
 
 router.post('/orders/place', isAuthenticated, async (req, res) => {
   try {
     const cart = req.session.cart || [];
     if (cart.length === 0) {
       return res.status(400).json({ success: false, message: 'Cart is empty' });
     }
 
     const { street, city, state, zipCode, phone, dietPreference } = req.body;
     const paymentMethod = 'Wallet';
 
     if (!street || !city || !state || !zipCode || !phone) {
       return res.status(400).json({ success: false, message: 'Delivery details are required' });
     }
 
     const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
     const totalCalories = cart.reduce((acc, item) => acc + ((item.dietCalories || 0) * item.quantity), 0);
     const pricing = calculatePricing(subtotal);
 
     const orderItems = cart.map((item) => ({
       menuItem: item.id,
       name: item.name,
       price: item.price,
       quantity: item.quantity,
       dietCalories: item.dietCalories || 0
     }));
 
     const debitResult = await User.findOneAndUpdate(
       { _id: req.session.user.id, walletBalance: { $gte: pricing.payableAmount } },
       {
         $inc: { walletBalance: -pricing.payableAmount },
         $push: {
           walletTransactions: {
             type: 'debit',
             amount: pricing.payableAmount,
             description: 'Order payment via wallet'
           }
         }
       },
       { new: true }
     ).select('walletBalance');
 
     if (!debitResult) {
       return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
     }
 
     const order = new Order({
       user: req.session.user.id,
       items: orderItems,
       totalAmount: pricing.payableAmount,
       subtotalAmount: pricing.subtotal,
       deliveryFee: pricing.deliveryFee,
       taxAmount: pricing.taxAmount,
       totalCalories,
       deliveryAddress: { street, city, state, zipCode },
       phoneNumber: phone,
       dietPreference: dietPreference || req.session.dietPreference || 'Normal',
       paymentMethod,
       paymentStatus: 'Paid'
     });
 
     await order.save();
 
      let stegoReceipt = {
        created: false,
        publicPath: null,
        digest: null,
        reason: null
     };
 
     const hiddenPayload = JSON.stringify({
       orderNumber: order.orderNumber,
       orderId: order._id.toString(),
       userId: req.session.user.id,
       items: orderItems.map((item) => ({
         name: item.name,
         quantity: item.quantity,
         unitPrice: item.price
       })),
       paidAmount: pricing.payableAmount,
       walletBalanceAfterPayment: debitResult.walletBalance,
       createdAt: new Date().toISOString()
     });
 
     const condensedItems = orderItems
       .slice(0, 3)
       .map((item) => `${item.name} x${item.quantity}`)
       .join(', ');
     const itemSuffix = orderItems.length > 3 ? ` (+${orderItems.length - 3} more)` : '';
     const visibleReceiptLines = [
       `Order No: ${order.orderNumber}`,
       `Date: ${new Date().toLocaleString('en-IN')}`,
       `Phone: ${phone}`,
       `Items: ${condensedItems}${itemSuffix}`,
       `Subtotal: Rs.${pricing.subtotal.toFixed(2)}`,
       `Tax: Rs.${pricing.taxAmount.toFixed(2)}`,
       `Delivery Fee: Rs.${pricing.deliveryFee.toFixed(2)}`,
       `Total Paid: Rs.${pricing.payableAmount.toFixed(2)}`,
       `Wallet Left: Rs.${debitResult.walletBalance.toFixed(2)}`,
       `Address: ${street}, ${city}, ${state} - ${zipCode}`
     ];
 
      try {
        const stegoResult = await createStegoReceiptForOrder({
          orderNumber: order.orderNumber,
          hiddenText: hiddenPayload,
          visibleLines: visibleReceiptLines
        });

        order.stegoImageData = stegoResult.imageBuffer;
        order.stegoImageMimeType = 'image/png';
        order.stegoImageDataUrl = buildImageDataUrl(stegoResult.imageBuffer, 'image/png');
        order.hiddenPayloadDigest = stegoResult.digest;
        await order.save();

        stegoReceipt = {
          created: true,
          publicPath: `/api/orders/${order._id}/stego-image/file`,
          digest: stegoResult.digest,
          reason: null
        };
      } catch (stegoError) {
        console.error('Steganography generation failed:', stegoError.message);
        stegoReceipt.reason = stegoError.message;
      }
 
     req.session.cart = [];
 
      const smsNotification = await sendOrderPlacedMessage({
        to: phone,
        orderNumber: order.orderNumber,
        items: orderItems,
        debitedAmount: pricing.payableAmount,
        walletBalance: debitResult.walletBalance
      });
      const responseOrder = order.toObject();
      delete responseOrder.stegoImageData;
      delete responseOrder.stegoImageDataUrl;

      res.json({
        success: true,
        order: responseOrder,
        pricing,
        smsNotification,
        stegoReceipt
      });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Failed to place order' });
   }
 });
 
 router.get('/orders/history', isAuthenticated, async (req, res) => {
   try {
     const orders = await Order.find({ user: req.session.user.id }).sort({ orderDate: -1 });
     res.json({ success: true, orders });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Failed to fetch order history' });
   }
 });
 
 router.get('/orders/:id', isAuthenticated, async (req, res) => {
   try {
     const order = await Order.findById(req.params.id).populate('items.menuItem');
     if (!order || order.user.toString() !== req.session.user.id) {
       return res.status(404).json({ success: false, message: 'Order not found' });
     }
     res.json({ success: true, order });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Failed to fetch order details' });
   }
 });
 
  router.get('/orders/:id/stego-image', isAuthenticated, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .select('user hiddenPayloadDigest stegoImageMimeType +stegoImageData +stegoImageDataUrl');
      if (!order || order.user.toString() !== req.session.user.id) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (!order.stegoImageData && !order.stegoImageDataUrl) {
        return res.status(404).json({ success: false, message: 'Stego receipt is not available for this order' });
      }

      return res.json({
        success: true,
        stegoImagePath: `/api/orders/${order._id}/stego-image/file`,
        stegoImageDataUrl: order.stegoImageDataUrl || buildImageDataUrl(order.stegoImageData, order.stegoImageMimeType),
        hiddenPayloadDigest: order.hiddenPayloadDigest
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch stego receipt' });
    }
  });

  router.get('/orders/:id/stego-image/file', isAuthenticated, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).select('user stegoImageMimeType +stegoImageData');
      if (!order || order.user.toString() !== req.session.user.id) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (!order.stegoImageData) {
        return res.status(404).json({ success: false, message: 'Stego receipt is not available for this order' });
      }

      res.set('Content-Type', order.stegoImageMimeType || 'image/png');
      return res.send(order.stegoImageData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch stego receipt file' });
    }
  });

  router.get('/orders/:id/stego-image/data-url', isAuthenticated, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .select('user stegoImageMimeType +stegoImageData +stegoImageDataUrl');
      if (!order || order.user.toString() !== req.session.user.id) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (!order.stegoImageData && !order.stegoImageDataUrl) {
        return res.status(404).json({ success: false, message: 'Stego receipt is not available for this order' });
      }

      return res.json({
        success: true,
        stegoImageDataUrl: order.stegoImageDataUrl || buildImageDataUrl(order.stegoImageData, order.stegoImageMimeType)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch stego receipt data url' });
    }
  });

  router.get('/orders/:id/stego-extract', isAuthenticated, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).select('user hiddenPayloadDigest +stegoImageData');
      if (!order || order.user.toString() !== req.session.user.id) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (!order.stegoImageData) {
        return res.status(404).json({ success: false, message: 'Stego receipt is not available for this order' });
      }

      const extracted = await extractStegoMessageFromReceipt(order.stegoImageData);
     let decodedPayload = extracted.hiddenMessage;
 
     try {
       decodedPayload = JSON.parse(extracted.hiddenMessage);
     } catch (parseError) {
       decodedPayload = extracted.hiddenMessage;
     }
 
     res.json({
       success: true,
       extractedPayload: decodedPayload,
       extractedDigest: extracted.digest,
       digestMatches: extracted.digest === order.hiddenPayloadDigest
     });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Failed to extract stego payload' });
   }
 });
 
 router.get('/profile', isAuthenticated, async (req, res) => {
   try {
     const user = await User.findById(req.session.user.id).select('-password');
     if (!user) {
       return res.status(404).json({ success: false, message: 'User not found' });
     }
     res.json({ success: true, user });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 });
 
 router.put('/profile', isAuthenticated, async (req, res) => {
   try {
     const { name, phone, street, city, state, zipCode } = req.body;
     const updatedUser = await User.findByIdAndUpdate(
       req.session.user.id,
       {
         name,
         phone,
         address: { street, city, state, zipCode }
       },
       { new: true }
     ).select('-password');
 
     req.session.user.name = name;
     res.json({ success: true, user: updatedUser });
   } catch (error) {
     console.error(error);
     res.status(500).json({ success: false, message: 'Server Error' });
   }
 });
 
 module.exports = router;
