// js/ai-tutor.js
// AI Tutor using Google Gemini API

const STORAGE = {
  API_KEY: 'nub_med_gemini_api_key',
  CHAT_HISTORY: 'nub_med_ai_chat_history'
};

const DEFAULT_SYSTEM_PROMPT = `You are an expert clinical medical tutor for a Cairo University student. 
Answer in English, and after any difficult English medical word, add a short Arabic clarification in parentheses. 
Focus on clinical reasoning, exam-style points, and concise explanations.`;

function $(id){ return document.getElementById(id); }

export function initAITutor({ getLessonContext }) {
  const fab = $('ai-tutor-fab');
  const overlay = $('chat-overlay');
  const closeBtn = $('close-chat-btn');
  const sendForm = $('chat-input-form');
  const chatInput = $('chat-input');
  const messages = $('chat-messages');
  const setKeyBtn = $('set-key-btn');
  const keyFlag = $('key-flag');
  const exportBtn = $('export-chat-btn');
  const quickPrompts = $('quick-prompts');

  let chatHistory = loadChatHistory() || [];
  const ctx = getLessonContext?.() || {};
  $('lesson-context-summary').textContent = ctx.summary || ctx.title || '';

  keyFlag.textContent = localStorage.getItem(STORAGE.API_KEY) ? 'Set' : 'Not set';

  fab.addEventListener('click', () => {
    overlay.classList.add('visible');
    overlay.style.display = 'flex';
    renderChat();
  });

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target===overlay) closeOverlay(); });
  function closeOverlay(){ overlay.classList.remove('visible'); setTimeout(()=>overlay.style.display='none',180); }

  setKeyBtn.addEventListener('click', () => {
    const key = prompt("Enter your Gemini API Key", localStorage.getItem(STORAGE.API_KEY)||'');
    if (key && key.trim()) {
      localStorage.setItem(STORAGE.API_KEY, key.trim());
      keyFlag.textContent = 'Set';
    } else {
      localStorage.removeItem(STORAGE.API_KEY);
      keyFlag.textContent = 'Not set';
    }
  });

  exportBtn.addEventListener('click', () => {
    const text = chatHistory.map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`${ctx.slug||'lesson'}-chat.txt`; a.click();
    URL.revokeObjectURL(url);
  });

  quickPrompts?.addEventListener('click', e=>{
    const btn=e.target.closest('button[data-prompt]');
    if(!btn) return;
    chatInput.value=btn.dataset.prompt;
    sendForm.requestSubmit();
  });

  sendForm.addEventListener('submit', async ev=>{
    ev.preventDefault();
    const text=chatInput.value.trim();
    if(!text) return;
    let key=localStorage.getItem(STORAGE.API_KEY);
    if(!key){ key=prompt("Enter your Gemini API Key"); if(!key) return; localStorage.setItem(STORAGE.API_KEY,key.trim()); keyFlag.textContent='Set'; }

    pushMessage('user', text);
    chatInput.value='';
    const lessonCtx=`Lesson: ${ctx.title}\nSummary: ${ctx.summary}\nSlug: ${ctx.slug}`;

    // Gemini needs plain text prompt
    const inputText = `${DEFAULT_SYSTEM_PROMPT}\n\nContext:\n${lessonCtx}\n\nChat History:\n${chatHistory.map(m=>m.role+': '+m.content).join('\n')}\n\nStudent: ${text}`;

    const typingEl=pushMessage('tutor','Thinking...');
    typingEl.classList.add('typing');
    try {
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          contents: [
            { parts: [{ text: inputText }] }
          ]
        })
      });
      const data=await response.json();
      const aiText=data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: empty reply.";
      typingEl.textContent=aiText; typingEl.classList.remove('typing');
      chatHistory.push({role:'assistant',content:aiText}); saveChatHistory(chatHistory);
      scrollBottom();
    } catch(err){ typingEl.textContent="Error contacting Gemini."; console.error(err); }
  });

  function pushMessage(role,text){
    const div=document.createElement('div');
    div.className=`chat-message ${role}`;
    div.textContent=text;
    messages.appendChild(div);
    chatHistory.push({role,content:text}); saveChatHistory(chatHistory);
    scrollBottom();
    return div;
  }
  function renderChat(){ messages.innerHTML=''; chatHistory.forEach(m=>{ const d=document.createElement('div'); d.className=`chat-message ${m.role}`; d.textContent=m.content; messages.appendChild(d); }); scrollBottom(); }
  function scrollBottom(){ messages.scrollTop=messages.scrollHeight; }
}

function loadChatHistory(){ try{return JSON.parse(localStorage.getItem(STORAGE.CHAT_HISTORY))||[];}catch(e){return[];} }
function saveChatHistory(h){ localStorage.setItem(STORAGE.CHAT_HISTORY,JSON.stringify(h)); }
