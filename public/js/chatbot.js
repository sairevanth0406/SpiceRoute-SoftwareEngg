document.addEventListener('DOMContentLoaded', () => {
  const launcher = document.getElementById('chatbotLauncher');
  const panel = document.getElementById('chatbotPanel');
  const closeBtn = document.getElementById('chatbotClose');
  const messages = document.getElementById('chatbotMessages');
  const form = document.getElementById('chatbotForm');
  const input = document.getElementById('chatbotInput');
  const quickReplies = document.getElementById('chatbotQuickReplies');

  if (!launcher || !panel || !messages || !form || !input || !quickReplies) {
    return;
  }

  const addMessage = (text, sender) => {
    const bubble = document.createElement('div');
    bubble.className = `chatbot-message ${sender === 'bot' ? 'chatbot-bot' : 'chatbot-user'}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const setQuickReplies = (items) => {
    quickReplies.innerHTML = '';
    (items || []).slice(0, 3).forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chatbot-quick-reply';
      button.textContent = item;
      button.addEventListener('click', () => {
        input.value = item;
        form.requestSubmit();
      });
      quickReplies.appendChild(button);
    });
  };

  const sendMessage = async (text) => {
    addMessage(text, 'user');

    try {
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not get chatbot response');
      }

      addMessage(data.reply, 'bot');
      setQuickReplies(data.quickReplies);
    } catch (error) {
      addMessage(error.message || 'Something went wrong. Please try again.', 'bot');
    }
  };

  launcher.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && messages.children.length === 0) {
      addMessage('Hi! I am your Spice Route assistant. Ask me about menu, wallet, cart, and orders.', 'bot');
      setQuickReplies(['Menu help', 'Wallet help', 'Order help']);
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      return;
    }
    input.value = '';
    await sendMessage(text);
  });
});
