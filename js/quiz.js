import { askAI } from './ai-tutor.js';

let quizItems = [], userAnswers = {}, currentIndex = 0, quizMode = null, lessonSlug = '';

export function initQuiz(items, slug) {
    if (!items || items.length === 0) return;
    quizItems = items;
    lessonSlug = slug;
    const startBtn = document.getElementById('start-quiz-btn');
    const modal = document.getElementById('quiz-modal');
    if (startBtn && modal) {
        startBtn.style.display = 'inline-block';
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });
    }
    document.getElementById('start-exam-btn')?.addEventListener('click', () => start('exam'));
    document.getElementById('browse-questions-btn')?.addEventListener('click', () => start('browse'));
    document.getElementById('quiz-reset-btn')?.addEventListener('click', resetQuiz);
    loadProgress();
    if (Object.keys(userAnswers).length > 0) {
        if (confirm('You have saved progress. Resume?')) { start('exam'); } 
        else { resetQuiz(false); }
    }
}

function start(mode) {
    quizMode = mode;
    document.getElementById('quiz-modal').style.display = 'none';
    document.getElementById('quiz-container').classList.remove('hidden');
    renderQuestion();
}

function renderQuestion() {
    const quizMain = document.getElementById('quiz-main');
    const resultsContainer = document.getElementById('quiz-results');
    if(quizMode === 'browse') return renderBrowseView();
    if (quizMain) quizMain.style.display = 'block';
    if (resultsContainer) resultsContainer.style.display = 'none';
    const question = quizItems[currentIndex];
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);
    const questionEl = document.getElementById('quiz-question-stem');
    const optionsEl = document.getElementById('quiz-options');
    if (questionEl) questionEl.innerHTML = `(${currentIndex + 1}/${quizItems.length}) ${question.stem}`;
    if (optionsEl) optionsEl.innerHTML = '';
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
        if (optionsEl) optionsEl.appendChild(optionEl);
    });
    updateProgress();
    updateNavButtons();
}

function renderBrowseView() {
    const quizMain = document.getElementById('quiz-main');
    const resultsContainer = document.getElementById('quiz-results');
    if (quizMain) quizMain.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'block';
    const resultsHeader = document.getElementById('quiz-results-header');
    const finalScore = document.getElementById('quiz-final-score');
    const quizNav = document.getElementById('quiz-nav');
    if (resultsHeader) resultsHeader.textContent = 'Browse All Questions';
    if (finalScore) finalScore.style.display = 'none';
    if (quizNav) quizNav.style.display = 'none';
    const resultsDetails = document.getElementById('quiz-results-details');
    if (resultsDetails) {
        resultsDetails.innerHTML = quizItems.map((q, index) => {
            const optionsHtml = q.options.map(opt => `<div class="result-option ${opt.id === q.correct ? 'correct' : ''}">${opt.text}</div>`).join('');
            return `<div class="result-question-review"><p><strong>${index + 1}. ${q.stem}</strong></p><div class="result-options-container">${optionsHtml}</div></div>`;
        }).join('');
    }
}

function handleAnswerSelect(event) {
    const selectedOption = event.target;
    userAnswers[currentIndex] = selectedOption.dataset.optionId;
    saveProgress();
    renderQuestion();
}

function showResults() {
    document.getElementById('quiz-main').style.display = 'none';
    const resultsContainer = document.getElementById('quiz-results');
    resultsContainer.style.display = 'block';
    let score = 0;
    Object.keys(userAnswers).forEach(index => {
        if (userAnswers[index] === quizItems[index].correct) score++;
    });
    document.getElementById('quiz-results-header').textContent = 'Quiz Complete!';
    const finalScoreEl = document.getElementById('quiz-final-score');
    finalScoreEl.style.display = 'block';
    finalScoreEl.textContent = `Your Final Score: ${score} / ${quizItems.length}`;
    const resultsDetails = document.getElementById('quiz-results-details');
    resultsDetails.innerHTML = quizItems.map((q, index) => {
        const userAnswerId = userAnswers[index];
        const correctId = q.correct;
        const optionsHtml = q.options.map(opt => `<div class="result-option ${opt.id === correctId ? 'correct' : (opt.id === userAnswerId ? 'incorrect' : '')}">${opt.text}</div>`).join('');
        const aiButtonHtml = userAnswerId !== correctId ? `<button class="btn-ask-ai" data-question-index="${index}">Ask AI to Explain</button>` : '';
        return `<div class="result-question-review"><p><strong>${index + 1}. ${q.stem}</strong></p><div class="result-options-container">${optionsHtml}</div>${aiButtonHtml}</div>`;
    }).join('');
    resultsDetails.querySelectorAll('.btn-ask-ai').forEach(button => button.addEventListener('click', handleAskAI));
}

function handleAskAI(event) {
    const questionIndex = parseInt(event.currentTarget.dataset.questionIndex, 10);
    const question = quizItems[questionIndex];
    const userAnswerText = question.options.find(o => o.id === userAnswers[questionIndex])?.text;
    const correctAnswerText = question.options.find(o => o.id === question.correct)?.text;
    const prompt = `Explain why "${correctAnswerText}" is the correct answer to "${question.stem}", and why my answer, "${userAnswerText}", was incorrect.`;
    askAI(prompt);
}

function updateProgress() {
    const progressText = document.getElementById('quiz-progress-text');
    const progressBar = document.getElementById('quiz-progress-bar-value');
    const answeredCount = Object.keys(userAnswers).length;
    const total = quizItems.length;
    if(progressText) progressText.textContent = `Progress: ${answeredCount} / ${total}`;
    if(progressBar) progressBar.style.width = `${total > 0 ? (answeredCount / total) * 100 : 0}%`;
}

function updateNavButtons() {
    const nextBtn = document.getElementById('quiz-next-btn');
    const prevBtn = document.getElementById('quiz-prev-btn');
    if (!nextBtn || !prevBtn) return;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = !userAnswers.hasOwnProperty(currentIndex) && quizMode === 'exam';
    prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
    nextBtn.onclick = () => { if (currentIndex < quizItems.length - 1) { currentIndex++; renderQuestion(); } else { showResults(); } };
    nextBtn.textContent = (currentIndex === quizItems.length - 1 && userAnswers.hasOwnProperty(currentIndex)) ? 'Finish & See Results' : 'Next →';
}

function getStorageKey() { return `quiz_progress_${lessonSlug}`; }
function saveProgress() { localStorage.setItem(getStorageKey(), JSON.stringify(userAnswers)); }
function loadProgress() { userAnswers = JSON.parse(localStorage.getItem(getStorageKey()) || '{}'); }

function resetQuiz(confirmReset = true) {
    if (confirmReset && !confirm('Are you sure you want to reset your quiz progress?')) return;
    userAnswers = {};
    currentIndex = 0;
    localStorage.removeItem(getStorageKey());
    document.getElementById('quiz-main').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-modal').style.display = 'flex';
}
