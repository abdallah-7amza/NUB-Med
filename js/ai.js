// js/ai-tutor.js
// Gemini-based AI Tutor with key modal + fixed quick prompts + safe send handler.

const STORAGE = {
  API_KEY: 'nub_med_gemini_api_key',           // localStorage key name (اسم التخزين المحلي)
  CHAT_HISTORY: 'nub_med_ai_chat_history'      // chat history key (سجل المحادثة)
};

const GEMINI_MODEL = 'gemini-1.5-flash';       // model id (معرف الموديل)
const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;

const DEFAULT_SYSTEM_PROMPT =
  `You are an expert clinical medical tutor for a Cairo University student.
Answer in English, and after any difficult English medical word or sentence, add a short Arabic clarification in parentheses.
Focus on clinical reasoning, exam-style points, and concise explanations.`;

// Simple helpers (دوال مساعدة بسيطة)
const $ = (id) => document.getElementById(id);

export function initAITutor({ getLessonContext }) {
  // Elements (العناصر)
  const fab = $('ai-tutor-fab');
  const overlay = $('chat-overlay');
  const chatWindow = $('chat-window');
  const closeBtn = $('close-chat-btn');

  const messages = $('chat-messages');
  const sendForm = $('chat-input-form');
  const chatInput = $('chat-input');
  const quickPrompts = $('quick-prompts');

  const exportBtn = $('export-chat-btn');
  const changeKeyBtn = $('change-key-btn');

  // Key modal elements (عناصر مودال المفتاح)
  const keyModal = $('key-modal');
  const apiKeyInput = $('api-key-input');
  const saveKeyBtn = $('save-key-btn');
  const cancelKeyBtn = $('cancel-key-btn');

  // Lesson context (سياق الدرس)
  const ctx = getLessonContext?.() || {};
  $('lesson-context-summary').textContent = ctx.summary || ctx.title || '';

  // State (الحالة)
  let chatHistory = loadChatHistory() || [];
  let queuedTextAfterKey = null; // to send a queued prompt after key is set (إرسال رسالة بعد حفظ المفتاح)

  // --- Open flow: FAB click ---
  fab.addEventListener('click', async () => {
    const hasKey = !!getApiKey();
    if (!hasKey) {
      // 1) Show key modal first (إظهار مودال المفتاح أولاً)
      openKeyModal(() => {
        // After save -> open chat overlay (بعد الحفظ افتح الشات)
        openChat();
      });
    } else {
      openChat();
    }
  });

  // --- Change Key from header ---
  changeKeyBtn.addEventListener('click', () => {
    openKeyModal(); // open for user to change key anytime (فتح المودال لتغيير المفتاح)
  });

  // --- Overlay controls ---
  closeBtn.addEventListener('click', closeChat);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeChat();
  });

  function openChat() {
    overlay.classList.add('visible');
    overlay.style.display = 'flex';
    renderChat();
  }
  function closeChat() {
    overlay.classList.remove('visible');
    setTimeout(() => (overlay.style.display = 'none'), 160);
  }

  // --- Key Modal logic ---
  function openKeyModal(onSaved) {
    apiKeyInput.value = getApiKey() || '';
    keyModal.classList.add('visible');
    keyModal.style.display = 'flex';
    apiKeyInput.focus();

    const handleSave = () => {
      const key = apiKeyInput.value.trim();
      if (!key) {
        alert('Please paste your Gemini API key. (من فضلك ضع مفتاح Gemini)');
        return;
      }
      setApiKey(key);
      closeKeyModal();
      if (typeof onSaved === 'function') onSaved();
      // If there is a queued text (e.g., quick prompt clicked before key), send it now:
      if (queuedTextAfterKey) {
        const t = queuedTextAfterKey;
        queuedTextAfterKey = null;
        handleSend(t);
      }
    };

    const handleCancel = () => {
      closeKeyModal();
    };

    saveKeyBtn.onclick = handleSave;
    cancelKeyBtn.onclick = handleCancel;
    apiKeyInput.onkeydown = (e) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') handleCancel();
    };
  }
  function closeKeyModal() {
    keyModal.classList.remove('visible');
    setTimeout(() => (keyModal.style.display = 'none'), 120);
  }

  // --- Quick Prompts (fixed) ---
  quickPrompts?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-prompt]');
    if (!btn) return;
    const text = btn.dataset.prompt;
    // If no key yet, open modal and queue the text
    if (!getApiKey()) {
      queuedTextAfterKey = text;
      openKeyModal(() => openChat());
      return;
    }
    // Ensure chat is open (افتح الشات إن لم يكن مفتوحًا)
    if (overlay.style.display !== 'flex') openChat();
    handleSend(text);
  });

  // --- Send form ---
  sendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    // If no key, ask first and queue user input
    if (!getApiKey()) {
      queuedTextAfterKey = text;
      openKeyModal(() => openChat());
      return;
    }
    handleSend(text);
  });

  // --- Core send handler (الدالة الأساسية للإرسال) ---
  async function handleSend(text) {
    chatInput.value = '';
    pushMessage('user', text);

    const typingEl = pushMessage('tutor', 'Thinking...');
    typingEl.classList.add('typing');

    // Build a single text prompt that includes system + context + brief history (بناء نص موحد للطلب)
    const lessonCtx = `Lesson: ${ctx.title}\nSummary: ${ctx.summary}\nSlug: ${ctx.slug}`;
    const shortHistory = chatHistory
      .slice(-10)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt =
`${DEFAULT_SYSTEM_PROMPT}

Context:
${lessonCtx}

Chat History:
${shortHistory}

Student: ${text}`;

    try {
      const key = getApiKey();
      const resp = await fetch(GEMINI_URL(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] } // Gemini content format (الهيكل المطلوب)
          ]
        })
      });
      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Gemini HTTP ${resp.status}: ${msg}`);
      }
      const data = await resp.json();
      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ||
        'No response.';

      typingEl.textContent = aiText;
      typingEl.classList.remove('typing');

      chatHistory.push({ role: 'assistant', content: aiText });
      saveChatHistory(chatHistory);
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      console.error('Gemini error:', err);
      typingEl.textContent = 'Error contacting Gemini API. (حصل خطأ في الاتصال بواجهة Gemini)';
      typingEl.classList.remove('typing');
    }
  }

  // --- Rendering & storage helpers ---
  function pushMessage(role, content) {
    const el = document.createElement('div');
    el.className = `chat-message ${role === 'assistant' ? 'tutor' : role}`;
    if (role === 'tutor') el.className = 'chat-message tutor';
    el.textContent = content;
    messages.appendChild(el);

    // Normalize role in history (توحيد الأدوار في السجل)
    const histRole = role === 'tutor' ? 'assistant' : role;
    chatHistory.push({ role: histRole, content, time: Date.now() });
    saveChatHistory(chatHistory);

    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function renderChat() {
    messages.innerHTML = '';
    chatHistory.forEach((m) => {
      const el = document.createElement('div');
      el.className = `chat-message ${m.role === 'user' ? 'user' : 'tutor'}`;
      el.textContent = m.content;
      messages.appendChild(el);
    });
    messages.scrollTop = messages.scrollHeight;
  }
}

// Storage utilities (أدوات التخزين)
function getApiKey() {
  try { return localStorage.getItem(STORAGE.API_KEY) || ''; }
  catch { return ''; }
}
function setApiKey(key) {
  try { localStorage.setItem(STORAGE.API_KEY, key); } catch {}
}
function loadChatHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE.CHAT_HISTORY)) || []; }
  catch { return []; }
}
function saveChatHistory(history) {
  try {
    const trimmed = history.slice(-200);
    localStorage.setItem(STORAGE.CHAT_HISTORY, JSON.stringify(trimmed));
  } catch {}
}
