const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  dietCalories: {
    type: Number,
    required: true,
    default: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true,
    required: true,
    default: function() {
      return Math.floor(Date.now() / 1000);
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  subtotalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 40
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalCalories: {
    type: Number,
    required: true,
    default: 0
  },
  calorieGoal: {
    type: Number,
    required: false
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  dietPreference: {
    type: String,
    enum: ['Diet', 'Normal'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'On the way', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  stegoImageData: {
    type: Buffer,
    default: null,
    select: false
  },
  stegoImageMimeType: {
    type: String,
    default: null
  },
  stegoImageDataUrl: {
    type: String,
    default: null,
    select: false
  },
  hiddenPayloadDigest: {
    type: String,
    default: null
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});

// Remove the existing getNextOrderNumber function and pre-save middleware
// Instead, add this new pre-save middleware
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const timestamp = Math.floor(Date.now() / 1000);
      const random = Math.floor(Math.random() * 1000);
      this.orderNumber = parseInt(`${timestamp}${random}`);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
