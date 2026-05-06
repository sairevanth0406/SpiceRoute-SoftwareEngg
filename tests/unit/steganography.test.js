const {
  createStegoReceiptForOrder,
  extractStegoMessageFromReceipt
} = require('../../server/utils/steganography');

describe('steganography utils', () => {
  test('embeds and extracts hidden payload correctly', async () => {
    const payload = JSON.stringify({ orderNumber: 123, amount: 456 });
    const created = await createStegoReceiptForOrder({
      orderNumber: 123,
      hiddenText: payload
    });

    expect(Buffer.isBuffer(created.imageBuffer)).toBe(true);
    expect(created.imageBuffer.length).toBeGreaterThan(0);
    expect(created.digest).toBeTruthy();

    const extracted = await extractStegoMessageFromReceipt(created.imageBuffer);
    expect(extracted.hiddenMessage).toBe(payload);
    expect(extracted.digest).toBe(created.digest);
  });
});
