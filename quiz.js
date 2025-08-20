// js/quiz.js
// =====================================================
//      NUB MED Portal - Interactive Quiz System
// =====================================================
import { askAI } from './ai-tutor.js';

// --- State Management ---
let quizItems = []; // All questions for the current lesson
let userAnswers = {}; // { "questionIndex": "selectedOptionId" }
let currentIndex = 0; // The current question index being viewed
let quizMode = null; // Can be 'exam' or 'browse'
let lessonSlug = ''; // To create a unique key for localStorage

// --- DOM Element References ---
let quizContainer, modal, quizMain, resultsContainer, progressBar, progressText, questionEl, optionsEl, navButtons, resultsDetails;

// --- Public Initialization Function ---
export function initQuiz(items, slug) {
    if (!items || items.length === 0) return;

    // Store data and get DOM elements
    quizItems = items;
    lessonSlug = slug;
    quizContainer = document.getElementById('quiz-container');
    modal = document.getElementById('quiz-modal');
    quizMain = document.getElementById('quiz-main');
    resultsContainer = document.getElementById('quiz-results');

    // Make the "Test Yourself" button visible and attach event
    const startBtn = document.getElementById('start-quiz-btn');
    startBtn.style.display = 'inline-block';
    startBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Attach events to modal buttons
    document.getElementById('start-exam-btn').addEventListener('click', () => start('exam'));
    document.getElementById('browse-questions-btn').addEventListener('click', () => start('browse'));
    document.getElementById('quiz-reset-btn').addEventListener('click', resetQuiz);

    loadProgress(); // Check for saved progress
    if (Object.keys(userAnswers).length > 0) {
         // If there's saved progress, ask the user if they want to resume
        if (confirm('You have progress saved for this quiz. Do you want to resume?')) {
            start('exam'); // Directly start the exam
        } else {
            resetQuiz(); // Clear progress if they choose not to resume
        }
    }
}

// --- Core Logic ---
function start(mode) {
    quizMode = mode;
    modal.style.display = 'none';
    quizContainer.classList.remove('hidden');
    
    // Get references to elements inside the main quiz area
    progressBar = document.getElementById('quiz-progress-bar-value');
    progressText = document.getElementById('quiz-progress-text');
    questionEl = document.getElementById('quiz-question-stem');
    optionsEl = document.getElementById('quiz-options');
    navButtons = document.getElementById('quiz-nav');
    resultsDetails = document.getElementById('quiz-results-details');

    if (quizMode === 'exam') {
        renderQuestion();
    } else if (quizMode === 'browse') {
        renderBrowseView();
    }
}

function renderQuestion() {
    quizMain.style.display = 'block';
    resultsContainer.style.display = 'none';

    const question = quizItems[currentIndex];
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);

    questionEl.innerHTML = `(${currentIndex + 1}/${quizItems.length}) ${question.stem}`;
    optionsEl.innerHTML = ''; // Clear previous options

    question.options.forEach(option => {
        const optionEl = document.createElement('button');
        optionEl.className = 'quiz-option';
        optionEl.dataset.optionId = option.id;
        optionEl.innerHTML = option.text;

        if (isAnswered) {
            optionEl.disabled = true; // Disable all options if answered
            if (option.id === question.correct) {
                optionEl.classList.add('correct');
            } else if (option.id === userAnswers[currentIndex]) {
                optionEl.classList.add('incorrect');
            }
        } else {
            optionEl.addEventListener('click', handleAnswerSelect);
        }
        optionsEl.appendChild(optionEl);
    });

    updateProgress();
    updateNavButtons();
}

function renderBrowseView() {
    quizMain.style.display = 'none'; // Hide the single-question view
    resultsContainer.style.display = 'block'; // Show the results/browse view
    document.getElementById('quiz-results-header').textContent = 'Browse All Questions';
    document.getElementById('quiz-final-score').style.display = 'none';
    document.getElementById('quiz-nav').style.display = 'none';
    
    resultsDetails.innerHTML = quizItems.map((q, index) => {
        const optionsHtml = q.options.map(opt => `
            <div class="result-option ${opt.id === q.correct ? 'correct' : ''}">
                ${opt.text}
            </div>
        `).join('');

        return `
            <div class="result-question-review">
                <p><strong>${index + 1}. ${q.stem}</strong></p>
                <div class="result-options-container">${optionsHtml}</div>
            </div>
        `;
    }).join('');
}


function handleAnswerSelect(event) {
    const selectedOption = event.target;
    const selectedId = selectedOption.dataset.optionId;
    const correctId = quizItems[currentIndex].correct;

    userAnswers[currentIndex] = selectedId;
    saveProgress();

    // Visually disable all buttons for this question to prevent re-answering
    optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
        btn.removeEventListener('click', handleAnswerSelect);
        btn.disabled = true;
    });

    // Apply styles for correct/incorrect
    if (selectedId === correctId) {
        selectedOption.classList.add('correct');
    } else {
        selectedOption.classList.add('incorrect');
        // Also show the correct one
        const correctOptionEl = optionsEl.querySelector(`[data-option-id="${correctId}"]`);
        if (correctOptionEl) {
            correctOptionEl.classList.add('correct');
        }
    }

    updateProgress();
    updateNavButtons(); // Re-check nav button state
}

function showResults() {
    quizMain.style.display = 'none';
    resultsContainer.style.display = 'block';

    let score = 0;
    for (let i = 0; i < quizItems.length; i++) {
        if (userAnswers[i] === quizItems[i].correct) {
            score++;
        }
    }
    
    document.getElementById('quiz-results-header').textContent = 'Quiz Complete!';
    const finalScoreEl = document.getElementById('quiz-final-score');
    finalScoreEl.style.display = 'block';
    finalScoreEl.textContent = `Your Final Score: ${score} / ${quizItems.length}`;
    
    resultsDetails.innerHTML = quizItems.map((q, index) => {
        const userAnswerId = userAnswers[index];
        const correctId = q.correct;

        const optionsHtml = q.options.map(opt => {
            let className = 'result-option';
            if (opt.id === correctId) {
                className += ' correct';
            } else if (opt.id === userAnswerId) {
                className += ' incorrect';
            }
            return `<div class="${className}">${opt.text}</div>`;
        }).join('');

        // AI Tutor integration button
        const aiButtonHtml = userAnswerId !== correctId ? `
            <button class="btn-ask-ai" data-question-index="${index}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12a10 10 0 1010-10A10 10 0 002 12zm11-1h-6v2h6v-2zm2-3h-8v2h8V8zm0 6h-8v2h8v-2z"></path></svg>
                Ask AI to Explain
            </button>
        ` : '';

        return `
            <div class="result-question-review">
                <p><strong>${index + 1}. ${q.stem}</strong></p>
                <div class="result-options-container">${optionsHtml}</div>
                ${aiButtonHtml}
            </div>
        `;
    }).join('');

    // Add event listeners to all "Ask AI" buttons
    resultsDetails.querySelectorAll('.btn-ask-ai').forEach(button => {
        button.addEventListener('click', handleAskAI);
    });
}

function handleAskAI(event) {
    const button = event.currentTarget;
    const questionIndex = parseInt(button.dataset.questionIndex);
    const question = quizItems[questionIndex];
    const userAnswerId = userAnswers[questionIndex];
    const userAnswerText = question.options.find(o => o.id === userAnswerId)?.text;
    const correctAnswerText = question.options.find(o => o.id === question.correct)?.text;

    const prompt = `Regarding the question "${question.stem}", please explain why "${correctAnswerText}" is the correct answer and why my answer, "${userAnswerText}", was incorrect. Keep the explanation concise and clear for a medical student.`;

    // Call the exported function from ai-tutor.js
    askAI(prompt);
}


// --- UI Updates & Navigation ---
function updateProgress() {
    const answeredCount = Object.keys(userAnswers).length;
    const total = quizItems.length;
    const percent = total > 0 ? (answeredCount / total) * 100 : 0;
    
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `Progress: ${answeredCount} / ${total}`;
}

function updateNavButtons() {
    const isAnswered = userAnswers.hasOwnProperty(currentIndex);
    const nextBtn = document.getElementById('quiz-next-btn');
    const prevBtn = document.getElementById('quiz-prev-btn');

    // Navigation logic
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = !isAnswered && quizMode === 'exam'; // Can't go next until answered
    
    prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
    nextBtn.onclick = () => {
        if (currentIndex < quizItems.length - 1) {
            currentIndex++;
            renderQuestion();
        } else {
            // Reached the end
            showResults();
        }
    };
    
    // Check if we are at the end of the quiz
    if (currentIndex === quizItems.length - 1 && isAnswered) {
        nextBtn.textContent = 'Finish & See Results';
    } else {
        nextBtn.textContent = 'Next →';
    }
}

// --- Local Storage & Reset ---
function getStorageKey() {
    return `quiz_progress_${lessonSlug}`;
}

function saveProgress() {
    localStorage.setItem(getStorageKey(), JSON.stringify(userAnswers));
}

function loadProgress() {
    const saved = localStorage.getItem(getStorageKey());
    userAnswers = saved ? JSON.parse(saved) : {};
}

function resetQuiz() {
    if (confirm('Are you sure you want to reset your quiz progress? This cannot be undone.')) {
        userAnswers = {};
        currentIndex = 0;
        localStorage.removeItem(getStorageKey());
        
        // Hide quiz and show the modal again
        quizContainer.classList.add('hidden');
        modal.style.display = 'flex';
        console.log('Quiz has been reset.');
    }
}
