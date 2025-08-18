// js/ai.js

let apiKey = null;
let chatHistory = [];

// Elements
const keyModal = document.getElementById("key-modal");
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const cancelKeyBtn = document.getElementById("cancel-key-btn");

const aiTutorFab = document.getElementById("ai-tutor-fab");
const chatOverlay = document.getElementById("chat-overlay");
const closeChatBtn = document.getElementById("close-chat-btn");
const changeKeyBtn = document.getElementById("change-key-btn");

// ✅ 1. Load saved key if exists
function loadApiKey() {
  apiKey = localStorage.getItem("gemini_api_key");
  return apiKey;
}

// ✅ 2. Show the modal
function showKeyModal() {
  keyModal.setAttribute("aria-hidden", "false");
  keyModal.style.display = "flex";
  apiKeyInput.value = apiKey || "";
  apiKeyInput.focus();
}

// ✅ 3. Hide the modal
function hideKeyModal() {
  keyModal.setAttribute("aria-hidden", "true");
  keyModal.style.display = "none";
}

// ✅ 4. Save key
saveKeyBtn.addEventListener("click", () => {
  const newKey = apiKeyInput.value.trim();
  if (!newKey.startsWith("AIza")) {
    alert("Please enter a valid Gemini API key (starts with AIza...)");
    return;
  }
  apiKey = newKey;
  localStorage.setItem("gemini_api_key", apiKey);
  hideKeyModal();
  alert("API Key saved successfully!");
});

// ✅ 5. Cancel key entry
cancelKeyBtn.addEventListener("click", () => {
  hideKeyModal();
});

// ✅ 6. Change Key button
changeKeyBtn.addEventListener("click", () => {
  showKeyModal();
});

// ✅ 7. Open Chat
function openChat() {
  if (!loadApiKey()) {
    showKeyModal();
    return;
  }
  chatOverlay.classList.add("visible");
  chatOverlay.setAttribute("aria-hidden", "false");
}

// ✅ 8. Close Chat
function closeChat() {
  chatOverlay.classList.remove("visible");
  chatOverlay.setAttribute("aria-hidden", "true");
}

// Event Listeners
aiTutorFab.addEventListener("click", openChat);
closeChatBtn.addEventListener("click", closeChat);
chatOverlay.addEventListener("click", (e) => {
  if (e.target === chatOverlay) closeChat();
});

// --- Chat Elements ---
const chatMessages = document.getElementById("chat-messages");
const chatInputForm = document.getElementById("chat-input-form");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("chat-send-btn");
const quickPrompts = document.getElementById("quick-prompts");

let isChatLoading = false;

// --- Helper to add messages to chat ---
function addMessage(role, text) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("chat-message", role);
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Loading indicator ---
function showLoading() {
  isChatLoading = true;
  const loader = document.createElement("div");
  loader.id = "loading-indicator";
  loader.classList.add("chat-message", "assistant");
  loader.innerHTML = `<em>AI is typing...</em>`;
  chatMessages.appendChild(loader);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideLoading() {
  isChatLoading = false;
  const loader = document.getElementById("loading-indicator");
  if (loader) loader.remove();
}

// --- Call Gemini API ---
async function callGeminiAPI(prompt) {
  if (!apiKey) {
    showKeyModal();
    throw new Error("No API key set");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "⚠️ No response from Gemini.";
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    return "❌ Error contacting Gemini API.";
  }
}

// --- Handle sending user message ---
async function handleSendMessage(userText) {
  if (!userText || isChatLoading) return;

  addMessage("user", userText);
  chatHistory.push({ role: "user", text: userText });
  chatInput.value = "";

  showLoading();
  const aiResponse = await callGeminiAPI(userText);
  hideLoading();

  addMessage("assistant", aiResponse);
  chatHistory.push({ role: "assistant", text: aiResponse });
}

// --- Event: Send form ---
chatInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSendMessage(chatInput.value.trim());
});

// --- Event: Quick Prompts ---
quickPrompts.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const prompt = e.target.getAttribute("data-prompt");
    handleSendMessage(prompt);
  }
});

// --- Export Chat History ---
const exportChatBtn = document.getElementById("export-chat-btn");

function exportChat() {
  if (chatHistory.length === 0) {
    alert("No chat history to export!");
    return;
  }

  let exportText = "=== AI Medical Tutor Chat Export ===\n\n";
  chatHistory.forEach((msg) => {
    exportText += `${msg.role.toUpperCase()}: ${msg.text}\n\n`;
  });

  const blob = new Blob([exportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ai_tutor_chat.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

exportChatBtn.addEventListener("click", exportChat);

// --- Prevent double send ---
sendBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!isChatLoading) {
    handleSendMessage(chatInput.value.trim());
  }
});

// --- Load key on startup ---
document.addEventListener("DOMContentLoaded", () => {
  loadApiKey(); // يحاول يجيب المفتاح من التخزين المحلي
});
