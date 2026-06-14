const { success, error } = require('../utils/response');

const chatWithDeepSeek = async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return error(res, 'Messages array is required', 400);
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return error(res, 'DeepSeek API key is not configured', 500);
    }

    // Build payload for DeepSeek
    // Prepend system prompt if provided
    const payloadMessages = [];
    if (systemPrompt) {
      payloadMessages.push({ role: 'system', content: systemPrompt });
    }
    
    // Convert generic messages (assumed {role, content}) or push directly
    messages.forEach(msg => payloadMessages.push(msg));

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', errorText);
      return error(res, `DeepSeek API failed with status ${response.status}`, response.status);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return success(res, { reply }, 'Success');
  } catch (err) {
    console.error('AI Chat Error:', err);
    return error(res, 'Failed to process AI chat request');
  }
};

module.exports = {
  chatWithDeepSeek
};
