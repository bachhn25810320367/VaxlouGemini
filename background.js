chrome.runtime.onInstalled.addListener(() => {
  console.log('Vaxlou - All in one for Gemini installed successfully!');
});

// Listener to handle API calls and bypass CSP (Content Security Policy)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callGeminiAPI') {
    const { apiKey, model, prompt } = request;
    const targetModel = model || 'gemini-2.5-flash-lite';
    
    const isGroq = apiKey && apiKey.trim().startsWith('gsk_');
    
    if (isGroq) {
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.error?.message || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          sendResponse({ success: true, text: text });
        } else {
          sendResponse({ success: false, error: 'API Groq không trả về nội dung.' });
        }
      })
      .catch(err => {
        console.error('[Vaxlou Groq API Error]:', err);
        sendResponse({ success: false, error: err.message });
      });
    } else {
      // Map custom/rebranded Vaxlou model IDs to actual working Google AI Studio API model IDs (1.5 models have been shut down)
      let apiModel = 'gemini-3.1-flash-lite';
      if (targetModel) {
        const lower = targetModel.toLowerCase();
        if (lower.includes('3.1-flash-lite') || lower.includes('3.1-lite')) {
          apiModel = 'gemini-3.1-flash-lite';
        } else if (lower.includes('2.5-flash-lite') || lower.includes('2.5-lite')) {
          apiModel = 'gemini-2.5-flash-lite';
        } else if (lower.includes('pro')) {
          apiModel = 'gemini-2.5-pro';
        } else if (lower.includes('2.5-flash')) {
          apiModel = 'gemini-2.5-flash';
        } else if (lower.includes('3.5-flash')) {
          apiModel = 'gemini-2.5-flash'; // Fallback for 3.5-flash
        } else {
          apiModel = 'gemini-3.1-flash-lite';
        }
      }

      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.error?.message || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          sendResponse({ success: true, text: text });
        } else {
          sendResponse({ success: false, error: 'API không trả về nội dung.' });
        }
      })
      .catch(err => {
        console.error('[Vaxlou Background API Error]:', err);
        sendResponse({ success: false, error: err.message });
      });
    }

    return true; // Keep the message channel open for asynchronous sendResponse
  }
});
