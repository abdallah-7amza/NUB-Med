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
  let sessionOpened = false;
  const chatHistory = [];

  // ---------- Helpers ----------
  const hideElement = (el) => { if (!el) return; el.style.display = "none"; el.setAttribute("aria-hidden", "true"); };
  const showFlex = (el) => { if (!el) return; el.style.display = "flex"; el.setAttribute("aria-hidden", "false"); };
  const showBlock = (el) => { if (!el) return; el.style.display = "block"; el.setAttribute("aria-hidden", "false"); };

  if (keyModal) hideElement(keyModal);

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

    // **التعديل الأساسي:** نص النافذة يكون حسب طلبك
    const modalText = keyModal.querySelector(".modal-text");
    if(modalText) modalText.textContent = "Paste your Gemini API key to enable the AI tutor";

    setTimeout(() => apiKeyInput?.focus(), 0);
  }

  function hideKeyModal() {
    if (!keyModal) return;
    hideElement(keyModal);
  }

  // ---------- Chat Control ----------
  function openChat() {
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
    const roleClass = role === "user" ? "user" : "assistant";
    el.classList.add("chat-message", roleClass, "tutor");

    // **التعديل الأساسي:** الرد رسمي ومنسق بدون نجوم، تقسيم النص لفقرة <p>
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
    const ctx = (typeof getLessonContext === "function") ? (getLessonContext() || {}) : {};
    const title = ctx.title ? `Title: ${ctx.title}\n` : "";
    const slug = ctx.slug ? `Slug: ${ctx.slug}\n` : "";
    const summary = ctx.summary ? `Summary:\n${ctx.summary}\n` : "";

    // **التعديل الأساسي:** تعليمات رسمية، عربي أو إنجليزي حسب المستخدم، المصطلحات العلمية تبقى كما هي
    return {
      role: "user",
      parts: [{
        text:
`You are an expert medical tutor for a clinical-stage medical student in Egypt.
Respond professionally and clearly.
If user writes in Arabic, reply in Arabic. 
Do not translate or explain scientific/medical terms.
Keep explanations concise, structured, and well-formatted using paragraphs.

Context:
${title}${slug}${summary}`
      }]
    };
  }

  function toGeminiHistory() {
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
      let msg = `HTTP ${res.status}`;
      try {
        const errData = await res.json();
        if (errData?.error?.message) msg += ` — ${errData.error.message}`;
      } catch {}
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
  chatOverlay?.addEventListener("click", (e) => {
    if (e.target === chatOverlay) closeChat();
  });

  quickPrompts?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const prompt = btn.getAttribute("data-prompt");
    if (prompt) handleSendMessage(prompt);
  });

  chatInputForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isChatLoading) handleSendMessage(chatInput?.value);
  });

  sendBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isChatLoading) handleSendMessage(chatInput?.value);
  });

  changeKeyBtn?.addEventListener("click", () => {
    apiKeyInput.value = apiKey || "";
    showKeyModal();
  });

  saveKeyBtn?.addEventListener("click", () => {
    const k = (apiKeyInput?.value || "").trim();
    if (!/^AIza[0-9A-Za-z_\-]{20,}$/.test(k)) {
      alert("Please paste a valid Gemini API key (starts with AIza…).");
      return;
    }
    saveApiKey(k);
    hideKeyModal();
    if (chatOverlay?.classList.contains("visible")) {
      addMessage("assistant", "✅ API key saved. You can continue.");
    }
  });

  cancelKeyBtn?.addEventListener("click", () => {
    hideKeyModal();
    if (!loadApiKey()) closeChat();
  });

  // ---------- Startup ----------
  loadApiKey();
  if (keyModal) hideElement(keyModal);
}
