/* =====================================================
   MED Portal NUB - App Logic (Restored + AI Tutor Fixed)
   ===================================================== */

const app = {
  // State
  currentYear: null,
  currentSpecialty: null,
  currentLesson: null,
  currentQuestionIndex: 0,

  // DOM Elements
  views: document.querySelectorAll('.view'),
  aiTutorFab: document.getElementById('ai-tutor-fab'),
  chatOverlay: document.getElementById('chat-overlay'),
  chatMessagesContainer: document.getElementById('chat-messages'),
  chatInputForm: document.getElementById('chat-input-form'),
  chatInput: document.getElementById('chat-input'),
  closeChatBtn: document.getElementById('close-chat-btn'),
  chatSendBtn: document.getElementById('chat-send-btn'),

  // AI Tutor State
  chatHistory: [],
  isChatLoading: false,
  apiKey: localStorage.getItem("gemini_api_key") || null,

  /* ---------------------------
     Initialization
  ---------------------------- */
  init() {
    // Add listeners
    if (this.aiTutorFab) {
      this.aiTutorFab.addEventListener('click', () => this.openChat());
    }
    if (this.closeChatBtn) {
      this.closeChatBtn.addEventListener('click', () => this.closeChat());
    }
    if (this.chatOverlay) {
      this.chatOverlay.addEventListener('click', (e) => {
        if (e.target === this.chatOverlay) this.closeChat();
      });
    }
    if (this.chatInputForm) {
      this.chatInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSendMessage();
      });
    }
    if (this.chatSendBtn) {
      this.chatSendBtn.addEventListener('click', () => this.handleSendMessage());
    }
  },

  /* ---------------------------
     AI Tutor
  ---------------------------- */
  openChat() {
    this.chatHistory = [];
    this.addMessageToChat("tutor", "👋 Welcome! I’m your AI Tutor. How can I help you today?");
    this.chatOverlay.classList.add("visible");
    this.chatInput.focus();

    // Check API Key
    if (!this.apiKey) {
      this.askForApiKey();
    }
  },

  closeChat() {
    this.chatOverlay.classList.remove("visible");
  },

  askForApiKey() {
    const key = prompt("Enter your Gemini API Key:");
    if (key && key.trim() !== "") {
      this.apiKey = key.trim();
      localStorage.setItem("gemini_api_key", this.apiKey);
      this.addMessageToChat("tutor", "✅ API Key saved successfully. You can now chat.");
    } else {
      this.addMessageToChat("tutor", "⚠️ No API key provided. Please enter it to continue.");
    }
  },

  addMessageToChat(role, text) {
    const msg = document.createElement("div");
    msg.classList.add("chat-message", role);
    msg.textContent = text;
    this.chatMessagesContainer.appendChild(msg);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  },

  async handleSendMessage() {
    const userInput = this.chatInput.value.trim();
    if (!userInput || this.isChatLoading) return;

    // Add user message
    this.addMessageToChat("user", userInput);
    this.chatHistory.push({ role: "user", parts: [{ text: userInput }] });
    this.chatInput.value = "";

    // Show loading
    this.showLoadingIndicator();

    try {
      const response = await this.callGeminiAPI(this.chatHistory);
      this.hideLoadingIndicator();
      this.addMessageToChat("tutor", response);
      this.chatHistory.push({ role: "model", parts: [{ text: response }] });
    } catch (err) {
      this.hideLoadingIndicator();
      this.addMessageToChat("tutor", "❌ Error: " + err.message);
      console.error(err);
    }
  },

  showLoadingIndicator() {
    this.isChatLoading = true;
    const indicator = document.createElement("div");
    indicator.classList.add("chat-message", "tutor");
    indicator.id = "loading-indicator";
    indicator.textContent = "Typing...";
    this.chatMessagesContainer.appendChild(indicator);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  },

  hideLoadingIndicator() {
    this.isChatLoading = false;
    const indicator = document.getElementById("loading-indicator");
    if (indicator) indicator.remove();
  },

  /* ---------------------------
     API Call
  ---------------------------- */
  async callGeminiAPI(history) {
    if (!this.apiKey) {
      this.askForApiKey();
      throw new Error("Missing API Key");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: history,
      generationConfig: {
        temperature: 0.7,
        topP: 1,
        topK: 1,
        maxOutputTokens: 512,
      },
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "🤔 I couldn’t generate an answer. Try rephrasing.";
    }
  }
};

/* ---------------------------
   Start App
---------------------------- */
document.addEventListener("DOMContentLoaded", () => app.init());
