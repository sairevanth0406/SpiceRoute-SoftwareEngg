const buildChatbotReply = (rawMessage, context = {}) => {
  const message = String(rawMessage || '').trim();
  const normalized = message.toLowerCase();
  const name = context.name || 'there';

  const menuKeywords = ['menu', 'dish', 'food', 'item', 'available'];
  const cartKeywords = ['cart', 'add to cart', 'remove', 'quantity'];
  const walletKeywords = ['wallet', 'balance', 'money', 'funds', 'top up', 'topup'];
  const orderKeywords = ['order', 'track', 'status', 'delivery', 'arrive'];
  const contactKeywords = ['contact', 'phone', 'call', 'email', 'address'];
  const authKeywords = ['login', 'sign up', 'signup', 'register', 'account'];
  const helloKeywords = ['hi', 'hello', 'hey', 'namaste'];

  const hasKeyword = (keywords) => keywords.some((word) => normalized.includes(word));

  if (!message) {
    return {
      reply: 'Please type your question. I can help with menu, cart, wallet, orders, and contact details.',
      quickReplies: ['Show menu help', 'Wallet help', 'Order help']
    };
  }

  if (hasKeyword(helloKeywords)) {
    return {
      reply: `Hi ${name}! I am your Spice Route assistant. Ask me about menu, wallet payment, cart, or order support.`,
      quickReplies: ['Menu help', 'Wallet balance', 'Order support']
    };
  }

  if (hasKeyword(menuKeywords)) {
    return {
      reply: 'To explore dishes, open the Menu page. You can filter by category and vegetarian preferences, then add items directly to cart.',
      quickReplies: ['Open Menu', 'How to checkout?', 'What is wallet payment?']
    };
  }

  if (hasKeyword(cartKeywords)) {
    return {
      reply: 'Use Cart to update quantities, remove items, or clear all items. After reviewing totals, click "Proceed to Checkout".',
      quickReplies: ['Open Cart', 'Checkout help', 'Delivery details needed']
    };
  }

  if (hasKeyword(walletKeywords)) {
    if (!context.isLoggedIn) {
      return {
        reply: 'Please log in first to use wallet features. After login, go to Checkout and use "Add Funds" before placing order.',
        quickReplies: ['Login help', 'Checkout help', 'Payment help']
      };
    }

    if (typeof context.walletBalance === 'number') {
      return {
        reply: `Your current wallet balance is Rs.${context.walletBalance.toFixed(2)}. You can add funds in Checkout before placing an order.`,
        quickReplies: ['How to add funds?', 'Place order', 'Order SMS info']
      };
    }

    return {
      reply: 'You can manage wallet in Checkout. Use "Add Funds", then place order with wallet payment.',
      quickReplies: ['Checkout help', 'Order SMS info', 'Cart help']
    };
  }

  if (hasKeyword(orderKeywords)) {
    return {
      reply: 'After placing an order, payment is deducted from wallet and your Twilio SMS includes order details, debited amount, and remaining balance.',
      quickReplies: ['What details are required?', 'Wallet help', 'Contact support']
    };
  }

  if (hasKeyword(contactKeywords)) {
    return {
      reply: 'Support contact: +91 1234 567890, info@spiceroute.com. You can also use the Contact page for assistance.',
      quickReplies: ['Open Contact', 'Order help', 'Menu help']
    };
  }

  if (hasKeyword(authKeywords)) {
    return {
      reply: 'Use Sign Up to create your account and Login to access cart, wallet, and checkout features.',
      quickReplies: ['Open Login', 'Open Sign Up', 'Wallet help']
    };
  }

  return {
    reply: 'I can help with menu browsing, cart updates, wallet usage, checkout, and order SMS updates. Please ask one of these.',
    quickReplies: ['Menu help', 'Cart help', 'Order help']
  };
};

module.exports = {
  buildChatbotReply
};
