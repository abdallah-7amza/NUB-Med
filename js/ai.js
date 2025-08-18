// js/ai-tutor.js

const STORAGE = {
  API_KEY: 'nub_med_gemini_api_key',
  CHAT_HISTORY: 'nub_med_ai_chat_history'
};

let chatHistory = [];

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
