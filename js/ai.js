// js/ai-tutor.js

const STORAGE = {
  API_KEY: 'nub_med_gemini_api_key',
  CHAT_HISTORY: 'nub_med_ai_chat_history'
};

let chatHistory = [];/* =====================================================
   NUB MED Portal - Main Logic + AI Tutor (Gemini)
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

  // Quick prompt buttons
  quickPrompts: document.querySelectorAll('.quick-prompts button'),

  // AI Tutor State
  chatHistory: [],
  isChatLoading: false,
  apiKey: localStorage.getItem("gemini_api_key") || null,

  /* ---------------------------
     Initialization
  ---------------------------- */
  init() {
    // AI Tutor listeners
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

    // Quick prompt buttons
    this.quickPrompts.forEach(btn => {
      btn.addEventListener("click", () => {
        const prompt = btn.dataset.prompt;
        this.handleQuickPrompt(prompt);
      });
    });
  },

  /* ---------------------------
     AI Tutor Core
  ---------------------------- */
  openChat() {
    this.chatHistory = [];
    this.addMessageToChat("tutor", "👋 Welcome! I’m your AI Tutor. How can I help you today?");
    this.chatOverlay.classList.add("visible");
    this.chatInput.focus();

    // Ask for API Key if not saved
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
    msg.classList.add("chat-message", role === "user" ? "user" : "assistant");
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
      this.addMessageToChat("assistant", response);
      this.chatHistory.push({ role: "model", parts: [{ text: response }] });
    } catch (err) {
      this.hideLoadingIndicator();
      this.addMessageToChat("assistant", "❌ Error: " + err.message);
      console.error(err);
    }
  },

  async handleQuickPrompt(prompt) {
    if (!prompt) return;
    this.chatInput.value = prompt;
    this.handleSendMessage();
  },

  showLoadingIndicator() {
    this.isChatLoading = true;
    const indicator = document.createElement("div");
    indicator.classList.add("chat-message", "assistant");
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
     Gemini API
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


function $(id){ return document.getElementById(id); }

// Load chat history
function loadChatHistory(){ try{return JSON.parse(localStorage.getItem(STORAGE.CHAT_HISTORY))||[];}catch(e){return[];} }
function saveChatHistory(h){ localStorage.setItem(STORAGE.CHAT_HISTORY,JSON.stringify(h)); }

// DOM
const fab = $('ai-tutor-fab');
const overlay = $('chat-overlay');
const closeBtn = $('close-chat-btn');
const sendForm = $('chat-input-form');
const chatInput = $('chat-input');
const messages = $('chat-messages');
const quickPrompts = document.querySelector('.quick-prompts');

// Events
fab.addEventListener('click', openChat);
closeBtn.addEventListener('click', closeChat);
overlay.addEventListener('click', e=>{ if(e.target===overlay) closeChat(); });
sendForm.addEventListener('submit', handleSend);
quickPrompts.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-prompt]');
  if(!btn) return;
  chatInput.value = btn.dataset.prompt;
  sendForm.requestSubmit();
});

// Functions
function openChat(){
  overlay.classList.add('visible');
  chatHistory = loadChatHistory();
  renderChat();
  chatInput.focus();
  ensureApiKey();
}
function closeChat(){
  overlay.classList.remove('visible');
  saveChatHistory(chatHistory);
}
function renderChat(){
  messages.innerHTML='';
  chatHistory.forEach(m=>pushMessage(m.role,m.content,false));
}
function pushMessage(role,text,save=true){
  const div=document.createElement('div');
  div.className=`chat-message ${role}`;
  div.textContent=text;
  messages.appendChild(div);
  if(save){ chatHistory.push({role,content:text}); saveChatHistory(chatHistory); }
  messages.scrollTop=messages.scrollHeight;
  return div;
}

async function handleSend(ev){
  ev.preventDefault();
  const text = chatInput.value.trim();
  if(!text) return;
  const key = await ensureApiKey();
  if(!key) return;

  pushMessage('user',text);
  chatInput.value='';
  const typingEl = pushMessage('assistant','Thinking...');

  try {
    const inputText = `You are a medical tutor. Answer in English with Arabic clarification for hard words.\n\nChat History:\n${chatHistory.map(m=>m.role+': '+m.content).join('\n')}\n\nStudent: ${text}`;
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents: [{ parts: [{ text: inputText }] }]
      })
    });
    const data=await response.json();
    const aiText=data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: empty reply.";
    typingEl.textContent=aiText;
    chatHistory.push({role:'assistant',content:aiText}); saveChatHistory(chatHistory);
  } catch(err){
    typingEl.textContent="Error contacting Gemini.";
    console.error(err);
  }
}

async function ensureApiKey(){
  let key=localStorage.getItem(STORAGE.API_KEY);
  if(!key){
    key=prompt("Enter your Gemini API Key:");
    if(key && key.trim()){
      localStorage.setItem(STORAGE.API_KEY,key.trim());
      return key.trim();
    } else {
      alert("API Key required to use AI Tutor.");
      return null;
    }
  }
  return key;
}
