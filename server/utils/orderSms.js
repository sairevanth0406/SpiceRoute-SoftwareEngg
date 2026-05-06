 const twilio = require('twilio');
 
 const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));
 const formatCurrency = (value) => `Rs.${roundCurrency(value).toFixed(2)}`;
 
 const toE164 = (phone) => {
   const raw = String(phone || '').trim();
   if (!raw) return null;
 
   if (raw.startsWith('+')) {
     return raw.replace(/[^\d+]/g, '');
   }
 
   const digits = raw.replace(/\D/g, '');
   if (!digits) return null;
 
   if (digits.length === 10) {
     const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE || '91';
     return `+${defaultCountryCode}${digits}`;
   }
 
   return `+${digits}`;
 };
 
 const buildItemsText = (items) => (items || [])
   .map((item) => `${item.name} x${item.quantity}`)
   .join(', ');
 
 const sendOrderPlacedMessage = async ({
   to,
   orderNumber,
   items,
   debitedAmount,
   walletBalance
 }) => {
   const accountSid = process.env.TWILIO_ACCOUNT_SID;
   const authToken = process.env.TWILIO_AUTH_TOKEN;
   const from = process.env.TWILIO_PHONE_NUMBER;
   const destination = toE164(to);
 
   if (!accountSid || !authToken || !from) {
     return { sent: false, reason: 'Twilio is not configured' };
   }
 
   if (!destination) {
     return { sent: false, reason: 'Invalid destination phone number' };
   }
 
   const itemSummary = buildItemsText(items);
   const body = [
     'Spice Route Order Confirmed!',
     `Order #${orderNumber}`,
     `Items: ${itemSummary}`,
     `Amount Debited: ${formatCurrency(debitedAmount)}`,
     `Wallet Balance Left: ${formatCurrency(walletBalance)}`
   ].join('\n');
 
   try {
     const client = twilio(accountSid, authToken);
     const response = await client.messages.create({
       from,
       to: destination,
       body
     });
 
     return {
       sent: true,
       sid: response.sid
     };
   } catch (error) {
     console.error('Twilio SMS send failed:', error.message);
     return {
       sent: false,
       reason: error.message
     };
   }
 };
 
 module.exports = { sendOrderPlacedMessage };