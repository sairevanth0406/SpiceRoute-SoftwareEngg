 const { calculatePricing } = require('../../server/utils/pricing');
 
 describe('calculatePricing', () => {
   test('calculates subtotal, tax, delivery and payable amount correctly', () => {
     const result = calculatePricing(100);
     expect(result.subtotal).toBe(100);
     expect(result.taxAmount).toBe(5);
     expect(result.deliveryFee).toBe(40);
     expect(result.payableAmount).toBe(145);
   });
 
   test('handles invalid/negative input safely', () => {
     expect(calculatePricing(-50).subtotal).toBe(0);
     expect(calculatePricing('abc').subtotal).toBe(0);
   });
 });