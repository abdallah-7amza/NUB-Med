// The final, corrected, and integrated version of js/lesson.js
import { getLessonContent, getQuizData } from './github.js';

// --- Global variables for the new quiz system ---
let quizItems = [];
let userAnswers = {};
let lessonId = '';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    // Use a different variable name to avoid conflict with the global lessonId
    const currentLessonId = params.get('lesson'); 
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    if (!currentLessonId) {
        contentEl.innerHTML = '<p style="color: red; text-align: center;">Error: Lesson ID is missing in the URL.</p>';
        return;
    }

    const backLink = document.getElementById('back-link-lesson');
    if (backLink && year && specialty) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }

    // Call the main functions
    loadLessonAndQuiz(currentLessonId);
    setupAITutor();
});

async function loadLessonAndQuiz(currentLessonId) {
    // Set the global lessonId for the quiz system to use
    lessonId = currentLessonId;

    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const quizContainer = document.getElementById('quiz-container');

    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId)
    ]);

    // 1. Render Lesson Content (with metadata fix)
    if (markdownContent) {
        const cleanMarkdown = markdownContent.replace(/^---\s*[\s\S]*?---\s*/, '').trim();
        contentEl.innerHTML = marked.parse(cleanMarkdown);
        const firstHeader = contentEl.querySelector('h1');
        if (firstHeader) {
            titleEl.textContent = firstHeader.textContent;
            firstHeader.remove();
        } else {
            titleEl.textContent = lessonId.replace(/-/g, ' ');
        }
    } else {
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p style="color: red;">Could not load lesson content.</p>';
    }

    // 2. Initialize the Interactive Quiz if it exists
    if (quizData && quizData.items && quizData.items.length > 0) {
        quizContainer.style.display = 'block';
        initQuiz(quizData.items);
    }
}

// --- QUIZ SYSTEM (Browse + Sequential) ---
let quizItems = [];
let userAnswers = {};         // لعرض التقدم في التصفح العام
let seqState = {              // حالة الامتحان المتسلسل
  currentIndex: 0,
  answers: {},
  finished: false
};
let lessonId = '';
let mode = null; // 'browse' | 'sequential'

// Helpers
const $ = (sel) => document.querySelector(sel);

function getSeqKey() { return `quiz_seq_${lessonId}`; }
function getBrowseKey() { return `quiz_progress_${lessonId}`; }

function saveSeq() { localStorage.setItem(getSeqKey(), JSON.stringify(seqState)); }
function loadSeq() {
  const raw = localStorage.getItem(getSeqKey());
  seqState = raw ? JSON.parse(raw) : { currentIndex: 0, answers: {}, finished: false };
}
function saveBrowse() { localStorage.setItem(getBrowseKey(), JSON.stringify(userAnswers)); }
function loadBrowse() {
  const raw = localStorage.getItem(getBrowseKey());
  userAnswers = raw ? JSON.parse(raw) : {};
}

function initQuiz(items) {
  quizItems = items;

  // أظهر زر "Test Yourself"
  const startWrap = $('#start-quiz-wrapper');
  const startBtn = $('#start-quiz-btn');
  if (startWrap && startBtn) {
    startWrap.style.display = 'block';
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModeModal();
    });
  }

  // جهّز الكونتينر
  const quizContainer = $('#quiz-container');
  if (quizContainer) quizContainer.style.display = 'none';

  // حمّل الحالات المخزنة
  loadBrowse();
  loadSeq();

  // حدّث الهيدر (سكور/بروجريس) مبدئيًا
  updateHeaderProgress();
  // فعل زر Reset
  const resetBtn = $('#quiz-reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetAllProgress);
}

function openModeModal() {
  const modal = $('#quiz-mode-modal');
  const resumeWrap = $('#resume-exam-wrap');
  const resumeBtn = $('#mode-resume');
  const closeBtn = $('#mode-close');
  const startExamBtn = $('#mode-start-exam');
  const browseBtn = $('#mode-browse');

  if (!modal) return;
  // لو فيه امتحان متسلسل غير منتهي، اعرض زر Resume
  if (Object.keys(seqState.answers).length > 0 && !seqState.finished) {
    resumeWrap.style.display = 'block';
  } else {
    resumeWrap.style.display = 'none';
  }

  modal.setAttribute('aria-hidden', 'false');

  const closeModal = () => modal.setAttribute('aria-hidden', 'true');

  closeBtn.onclick = closeModal;
  browseBtn.onclick = () => { closeModal(); startBrowseMode(); };
  startExamBtn.onclick = () => { closeModal(); startSequentialExam(false); };
  resumeBtn && (resumeBtn.onclick = () => { closeModal(); startSequentialExam(true); });
}

// --- Browse Mode (عرض كل الأسئلة + إظهار الإجابة الصحيحة) ---
function startBrowseMode() {
  mode = 'browse';
  $('#quiz-container').style.display = 'block';
  $('#quiz-controls').style.display = 'none';
  renderBrowse();
}

function renderBrowse() {
  const host = $('#quiz-content');
  host.innerHTML = '';

  quizItems.forEach((q, index) => {
    const answered = userAnswers.hasOwnProperty(index);
    const userAns = userAnswers[index];

    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';

    const optionsHtml = q.options.map(opt => {
      // إظهر الإجابة الصحيحة طول الوقت في وضع التصفح
      let cls = (opt.id === q.correct) ? 'correct' : '';
      // لو المستخدم كان مجاوب قبل كده (من جلسة سابقة)، ظلّل الغلط
      if (answered && opt.id === userAns && userAns !== q.correct) cls = 'incorrect';
      return `
        <label class="${cls}">
          <input type="radio" name="q-${index}" value="${opt.id}" ${answered ? 'disabled' : ''} ${userAns === opt.id ? 'checked' : ''}>
          <span>${opt.text}</span>
        </label>
      `;
    }).join('');

    questionDiv.innerHTML = `
      <p><strong>${index + 1}. ${q.stem}</strong></p>
      <div class="quiz-options">${optionsHtml}</div>
    `;
    host.appendChild(questionDiv);
  });

  // حفظ اختيار المستخدم حتى في وضع التصفح (اختياري)
  host.querySelectorAll('.quiz-options input[type="radio"]:not(:disabled)').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.name.split('-')[1]);
      userAnswers[idx] = e.target.value;
      saveBrowse();
      renderBrowse();
      updateHeaderProgress();
    });
  });

  updateHeaderProgress();
}

// --- Sequential Exam (سؤال واحد لكل صفحة) ---
function startSequentialExam(resume = false) {
  mode = 'sequential';
  $('#quiz-container').style.display = 'block';
  $('#quiz-controls').style.display = 'flex';
  if (!resume) { seqState = { currentIndex: 0, answers: {}, finished: false }; saveSeq(); }
  renderSequential();
}

function renderSequential() {
  const host = $('#quiz-content');
  host.innerHTML = '';

  const i = seqState.currentIndex;
  const q = quizItems[i];

  const yourAnswer = seqState.answers[i]; // ممكن يكون undefined

  const optionsHtml = q.options.map(opt => {
    // بعد ما يجاوب، نلوّن
    let cls = '';
    if (yourAnswer !== undefined) {
      if (opt.id === q.correct) cls = 'correct';
      else if (opt.id === yourAnswer) cls = 'incorrect';
    }
    const disabled = (yourAnswer !== undefined) ? 'disabled' : '';
    const checked = (yourAnswer === opt.id) ? 'checked' : '';
    return `
      <label class="${cls}">
        <input type="radio" name="q-${i}" value="${opt.id}" ${disabled} ${checked}>
        <span>${opt.text}</span>
      </label>
    `;
  }).join('');

  host.innerHTML = `
    <p><strong>Question ${i + 1} of ${quizItems.length}</strong></p>
    <p style="margin:.25rem 0 1rem 0;">${q.stem}</p>
    <div class="quiz-options">${optionsHtml}</div>
    <div style="margin-top:.75rem;">
      <button id="ask-ai" class="btn-secondary">Ask AI about this question</button>
    </div>
    <div id="review-note" style="margin-top:.5rem; display:${yourAnswer!==undefined ? 'block':'none'};">
      ${yourAnswer!==undefined ? (yourAnswer===q.correct ? 'Correct ✅' : 'Incorrect ❌') : ''}
    </div>
  `;

  // التعامل مع الاختيار
  host.querySelectorAll('.quiz-options input[type="radio"]').forEach(input => {
    input.addEventListener('change', (e) => {
      seqState.answers[i] = e.target.value;
      saveSeq();
      renderSequential();   // يعيد الرسم علشان يلوّن
      updateHeaderProgress();
      updateNavButtons();
    });
  });

  // زر مساعدة الـAI (يفتح الشات ويملأ برسالة سياقية)
  const aiBtn = $('#ask-ai');
  aiBtn.onclick = () => {
    const aiFab = $('#ai-tutor-fab');
    aiFab && aiFab.click();
    const prompt = `Explain this MCQ and why the correct answer is correct:
Question: ${q.stem}
Options:
${q.options.map(o => `- ${o.text} (${o.id})`).join('\n')}
User answer: ${seqState.answers[i] ?? 'Not answered yet'}
Correct answer: ${q.correct}`;
    const chatInput = $('#chat-input');
    const chatForm = $('#chat-input-form');
    if (chatInput && chatForm) {
      chatInput.value = prompt;
      // ابعت الرسالة
      chatForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  updateNavButtons();
  updateHeaderProgress();
}

function updateNavButtons() {
  const prev = $('#prev-q');
  const next = $('#next-q');
  const finish = $('#finish-exam');

  const i = seqState.currentIndex;
  const total = quizItems.length;
  const answered = seqState.answers.hasOwnProperty(i);

  prev.disabled = (i === 0);
  next.style.display = (i < total - 1) ? 'inline-block' : 'none';
  finish.style.display = (i === total - 1) ? 'inline-block' : 'none';

  // ممنوع تروح للسؤال التالي قبل ما تجاوب الحالي
  next.disabled = !answered;
  finish.disabled = !answered;

  prev.onclick = () => { if (i > 0) { seqState.currentIndex--; saveSeq(); renderSequential(); } };
  next.onclick = () => { if (i < total - 1 && answered) { seqState.currentIndex++; saveSeq(); renderSequential(); } };
  finish.onclick = () => { if (answered) showResults(); };
}

function showResults() {
  seqState.finished = true; saveSeq();

  const host = $('#quiz-content');
  const total = quizItems.length;
  let score = 0;

  const reviewHtml = quizItems.map((q, idx) => {
    const ua = seqState.answers[idx];
    const ok = ua === q.correct;
    if (ok) score++;
    const list = q.options.map(o => {
      let cls = '';
      if (o.id === q.correct) cls = 'correct';
      else if (ua === o.id) cls = 'incorrect';
      return `<li class="${cls}" style="margin:.25rem 0;">${o.text} <small>(${o.id})</small></li>`;
    }).join('');
    return `
      <div class="quiz-question">
        <p><strong>${idx + 1}. ${q.stem}</strong></p>
        <ul style="padding-left:1rem; margin-top:.5rem;">${list}</ul>
        <p style="margin:.25rem 0;">Your answer: <strong>${ua ?? '—'}</strong> | Correct: <strong>${q.correct}</strong></p>
      </div>
    `;
  }).join('');

  host.innerHTML = `
    <h3>Results</h3>
    <p style="margin:.25rem 0 1rem 0;">You scored <strong>${score}</strong> out of <strong>${total}</strong>.</p>
    <div>${reviewHtml}</div>
    <div style="display:flex; gap:.5rem; margin-top:1rem;">
      <button id="review-browse" class="btn-secondary">Browse Questions</button>
      <button id="restart-exam" class="btn">Retake Exam</button>
    </div>
  `;

  $('#quiz-controls').style.display = 'none';

  $('#review-browse').onclick = () => startBrowseMode();
  $('#restart-exam').onclick = () => { seqState = { currentIndex: 0, answers: {}, finished: false }; saveSeq(); startSequentialExam(false); };

  updateHeaderProgress();
}

function updateHeaderProgress() {
  const scoreEl = $('#quiz-score');
  const progressEl = $('#quiz-progress-value');
  const resetBtn = $('#quiz-reset-btn');

  const total = quizItems.length;

  // نحسب Answered حسب الوضعين
  const answeredBrowse = Object.keys(userAnswers).length;
  const answeredSeq   = Object.keys(seqState.answers).length;
  const answered = (mode === 'sequential') ? answeredSeq : Math.max(answeredBrowse, answeredSeq);

  // نحسب السكور الفعلي من إجابات المتسلسل (أدق)
  let score = 0;
  Object.keys(seqState.answers).forEach(i => {
    if (quizItems[i].correct === seqState.answers[i]) score++;
  });

  scoreEl.textContent = `Score: ${score} / ${total}`;
  const percent = total ? (answered / total) * 100 : 0;
  progressEl.style.width = `${percent}%`;
  resetBtn.style.display = (answered > 0) ? 'inline-block' : 'none';
}

function resetAllProgress() {
  if (!confirm('Are you sure you want to reset your progress?')) return;
  localStorage.removeItem(getBrowseKey());
  localStorage.removeItem(getSeqKey());
  userAnswers = {};
  seqState = { currentIndex: 0, answers: {}, finished: false };
  // ارجع للوضع الافتراضي: اختار وضع
  $('#quiz-content').innerHTML = '';
  $('#quiz-controls').style.display = 'none';
  $('#quiz-container').style.display = 'none';
  updateHeaderProgress();
  openModeModal();
}


    closeChatBtn.addEventListener('click', () => {
        chatOverlay.classList.remove('visible');
        setTimeout(() => chatOverlay.style.display = 'none', 200);
    });

    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        let apiKey = localStorage.getItem(API_KEY_STORAGE_ID);
        if (!apiKey) {
            apiKey = prompt("To use the AI Tutor, please enter your API Key. It will be saved securely in this browser for future use.");
            if (apiKey && apiKey.trim() !== '') {
                localStorage.setItem(API_KEY_STORAGE_ID, apiKey);
            } else {
                alert("An API Key is required to use this feature. Please try again.");
                return;
            }
        }

        addChatMessage(userMessage, 'user');
        chatInput.value = '';

        setTimeout(() => {
            const thinkingMsg = addChatMessage("Thinking...", 'tutor');
            setTimeout(() => {
                thinkingMsg.textContent = "AI response functionality is not yet connected.";
            }, 1500);
        }, 500);
    });

    function addChatMessage(message, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = message;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }
}
