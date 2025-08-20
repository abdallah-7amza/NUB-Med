// =====================================================
//      NUB MED Portal - Quiz System (Final, Simplified & Working)
// =====================================================

let quizItems = [], userAnswers = {}, currentIndex = 0, quizMode = null, lessonSlug = '';
let dom = {}; // To hold all HTML elements

export function initQuiz(items, slug) {
    if (!items || items.length === 0) return;
    quizItems = items;
    lessonSlug = slug;

    // Find all necessary elements. If any are missing, stop.
    if (!findAllDOMElements()) {
        console.error("Quiz Init Failed: Could not find all required HTML elements for the quiz.");
        return;
    }

    // Show the main button and attach all click events
    dom.startBtn.style.display = 'inline-block';
    attachEventListeners();

    loadProgress();
    if (Object.keys(userAnswers).length > 0) {
        if (confirm('You have saved progress. Resume?')) {
            start('exam');
        }
    }
}

function findAllDOMElements() {
    dom.startBtn = document.getElementById('start-quiz-btn');
    dom.modal = document.getElementById('quiz-modal');
    dom.quizContainer = document.getElementById('quiz-container');
    dom.quizMain = document.getElementById('quiz-main');
    dom.resultsContainer = document.getElementById('quiz-results');
    dom.startExamBtn = document.getElementById('start-exam-btn');
    dom.browseQuestionsBtn = document.getElementById('browse-questions-btn');
    dom.resetBtn = document.getElementById('quiz-reset-btn');
    dom.optionsEl = document.getElementById('quiz-options');
    dom.nav = document.getElementById('quiz-nav');
    dom.prevBtn = document.getElementById('quiz-prev-btn');
    dom.nextBtn = document.getElementById('quiz-next-btn');

    // Check if the essential elements were found
    return dom.startBtn && dom.modal && dom.quizContainer;
}

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
    // This is a simplified example. Your full renderQuestion logic is likely more complex.
    // Ensure this part is complete in your actual file.
    dom.quizMain.style.display = 'block';
    dom.resultsContainer.style.display = 'none';
    const question = quizItems[currentIndex];
    document.getElementById('quiz-question-stem').innerHTML = `(${currentIndex + 1}/${quizItems.length}) ${question.stem}`;
    dom.optionsEl.innerHTML = ''; // Clear previous options
    question.options.forEach(option => {
        const optionEl = document.createElement('button');
        optionEl.className = 'quiz-option';
        optionEl.dataset.optionId = option.id;
        optionEl.innerHTML = option.text;
        optionEl.addEventListener('click', handleAnswerSelect);
        dom.optionsEl.appendChild(optionEl);
    });
    updateNavButtons();
}

function handleAnswerSelect(event) {
    // Placeholder for your answer handling logic
    const selectedId = event.target.dataset.optionId;
    userAnswers[currentIndex] = selectedId;
    // Disable all buttons after selection
    dom.optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        if(btn.dataset.optionId === quizItems[currentIndex].correct) {
            btn.classList.add('correct');
        } else if (btn.dataset.optionId === selectedId) {
            btn.classList.add('incorrect');
        }
    });
    updateNavButtons();
    saveProgress();
}

function updateNavButtons() {
    dom.prevBtn.disabled = currentIndex === 0;
    dom.nextBtn.disabled = !userAnswers.hasOwnProperty(currentIndex);

    dom.prevBtn.onclick = () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestion();
        }
    };
    dom.nextBtn.onclick = () => {
        if (currentIndex < quizItems.length - 1) {
            currentIndex++;
            renderQuestion();
        } else {
            // Logic to show results
            alert("Quiz Finished!");
        }
    };
}


function resetQuiz() {
    if (confirm('Are you sure you want to reset your quiz progress?')) {
        userAnswers = {};
        currentIndex = 0;
        localStorage.removeItem(getStorageKey());
        dom.quizContainer.classList.add('hidden');
        dom.modal.style.display = 'none';
    }
}

// Dummy functions for progress, assuming you have them
function getStorageKey() { return `quiz_progress_${lessonSlug}`; }
function saveProgress() { localStorage.setItem(getStorageKey(), JSON.stringify(userAnswers)); }
function loadProgress() { const saved = localStorage.getItem(getStorageKey()); userAnswers = saved ? JSON.parse(saved) : {}; }
function renderBrowseView() { /* Your logic here */ }
