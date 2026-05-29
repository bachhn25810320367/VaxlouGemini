// Vaxlou v2.0 — Background Service Worker
// Handles: API calls (Gemini/Groq), cross-tab messaging

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callGeminiAPI') {
    callGeminiAPI(request.apiKey, request.model, request.prompt)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (request.action === 'callGroqAPI') {
    callGroqAPI(request.apiKey, request.model, request.prompt)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'openNewChatWithPrompt') {
    openNewGeminiChat(request.prompt, sender.tab)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function callGeminiAPI(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.3 }
    })
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroqAPI(apiKey, model, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.3
    })
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function openNewGeminiChat(prompt, senderTab) {
  // Create new tab at gemini.google.com
  const newTab = await chrome.tabs.create({
    url: 'https://gemini.google.com/app',
    active: true
  });

  // Wait for tab to load then inject the prompt
  return new Promise((resolve) => {
    const listener = (tabId, changeInfo) => {
      if (tabId === newTab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        // Send prompt to the new tab's content script
        setTimeout(() => {
          chrome.tabs.sendMessage(newTab.id, {
            action: 'injectPrompt',
            prompt: prompt
          }).catch(() => {});
          resolve();
        }, 2000); // Give Gemini time to fully render
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
