// =====================================================
//      NUB MED Portal - Interactive Quiz System (Reshaped & Robust)
// =====================================================

let quizItems = [], userAnswers = {}, currentIndex = 0, quizMode = null, lessonSlug = '';
let dom = {}; // Object to hold all DOM element references

/**
 * Initializes the entire quiz system. Checks for necessary elements first.
 */
export function initQuiz(items, slug) {
    if (!items || items.length === 0) return;

    quizItems = items;
    lessonSlug = slug;

    // Find all necessary HTML elements at the start. If any are missing, stop and report an error.
    if (!findAllDOMElements()) {
        console.error("Quiz Initialization Failed: One or more required HTML elements are missing. Check IDs in lesson.html.");
        return;
    }

    // If everything is found, attach the event listeners.
    attachEventListeners();

    // Show the main "Test Yourself" button
    dom.startBtn.style.display = 'inline-block';

    loadProgress();
    if (Object.keys(userAnswers).length > 0) {
        if (confirm('You have saved progress for this quiz. Do you want to resume?')) {
            start('exam');
        } else {
            resetQuiz();
        }
    }
}

/**
 * Finds and stores all required DOM elements. Returns false if any are missing.
 */
function findAllDOMElements() {
    dom.startBtn = document.getElementById('start-quiz-btn');
    dom.quizContainer = document.getElementById('quiz-container');
    dom.modal = document.getElementById('quiz-modal');
    dom.quizMain = document.getElementById('quiz-main');
    dom.resultsContainer = document.getElementById('quiz-results');
    dom.startExamBtn = document.getElementById('start-exam-btn');
    dom.browseQuestionsBtn = document.getElementById('browse-questions-btn');
    dom.resetBtn = document.getElementById('quiz-reset-btn');
    dom.progressBar = document.getElementById('quiz-progress-bar-value');
    dom.progressText = document.getElementById('quiz-progress-text');
    dom.questionEl = document.getElementById('quiz-question-stem');
    dom.optionsEl = document.getElementById('quiz-options');
    dom.nav = document.getElementById('quiz-nav');
    dom.prevBtn = document.getElementById('quiz-prev-btn');
    dom.nextBtn = document.getElementById('quiz-next-btn');
    dom.resultsDetails = document.getElementById('quiz-results-details');
    dom.resultsHeader = document.getElementById('quiz-results-header');
    dom.finalScore = document.getElementById('quiz-final-score');

    // Check if any crucial element is missing
    const requiredElements = [dom.startBtn, dom.quizContainer, dom.modal, dom.quizMain, dom.resultsContainer];
    return requiredElements.every(el => el !== null);
}

/**
 * Attaches all event listeners for the quiz buttons.
 */
function attachEventListeners() {
    dom.startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dom.modal.style.display = 'flex';
    });

    dom.startExamBtn.addEventListener('click', () => start('exam'));
    dom.browseQuestionsBtn.addEventListener('click', () => start('browse'));
    dom.resetBtn.addEventListener('click', resetQuiz);
}

function start(mode) {
    quizMode = mode;
    dom.modal.style.display = 'none';
    dom.quizContainer.classList.remove('hidden');

    if (quizMode === 'exam') renderQuestion();
    else if (quizMode === 'browse') renderBrowseView();
}

function renderQuestion() {
    dom.quizMain.style.display = 'block';
    dom.resultsContainer.style.display = 'none';

    const question = quizItems[currentIndex];
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);

    dom.questionEl.innerHTML = `(${currentIndex + 1}/${quizItems.length}) ${question.stem}`;
    dom.optionsEl.innerHTML = '';

    question.options.forEach(option => {
        const optionEl = document.createElement('button');
        optionEl.className = 'quiz-option';
        optionEl.dataset.optionId = option.id;
        optionEl.innerHTML = option.text;

        if (isAnswered) {
            optionEl.disabled = true;
            if (option.id === question.correct) optionEl.classList.add('correct');
            else if (option.id === userAnswers[currentIndex]) optionEl.classList.add('incorrect');
        } else {
            optionEl.addEventListener('click', handleAnswerSelect);
        }
        dom.optionsEl.appendChild(optionEl);
    });

    updateProgress();
    updateNavButtons();
}

function renderBrowseView() {
    dom.quizMain.style.display = 'none';
    dom.resultsContainer.style.display = 'block';
    
    dom.resultsHeader.textContent = 'Browse All Questions';
    dom.finalScore.style.display = 'none';
    dom.nav.style.display = 'none';
    
    dom.resultsDetails.innerHTML = quizItems.map((q, index) => {
        const optionsHtml = q.options.map(opt => `<div class="result-option ${opt.id === q.correct ? 'correct' : ''}">${opt.text}</div>`).join('');
        return `<div class="result-question-review"><p><strong>${index + 1}. ${q.stem}</strong></p><div class="result-options-container">${optionsHtml}</div></div>`;
    }).join('');
}

function handleAnswerSelect(event) {
    const selectedOption = event.target;
    const selectedId = selectedOption.dataset.optionId;
    const correctId = quizItems[currentIndex].correct;

    userAnswers[currentIndex] = selectedId;
    saveProgress();

    dom.optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
        btn.removeEventListener('click', handleAnswerSelect);
        btn.disabled = true;
    });

    if (selectedId === correctId) {
        selectedOption.classList.add('correct');
    } else {
        selectedOption.classList.add('incorrect');
        const correctEl = dom.optionsEl.querySelector(`[data-option-id="${correctId}"]`);
        if (correctEl) correctEl.classList.add('correct');
    }
    updateProgress();
    updateNavButtons();
}

function showResults() {
    dom.quizMain.style.display = 'none';
    dom.resultsContainer.style.display = 'block';

    let score = 0;
    for (let i = 0; i < quizItems.length; i++) {
        if (userAnswers[i] === quizItems[i].correct) score++;
    }
    
    dom.resultsHeader.textContent = 'Quiz Complete!';
    dom.finalScore.style.display = 'block';
    dom.finalScore.textContent = `Your Final Score: ${score} / ${quizItems.length}`;
    
    dom.resultsDetails.innerHTML = quizItems.map((q, index) => {
        const userAnswerId = userAnswers[index];
        const correctId = q.correct;
        const optionsHtml = q.options.map(opt => {
            let className = 'result-option';
            if (opt.id === correctId) className += ' correct';
            else if (opt.id === userAnswerId) className += ' incorrect';
            return `<div class="${className}">${opt.text}</div>`;
        }).join('');
        const aiButtonHtml = userAnswerId !== correctId ? `<button class="btn-ask-ai" data-question-index="${index}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12a10 10 0 1010-10A10 10 0 002 12zm11-1h-6v2h6v-2zm2-3h-8v2h8V8zm0 6h-8v2h8v-2z"></path></svg> Ask AI to Explain</button>` : '';
        return `<div class="result-question-review"><p><strong>${index + 1}. ${q.stem}</strong></p><div class="result-options-container">${optionsHtml}</div>${aiButtonHtml}</div>`;
    }).join('');
    dom.resultsDetails.querySelectorAll('.btn-ask-ai').forEach(button => button.addEventListener('click', handleAskAI));
}

async function handleAskAI(event) {
    const button = event.currentTarget;
    const questionIndex = parseInt(button.dataset.questionIndex);
    const question = quizItems[questionIndex];
    const userAnswerId = userAnswers[questionIndex];
    const userAnswerText = question.options.find(o => o.id === userAnswerId)?.text;
    const correctAnswerText = question.options.find(o => o.id === question.correct)?.text;

    const prompt = `Regarding the question "${question.stem}", please explain why "${correctAnswerText}" is the correct answer and why my answer, "${userAnswerText}", was incorrect. Keep the explanation concise and clear for a medical student.`;
    
    const { askAI } = await import('./ai-tutor.js');
    askAI(prompt);
}

function updateProgress() {
    const answeredCount = Object.keys(userAnswers).length;
    const total = quizItems.length;
    const percent = total > 0 ? (answeredCount / total) * 100 : 0;
    dom.progressBar.style.width = `${percent}%`;
    dom.progressText.textContent = `Progress: ${answeredCount} / ${total}`;
}

function updateNavButtons() {
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);
    dom.prevBtn.disabled = currentIndex === 0;
    dom.nextBtn.disabled = !isAnswered && quizMode === 'exam';
    dom.prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
    dom.nextBtn.onclick = () => { if (currentIndex < quizItems.length - 1) { currentIndex++; renderQuestion(); } else { showResults(); } };
    dom.nextBtn.textContent = (currentIndex === quizItems.length - 1 && isAnswered) ? 'Finish & See Results' : 'Next →';
}

function getStorageKey() { return `quiz_progress_${lessonSlug}`; }
function saveProgress() { localStorage.setItem(getStorageKey(), JSON.stringify(userAnswers)); }
function loadProgress() { const saved = localStorage.getItem(getStorageKey()); userAnswers = saved ? JSON.parse(saved) : {}; }

function resetQuiz() {
    if (confirm('Are you sure you want to reset your quiz progress?')) {
        userAnswers = {};
        currentIndex = 0;
        localStorage.removeItem(getStorageKey());
        dom.quizMain.style.display = 'none';
        dom.resultsContainer.style.display = 'none';
        dom.quizContainer.classList.add('hidden');
        dom.modal.style.display = 'flex';
    }
}
