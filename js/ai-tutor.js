// =====================================================
// AI Medical Tutor (Gemini) — (FINAL CORRECTED VERSION)
// =====================================================

export function initAITutor({ getLessonContext } = {}) {
  // ---------- DOM refs ----------
  const aiTutorFab = document.getElementById("ai-tutor-fab");
  const chatOverlay = document.getElementById("chat-overlay");
  const closeChatBtn = document.getElementById("close-chat-btn");
  const changeKeyBtn = document.getElementById("change-key-btn");
  const exportChatBtn = document.getElementById("export-chat-btn");
  const chatMessages = document.getElementById("chat-messages");
  const chatInputForm = document.getElementById("chat-input-form");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send-btn");
  const quickPrompts = document.getElementById("quick-prompts");
  const contextSmall = document.getElementById("lesson-context-summary");
  const keyModal = document.getElementById("key-modal");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const cancelKeyBtn = document.getElementById("cancel-key-btn");

  // ---------- State ----------
  let apiKey = null;
  let isChatLoading = false;
  let sessionOpened = false;
  const chatHistory = [];

  // ---------- Helpers ----------
  const hideElement = (el) => { if (el) { el.style.display = "none"; el.setAttribute("aria-hidden", "true"); } };
  const showFlex = (el) => { if (el) { el.style.display = "flex"; el.setAttribute("aria-hidden", "false"); } };

  function loadApiKey() {
    apiKey = localStorage.getItem("gemini_api_key") || null;
    return apiKey;
  }

  function saveApiKey(newKey) {
    apiKey = newKey;
    localStorage.setItem("gemini_api_key", apiKey);
  }

  // ---------- API Key Modal ----------
  function showKeyModal() {
    if (!keyModal) return;
    apiKeyInput.value = apiKey || "";
    showFlex(keyModal);
    const modalText = keyModal.querySelector("p");
    if (modalText) modalText.textContent = "Paste your Gemini API key to enable the AI tutor";
    setTimeout(() => apiKeyInput?.focus(), 0);
  }

  function hideKeyModal() {
    if (keyModal) hideElement(keyModal);
  }

  // ---------- Chat Control ----------
  function openChat() {
    if (typeof getLessonContext === "function") {
      const ctx = getLessonContext() || {};
      const title = (ctx.title || "").trim();
      const slug = (ctx.slug || "").trim();
      if (contextSmall) {
        contextSmall.textContent = title ? `Topic: ${title}` : (slug || "");
      }
    }
    if (!loadApiKey()) {
      showKeyModal();
      addMessage("assistant", "⚠️ Please enter your Gemini API key to start chatting.");
      return;
    }
    if (chatOverlay) {
      chatOverlay.classList.add("visible");
      showFlex(chatOverlay);
    }
    if (!sessionOpened) {
      addMessage("assistant", "👋 Welcome! I’m your AI Medical Tutor. Ask anything about this lesson.");
      sessionOpened = true;
    }
    chatInput?.focus();
  }

  function closeChat() {
    if (chatOverlay) {
      chatOverlay.classList.remove("visible");
      hideElement(chatOverlay);
    }
  }

  // ---------- Message Formatting ----------
  function addMessage(role, text) {
    if (!chatMessages) return;
    const el = document.createElement("div");
    el.classList.add("chat-message", role === "user" ? "user" : "tutor");
    const paragraphs = text.split(/\n+/).map(line => `<p>${line}</p>`).join('');
    el.innerHTML = paragraphs;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showLoading() {
    if (!chatMessages) return;
    isChatLoading = true;
    const el = document.createElement("div");
    el.id = "loading-indicator";
    el.classList.add("chat-message", "tutor");
    el.innerHTML = "<em>AI is typing…</em>";
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if(sendBtn) sendBtn.disabled = true;
    if(chatInput) chatInput.disabled = true;
  }

  function hideLoading() {
    isChatLoading = false;
    const loader = document.getElementById("loading-indicator");
    if (loader) loader.remove();
    if(sendBtn) sendBtn.disabled = false;
    if(chatInput) chatInput.disabled = false;
    chatInput?.focus();
  }

  // ---------- Gemini API ----------
  function buildSystemInstruction() {
    const ctx = (typeof getLessonContext === "function") ? (getLessonContext() || {}) : {};
    const title = ctx.title ? `Title: ${ctx.title}\n` : "";
    const content = ctx.content ? `\nLesson Content:\n---\n${ctx.content.substring(0, 3000)}...\n---\n` : '';
    const quiz = (ctx.quiz && ctx.quiz.length > 0) ? `\nLesson Quiz Questions:\n---\n${JSON.stringify(ctx.quiz, null, 2)}\n---\n` : '';

    return {
      role: "user",
      parts: [{
        text: `You are an expert medical tutor for a clinical-stage medical student in Egypt. Respond professionally and clearly. If user writes in Arabic, reply in Arabic. Do not translate or explain scientific/medical terms. Keep explanations concise and well-formatted. You have the full context of the lesson and its quiz. Use it to provide accurate answers.

Lesson Context:
${title}${content}${quiz}`
      }]
    };
  }

  function toGeminiHistory() {
    return chatHistory.slice(-12).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));
  }

  async function callGeminiAPI(userText) {
    if (!apiKey) {
      showKeyModal();
      throw new Error("Missing API key");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [...toGeminiHistory(), { role: "user", parts: [{ text: userText }] }],
      systemInstruction: buildSystemInstruction(),
      generationConfig: { temperature: 0.6, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
    };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from Gemini.";
  }

  // ---------- Event Handlers ----------
  async function handleSendMessage(userText) {
    const clean = (userText || "").trim();
    if (!clean || isChatLoading) return;
    if(chatInput) chatInput.value = '';

    addMessage("user", clean);
    chatHistory.push({ role: "user", text: clean });
    showLoading();
    try {
      const aiResponse = await callGeminiAPI(clean);
      addMessage("assistant", aiResponse);
      chatHistory.push({ role: "assistant", text: aiResponse });
    } catch (err) {
      const msg = `❌ Error: ${err.message || "An unknown error occurred."}`;
      addMessage("assistant", msg);
      if ((err.message || "").toLowerCase().includes("api key")) showKeyModal();
    } finally {
      hideLoading();
    }
  }

  function exportChat() {
    if (!chatHistory.length) return alert("No chat history to export!");
    let text = "=== AI Medical Tutor Chat Export ===\n\n";
    chatHistory.forEach(m => { text += `${m.role.toUpperCase()}: ${m.text}\n\n`; });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai_tutor_chat.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Event Listeners ----------
  aiTutorFab?.addEventListener("click", openChat);
  closeChatBtn?.addEventListener("click", closeChat);
  chatOverlay?.addEventListener("click", (e) => { if (e.target === chatOverlay) closeChat(); });
  quickPrompts?.addEventListener("click", (e) => {
    const prompt = e.target.closest("button")?.dataset.prompt;
    if (prompt) handleSendMessage(prompt);
  });
  chatInputForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSendMessage(chatInput?.value);
  });
  changeKeyBtn?.addEventListener("click", showKeyModal);
  exportChatBtn?.addEventListener("click", exportChat);
  saveKeyBtn?.addEventListener("click", () => {
    const k = (apiKeyInput?.value || "").trim();
    if (k) {
      saveApiKey(k);
      hideKeyModal();
      addMessage("assistant", "✅ API key saved. You can continue.");
    } else {
      alert("Please enter a valid API key.");
    }
  });
  cancelKeyBtn?.addEventListener("click", () => {
    hideKeyModal();
    if (!apiKey) closeChat();
  });
  
  // ---------- Startup ----------
  loadApiKey();
}

/**
 * Allows other scripts (like quiz.js) to send a prompt to the AI.
 * This is the SINGLE, CORRECT definition of this function.
 * @param {string} promptText - The question to ask the AI.
 */
export async function askAI(promptText) {
    const chatOverlay = document.getElementById("chat-overlay");
    const aiTutorFab = document.getElementById("ai-tutor-fab");

    // Open the chat window if it's currently closed
    if (chatOverlay && aiTutorFab && window.getComputedStyle(chatOverlay).display === 'none') {
        aiTutorFab.click();
        // Wait for the opening animation to complete
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    const chatInput = document.getElementById("chat-input");
    const chatForm = document.getElementById("chat-input-form");

    if (chatInput && chatForm) {
        chatInput.value = promptText;
        // Submitting the form is more reliable than clicking the button
        chatForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
}
