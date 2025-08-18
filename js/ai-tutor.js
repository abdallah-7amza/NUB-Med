// js/ai-tutor.js
// =====================================================
// AI Medical Tutor (Gemini) — drop-in for lesson.html
// Works with: #ai-tutor-fab, #chat-overlay, #key-modal
// =====================================================

export function initAITutor({ getLessonContext } = {}) {
  // ---------- DOM refs ----------
  const aiTutorFab = document.getElementById("ai-tutor-fab");
  const chatOverlay = document.getElementById("chat-overlay");
  const chatWindow = document.getElementById("chat-window");
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
  let sessionOpened = false; // to drop one welcome message per open
  const chatHistory = []; // {role: 'user'|'assistant', text: string}

  // ---------- Helpers ----------
  const hideElement = (el) => { if (!el) return; el.style.display = "none"; el.setAttribute("aria-hidden", "true"); };
  const showFlex = (el) => { if (!el) return; el.style.display = "flex"; el.setAttribute("aria-hidden", "false"); };
  const showBlock = (el) => { if (!el) return; el.style.display = "block"; el.setAttribute("aria-hidden", "false"); };

  // Ensure the key modal is hidden on startup even if CSS missing (fixes text showing on page).
  if (keyModal) hideElement(keyModal);

  function loadApiKey() {
    apiKey = localStorage.getItem("gemini_api_key") || null;
    return apiKey;
  }

  function saveApiKey(newKey) {
    apiKey = newKey;
    localStorage.setItem("gemini_api_key", apiKey);
  }

  function showKeyModal() {
    if (!keyModal) return;
    apiKeyInput.value = apiKey || "";
    showFlex(keyModal);
    setTimeout(() => apiKeyInput?.focus(), 0);
  }

  function hideKeyModal() {
    if (!keyModal) return;
    hideElement(keyModal);
  }

  function openChat() {
    // Update lesson context line (small text under title)
    if (typeof getLessonContext === "function") {
      const ctx = getLessonContext() || {};
      const title = (ctx.title || "").trim();
      const slug = (ctx.slug || "").trim();
      let summary = (ctx.summary || "").trim();
      if (summary.length > 220) summary = summary.slice(0, 220) + "…";
      if (contextSmall) {
        contextSmall.textContent = title ? `Topic: ${title}${slug ? `  •  (${slug})` : ""}` : (slug || "");
        if (summary) contextSmall.textContent += ` — ${summary}`;
      }
    }

    if (!loadApiKey()) {
      showKeyModal();
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

  function addMessage(role, text) {
    if (!chatMessages) return;
    const el = document.createElement("div");
    // add both classes to be compatible with either CSS (.assistant or .tutor)
    const roleClass = role === "user" ? "user" : "assistant";
    el.classList.add("chat-message", roleClass, "tutor");
    el.textContent = text;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showLoading() {
    if (!chatMessages) return;
    isChatLoading = true;
    const el = document.createElement("div");
    el.id = "loading-indicator";
    el.classList.add("chat-message", "assistant", "tutor");
    el.innerHTML = "<em>AI is typing…</em>";
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    sendBtn && (sendBtn.disabled = true);
    chatInput && (chatInput.disabled = true);
  }

  function hideLoading() {
    isChatLoading = false;
    const loader = document.getElementById("loading-indicator");
    if (loader) loader.remove();
    sendBtn && (sendBtn.disabled = false);
    chatInput && (chatInput.disabled = false);
    chatInput?.focus();
  }

  // ---------- Gemini API ----------
  function buildSystemInstruction() {
    // Clear, exam-oriented, bilingual micro-clarifications for medical terms.
    const ctx = (typeof getLessonContext === "function") ? (getLessonContext() || {}) : {};
    const title = ctx.title ? `Title: ${ctx.title}\n` : "";
    const slug = ctx.slug ? `Slug: ${ctx.slug}\n` : "";
    const summary = ctx.summary ? `Summary:\n${ctx.summary}\n` : "";
    return {
      role: "user", // Google API expects content objects; systemInstruction is a Content-like object
      parts: [{
        text:
`You are an expert medical tutor for a clinical-stage medical student in Egypt.
Write your main explanation in English, but after difficult medical terms add a brief Arabic clarification in parentheses. (مثال: edema (يعني تورم))
Be concise, clinically reasoned, exam-focused. Use bullets when helpful.

Context:
${title}${slug}${summary}`
      }]
    };
  }

  function toGeminiHistory() {
    // Map our chatHistory to Google "contents" (user/model)
    // We keep history short to stay within token limits.
    const last = chatHistory.slice(-12).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));
    return last;
  }

  async function callGeminiAPI(userText) {
    if (!apiKey) {
      showKeyModal();
      throw new Error("Missing API key");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Compose contents: prior history + latest user turn
    const contents = [...toGeminiHistory(), { role: "user", parts: [{ text: userText }] }];

    const payload = {
      contents,
      systemInstruction: buildSystemInstruction(),
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 768
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // If key invalid or quota exceeded, tell user clearly.
      let msg = `HTTP ${res.status}`;
      try {
        const errData = await res.json();
        if (errData?.error?.message) msg += ` — ${errData.error.message}`;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "⚠️ No response from Gemini.";
  }

  // ---------- Send / Quick Prompts / Export ----------
  async function handleSendMessage(userText) {
    const clean = (userText || "").trim();
    if (!clean || isChatLoading) return;

    addMessage("user", clean);
    chatHistory.push({ role: "user", text: clean });

    showLoading();
    try {
      const ai = await callGeminiAPI(clean);
      hideLoading();
      addMessage("assistant", ai);
      chatHistory.push({ role: "assistant", text: ai });
    } catch (err) {
      hideLoading();
      const msg = `❌ Error: ${err.message || err}`;
      addMessage("assistant", msg);
      chatHistory.push({ role: "assistant", text: msg });
      // If error due to missing/invalid key, reopen modal
      if ((msg + "").toLowerCase().includes("api key")) showKeyModal();
    }
  }

  function exportChat() {
    if (!chatHistory.length) {
      alert("No chat history to export!");
      return;
    }
    let text = "=== AI Medical Tutor Chat Export ===\n\n";
    chatHistory.forEach(m => {
      text += `${m.role.toUpperCase()}: ${m.text}\n\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai_tutor_chat.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- Events ----------
  aiTutorFab?.addEventListener("click", openChat);

  closeChatBtn?.addEventListener("click", closeChat);

  // click outside window closes chat
  chatOverlay?.addEventListener("click", (e) => {
    if (e.target === chatOverlay) closeChat();
  });

  // quick prompts (event delegation)
  quickPrompts?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const prompt = btn.getAttribute("data-prompt");
    if (prompt) handleSendMessage(prompt);
  });

  // send via form
  chatInputForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isChatLoading) handleSendMessage(chatInput?.value);
  });

  // extra safety: send button click
  sendBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isChatLoading) handleSendMessage(chatInput?.value);
  });

  // change key
  changeKeyBtn?.addEventListener("click", () => {
    apiKeyInput.value = apiKey || "";
    showKeyModal();
  });

  // save key
  saveKeyBtn?.addEventListener("click", () => {
    const k = (apiKeyInput?.value || "").trim();
    if (!/^AIza[0-9A-Za-z_\-]{20,}$/.test(k)) {
      alert("Please paste a valid Gemini API key (starts with AIza…).");
      return;
    }
    saveApiKey(k);
    hideKeyModal();
    // gentle note inside chat if open
    if (chatOverlay?.classList.contains("visible")) {
      addMessage("assistant", "✅ API key saved. You can continue.");
    }
  });

  // cancel key
  cancelKeyBtn?.addEventListener("click", () => {
    hideKeyModal();
    // If we opened chat but there is still no key, close the chat to avoid a dead UI
    if (!loadApiKey()) closeChat();
  });

  // ---------- Startup ----------
  // Try load key on start (does NOT show modal). Also ensure modal hidden (if HTML/CSS missing default hide).
  loadApiKey();
  if (keyModal) hideElement(keyModal);
}
