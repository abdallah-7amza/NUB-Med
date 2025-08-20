// js/quiz.js (النسخة النهائية المؤكدة)
import { askAI } from './ai-tutor.js';

let quizItems = [], userAnswers = {}, currentIndex = 0, quizMode = null, lessonSlug = '';
let quizContainer, modal, quizMain, resultsContainer, progressBar, progressText, questionEl, optionsEl, navButtons, resultsDetails;

export function initQuiz(items, slug) {
    if (!items || items.length === 0) return;
    quizItems = items;
    lessonSlug = slug;
    
    quizContainer = document.getElementById('quiz-container');
    modal = document.getElementById('quiz-modal');
    quizMain = document.getElementById('quiz-main');
    resultsContainer = document.getElementById('quiz-results');

    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
        startBtn.style.display = 'inline-block';
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.style.display = 'flex';
        });
    }

    const startExamBtn = document.getElementById('start-exam-btn');
    const browseQuestionsBtn = document.getElementById('browse-questions-btn');
    const resetBtn = document.getElementById('quiz-reset-btn');

    if(startExamBtn) startExamBtn.addEventListener('click', () => start('exam'));
    if(browseQuestionsBtn) browseQuestionsBtn.addEventListener('click', () => start('browse'));
    if(resetBtn) resetBtn.addEventListener('click', resetQuiz);

    loadProgress();
    if (Object.keys(userAnswers).length > 0) {
        if (confirm('You have progress saved. Resume?')) {
            start('exam');
        } else {
            resetQuiz();
        }
    }
}

function start(mode) {
    quizMode = mode;
    if(modal) modal.style.display = 'none';
    if(quizContainer) quizContainer.classList.remove('hidden');
    
    progressBar = document.getElementById('quiz-progress-bar-value');
    progressText = document.getElementById('quiz-progress-text');
    questionEl = document.getElementById('quiz-question-stem');
    optionsEl = document.getElementById('quiz-options');
    navButtons = document.getElementById('quiz-nav');
    resultsDetails = document.getElementById('quiz-results-details');

    if (quizMode === 'exam') renderQuestion();
    else if (quizMode === 'browse') renderBrowseView();
}

function renderQuestion() {
    if(quizMain) quizMain.style.display = 'block';
    if(resultsContainer) resultsContainer.style.display = 'none';

    const question = quizItems[currentIndex];
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);

    if(questionEl) questionEl.innerHTML = `(${currentIndex + 1}/${quizItems.length}) ${question.stem}`;
    if(optionsEl) optionsEl.innerHTML = '';

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
        if(optionsEl) optionsEl.appendChild(optionEl);
    });

    updateProgress();
    updateNavButtons();
}

function renderBrowseView() {
    if(quizMain) quizMain.style.display = 'none';
    if(resultsContainer) resultsContainer.style.display = 'block';
    
    const resultsHeader = document.getElementById('quiz-results-header');
    const finalScore = document.getElementById('quiz-final-score');
    const quizNav = document.getElementById('quiz-nav');

    if(resultsHeader) resultsHeader.textContent = 'Browse All Questions';
    if(finalScore) finalScore.style.display = 'none';
    if(quizNav) quizNav.style.display = 'none';
    
    if(resultsDetails) {
        resultsDetails.innerHTML = quizItems.map((q, index) => {
            const optionsHtml = q.options.map(opt => `<div class="result-option ${opt.id === q.correct ? 'correct' : ''}">${opt.text}</div>`).join('');
            return `<div class="result-question-review"><p><strong>${index + 1}. ${q.stem}</strong></p><div class="result-options-container">${optionsHtml}</div></div>`;
        }).join('');
    }
}

function handleAnswerSelect(event) {
    const selectedOption = event.target;
    const selectedId = selectedOption.dataset.optionId;
    const correctId = quizItems[currentIndex].correct;

    userAnswers[currentIndex] = selectedId;
    saveProgress();

    if(optionsEl) {
        optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
            btn.removeEventListener('click', handleAnswerSelect);
            btn.disabled = true;
        });
    }

    if (selectedId === correctId) {
        selectedOption.classList.add('correct');
    } else {
        selectedOption.classList.add('incorrect');
        if(optionsEl){
            const correctOptionEl = optionsEl.querySelector(`[data-option-id="${correctId}"]`);
            if (correctOptionEl) correctOptionEl.classList.add('correct');
        }
    }
    updateProgress();
    updateNavButtons();
}

function showResults() {
    if(quizMain) quizMain.style.display = 'none';
    if(resultsContainer) resultsContainer.style.display = 'block';

    let score = 0;
    for (let i = 0; i < quizItems.length; i++) {
        if (userAnswers[i] === quizItems[i].correct) score++;
    }
    
    const resultsHeader = document.getElementById('quiz-results-header');
    const finalScoreEl = document.getElementById('quiz-final-score');

    if(resultsHeader) resultsHeader.textContent = 'Quiz Complete!';
    if(finalScoreEl) {
        finalScoreEl.style.display = 'block';
        finalScoreEl.textContent = `Your Final Score: ${score} / ${quizItems.length}`;
    }
    
    if(resultsDetails) {
        resultsDetails.innerHTML = quizItems.map((q, index) => {
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
        resultsDetails.querySelectorAll('.btn-ask-ai').forEach(button => button.addEventListener('click', handleAskAI));
    }
}

function handleAskAI(event) {
    const button = event.currentTarget;
    const questionIndex = parseInt(button.dataset.questionIndex);
    const question = quizItems[questionIndex];
    const userAnswerId = userAnswers[questionIndex];
    const userAnswerText = question.options.find(o => o.id === userAnswerId)?.text;
    const correctAnswerText = question.options.find(o => o.id === question.correct)?.text;
    const prompt = `Regarding the question "${question.stem}", please explain why "${correctAnswerText}" is the correct answer and why my answer, "${userAnswerText}", was incorrect. Keep the explanation concise and clear for a medical student.`;
    askAI(prompt);
}

function updateProgress() {
    const answeredCount = Object.keys(userAnswers).length;
    const total = quizItems.length;
    const percent = total > 0 ? (answeredCount / total) * 100 : 0;
    if(progressBar) progressBar.style.width = `${percent}%`;
    if(progressText) progressText.textContent = `Progress: ${answeredCount} / ${total}`;
}

function updateNavButtons() {
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);
    const nextBtn = document.getElementById('quiz-next-btn');
    const prevBtn = document.getElementById('quiz-prev-btn');
    if(!nextBtn || !prevBtn) return;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = !isAnswered && quizMode === 'exam';
    prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
    nextBtn.onclick = () => { if (currentIndex < quizItems.length - 1) { currentIndex++; renderQuestion(); } else { showResults(); } };
    nextBtn.textContent = (currentIndex === quizItems.length - 1 && isAnswered) ? 'Finish & See Results' : 'Next →';
}

function getStorageKey() { return `quiz_progress_${lessonSlug}`; }
function saveProgress() { localStorage.setItem(getStorageKey(), JSON.stringify(userAnswers)); }
function loadProgress() { const saved = localStorage.getItem(getStorageKey()); userAnswers = saved ? JSON.parse(saved) : {}; }

function resetQuiz() {
    if (confirm('Are you sure you want to reset your quiz progress?')) {
        userAnswers = {};
        currentIndex = 0;
        localStorage.removeItem(getStorageKey());
        if(quizContainer) quizContainer.classList.add('hidden');
        if(modal) modal.style.display = 'flex';
    }
}
