const crypto = require('crypto');
const { PNG } = require('pngjs');

const RECEIPT_WIDTH = 900;
const RECEIPT_HEIGHT = 520;
const LINE_MAX_CHARS = 65;
 
 const GLYPHS = {
   A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
   B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
   C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
   D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
   E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
   F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
   G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
   H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
   I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
   J: ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
   K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
   L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
   M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
   N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
   O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
   P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
   Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
   R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
   S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
   T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
   U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
   V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
   W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
   X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
   Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
   Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
   0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
   1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
   2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
   3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
   4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
   5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
   6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
   7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
   8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
   9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
   ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
   '.': ['00000', '00000', '00000', '00000', '00000', '00100', '00100'],
   '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
   '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
   ',': ['00000', '00000', '00000', '00000', '00110', '00100', '01000'],
   '#': ['01010', '11111', '01010', '01010', '11111', '01010', '01010'],
   '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
   ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
   ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
 };
 
const textToPayloadBuffer = (text) => {
  const messageBuffer = Buffer.from(String(text), 'utf8');
  const lengthBuffer = Buffer.allocUnsafe(4);
   lengthBuffer.writeUInt32BE(messageBuffer.length, 0);
   return Buffer.concat([lengthBuffer, messageBuffer]);
 };
 
 const payloadBufferToText = (buffer) => buffer.toString('utf8');
 
 const writeBit = (byte, bit) => (byte & 0xfe) | (bit & 1);
 const readBit = (byte) => byte & 1;
 
 const setPixel = (png, x, y, color) => {
   if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
     return;
   }
   const idx = (png.width * y + x) << 2;
   png.data[idx] = color[0];
   png.data[idx + 1] = color[1];
   png.data[idx + 2] = color[2];
   png.data[idx + 3] = 255;
 };
 
 const drawRect = (png, x, y, width, height, color) => {
   for (let py = y; py < y + height; py += 1) {
     for (let px = x; px < x + width; px += 1) {
       setPixel(png, px, py, color);
     }
   }
 };
 
 const sanitizeReceiptLine = (line) => (
   String(line || '')
     .replace(/[^\x20-\x7E]/g, ' ')
     .slice(0, LINE_MAX_CHARS)
 );
 
 const drawText = (png, text, startX, startY, options = {}) => {
   const scale = options.scale || 2;
   const color = options.color || [20, 26, 35];
   let cursorX = startX;
   const value = String(text || '').toUpperCase();
 
   for (let i = 0; i < value.length; i += 1) {
     const ch = value[i];
     const glyph = GLYPHS[ch] || GLYPHS[' '];
     for (let row = 0; row < glyph.length; row += 1) {
       const rowBits = glyph[row];
       for (let col = 0; col < rowBits.length; col += 1) {
         if (rowBits[col] === '1') {
           for (let sy = 0; sy < scale; sy += 1) {
             for (let sx = 0; sx < scale; sx += 1) {
               setPixel(png, cursorX + col * scale + sx, startY + row * scale + sy, color);
             }
           }
         }
       }
     }
     cursorX += (5 * scale) + scale;
   }
 };
 
 const renderVisibleReceipt = (png, orderNumber, visibleLines) => {
   const safeLines = Array.isArray(visibleLines) && visibleLines.length > 0
     ? visibleLines
     : [
       `Order No: ${orderNumber}`,
       `Generated: ${new Date().toISOString()}`,
       'Secure receipt generated successfully.'
     ];
 
   drawRect(png, 0, 0, png.width, png.height, [248, 244, 237]);
   drawRect(png, 24, 24, png.width - 48, png.height - 48, [255, 255, 255]);
   drawRect(png, 24, 24, png.width - 48, 48, [42, 57, 84]);
   drawText(png, 'SPICE ROUTE - SECURE RECEIPT', 44, 39, { scale: 2, color: [255, 255, 255] });
 
   let y = 98;
   for (let i = 0; i < safeLines.length; i += 1) {
     drawText(png, sanitizeReceiptLine(safeLines[i]), 48, y, { scale: 2, color: [20, 26, 35] });
     y += 24;
     if (y > png.height - 40) {
       break;
     }
   }
 };
 
 const embedPayloadInPng = (payload, options = {}) => {
   const png = new PNG({ width: RECEIPT_WIDTH, height: RECEIPT_HEIGHT });
   renderVisibleReceipt(png, options.orderNumber, options.visibleLines);
 
   const capacityBits = png.width * png.height * 3;
   const payloadBits = payload.length * 8;
   if (payloadBits > capacityBits) {
     throw new Error('Hidden message exceeds steganography capacity');
   }
 
   let bitIndex = 0;
   const totalBits = payloadBits;
 
   for (let i = 0; i < png.data.length && bitIndex < totalBits; i += 4) {
     for (let channelOffset = 0; channelOffset < 3 && bitIndex < totalBits; channelOffset += 1) {
       const sourceByteIndex = Math.floor(bitIndex / 8);
       const sourceBitOffset = 7 - (bitIndex % 8);
       const bit = (payload[sourceByteIndex] >> sourceBitOffset) & 1;
       png.data[i + channelOffset] = writeBit(png.data[i + channelOffset], bit);
       bitIndex += 1;
     }
   }
 
   return PNG.sync.write(png);
 };
 
 const extractPayloadFromPngBuffer = (pngBuffer) => {
   const png = PNG.sync.read(pngBuffer);
   const bits = [];
 
   for (let i = 0; i < png.data.length; i += 4) {
     bits.push(readBit(png.data[i]));
     bits.push(readBit(png.data[i + 1]));
     bits.push(readBit(png.data[i + 2]));
   }
 
   const toByte = (startBitIndex) => {
     let value = 0;
     for (let i = 0; i < 8; i += 1) {
       value = (value << 1) | bits[startBitIndex + i];
     }
     return value;
   };
 
   if (bits.length < 32) {
     throw new Error('Stego image does not contain a valid payload header');
   }
 
   const lengthBytes = Buffer.allocUnsafe(4);
   for (let i = 0; i < 4; i += 1) {
     lengthBytes[i] = toByte(i * 8);
   }
   const payloadLength = lengthBytes.readUInt32BE(0);
 
   if (!Number.isInteger(payloadLength) || payloadLength <= 0) {
     throw new Error('Stego payload length is invalid');
   }
 
   const requiredBits = 32 + payloadLength * 8;
   if (requiredBits > bits.length) {
     throw new Error('Stego image payload is incomplete');
   }
 
   const payload = Buffer.allocUnsafe(payloadLength);
   for (let i = 0; i < payloadLength; i += 1) {
     payload[i] = toByte(32 + i * 8);
   }
 
   return payload;
 };
 
const digestText = (text) => crypto.createHash('sha256').update(String(text)).digest('hex');

const createStegoReceiptForOrder = async ({ orderNumber, hiddenText, visibleLines = [] }) => {
  const payload = textToPayloadBuffer(hiddenText);
  const stegoPng = embedPayloadInPng(payload, { orderNumber, visibleLines });

  return {
    imageBuffer: stegoPng,
    digest: digestText(hiddenText)
  };
};

const extractStegoMessageFromReceipt = async (imageBuffer) => {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error('Invalid stego receipt buffer');
  }

  const payload = extractPayloadFromPngBuffer(imageBuffer);
  const hiddenMessage = payloadBufferToText(payload);

  return {
     hiddenMessage,
     digest: digestText(hiddenMessage)
   };
 };
 
 module.exports = {
   createStegoReceiptForOrder,
   extractStegoMessageFromReceipt
 };
