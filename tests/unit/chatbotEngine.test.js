 const { buildChatbotReply } = require('../../server/utils/chatbotEngine');
 
 describe('buildChatbotReply', () => {
   test('returns menu help for menu query', () => {
     const res = buildChatbotReply('show menu');
     expect(res.reply.toLowerCase()).toContain('menu');
     expect(Array.isArray(res.quickReplies)).toBe(true);
   });
 
   test('returns wallet balance when logged in context has balance', () => {
     const res = buildChatbotReply('wallet balance', {
       isLoggedIn: true,
       walletBalance: 250
     });
     expect(res.reply).toContain('250.00');
   });
 
   test('asks to login for wallet query if not logged in', () => {
     const res = buildChatbotReply('wallet balance', { isLoggedIn: false });
     expect(res.reply.toLowerCase()).toContain('log in');
   });
 });