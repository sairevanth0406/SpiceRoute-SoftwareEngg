const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculatePricing = (subtotal) => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const taxAmount = roundToTwo(safeSubtotal * TAX_RATE);
  const payableAmount = roundToTwo(safeSubtotal + DELIVERY_FEE + taxAmount);

  return {
    subtotal: roundToTwo(safeSubtotal),
    deliveryFee: DELIVERY_FEE,
    taxRate: TAX_RATE,
    taxAmount,
    payableAmount
  };
};

module.exports = {
  DELIVERY_FEE,
  TAX_RATE,
  calculatePricing
};
