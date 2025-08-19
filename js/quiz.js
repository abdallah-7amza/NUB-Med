import { getQuizData } from './github.js';
import { initAITutor } from './ai-tutor.js';

// Quiz state management
let quizState = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: {},
    lessonSlug: ''
};

// DOM elements
const elements = {
    questionStem: document.getElementById('quiz-question-stem'),
    optionsList: document.getElementById('quiz-options-list'),
    nextButton: document.getElementById('next-question-btn'),
    progressBar: document.getElementById('quiz-progress-value'),
    quizContainer: document.getElementById('quiz-in-progress-container'),
    finalScoreContainer: document.getElementById('final-score-container'),
    finalScoreText: document.getElementById('final-score-text'),
    backButton: document.getElementById('back-to-lesson-btn'),
    pageTitle: document.getElementById('page-title')
};

// Initialize quiz
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    quizState.lessonSlug = params.get('lesson');
    
    if (!quizState.lessonSlug) {
        alert('No lesson specified!');
        window.location.href = 'index.html';
        return;
    }

    try {
        const quizData = await getQuizData(quizState.lessonSlug);
        if (!quizData?.items?.length) throw new Error('No questions found');
        
        quizState.questions = quizData.items;
        elements.pageTitle.textContent = `Quiz: ${quizState.lessonSlug.replace(/-/g, ' ')}`;
        
        loadProgress();
        renderQuestion();
        setupAITutor();
    } catch (error) {
        console.error('Quiz loading failed:', error);
        window.location.href = `lesson.html?lesson=${quizState.lessonSlug}`;
    }
});

// Render current question
function renderQuestion() {
    if (quizState.currentQuestionIndex >= quizState.questions.length) {
        showFinalResults();
        return;
    }

    const question = quizState.questions[quizState.currentQuestionIndex];
    elements.questionStem.textContent = `${quizState.currentQuestionIndex + 1}. ${question.stem}`;
    
    // Clear previous options
    elements.optionsList.innerHTML = '';

    // Add new options
    question.options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'quiz-option';
        if (quizState.userAnswers[quizState.currentQuestionIndex] === option.id) {
            optionElement.classList.add('selected');
        }
        
        optionElement.textContent = option.text;
        optionElement.addEventListener('click', () => selectAnswer(option.id));
        elements.optionsList.appendChild(optionElement);
    });

    updateUI();
}

// Handle answer selection
function selectAnswer(optionId) {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    
    // Store answer
    quizState.userAnswers[quizState.currentQuestionIndex] = optionId;
    
    // Check correctness
    const isCorrect = (optionId === currentQuestion.correct);
    if (isCorrect && !currentQuestion.answered) {
        quizState.score++;
        currentQuestion.answered = true;
    }
    
    // Show feedback
    showAnswerFeedback(optionId, currentQuestion.correct);
    saveProgress();
}

// Visual feedback for answers
function showAnswerFeedback(selectedId, correctId) {
    const options = elements.optionsList.querySelectorAll('.quiz-option');
    
    options.forEach(option => {
        const optionText = option.textContent.trim();
        const optionId = getOptionId(optionText);
        
        if (optionId === correctId) {
            option.classList.add('correct');
        } else if (optionId === selectedId && selectedId !== correctId) {
            option.classList.add('incorrect');
        }
        
        option.style.pointerEvents = 'none';
    });
    
    elements.nextButton.disabled = false;
}

// Helper: Extract option ID from text
function getOptionId(optionText) {
    return optionText.split(')')[0].trim().toLowerCase();
}

// Update UI elements
function updateUI() {
    // Update progress
    const progressPercent = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;
    
    // Update button text
    elements.nextButton.textContent = 
        (quizState.currentQuestionIndex === quizState.questions.length - 1) 
            ? "Finish Quiz" 
            : "Next Question";
}

// Show final results
function showFinalResults() {
    elements.quizContainer.style.display = 'none';
    elements.finalScoreContainer.style.display = 'block';
    elements.finalScoreText.textContent = `Your Score: ${quizState.score} / ${quizState.questions.length}`;
}

// Progress management
function saveProgress() {
    localStorage.setItem(`quiz_progress_${quizState.lessonSlug}`, JSON.stringify({
        currentIndex: quizState.currentQuestionIndex,
        score: quizState.score,
        answers: quizState.userAnswers
    }));
}

function loadProgress() {
    const savedData = localStorage.getItem(`quiz_progress_${quizState.lessonSlug}`);
    if (savedData) {
        const { currentIndex, score, answers } = JSON.parse(savedData);
        quizState.currentQuestionIndex = currentIndex;
        quizState.score = score;
        quizState.userAnswers = answers;
    }
}

function resetProgress() {
    localStorage.removeItem(`quiz_progress_${quizState.lessonSlug}`);
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.userAnswers = {};
}

// AI Tutor integration
function setupAITutor() {
    initAITutor({ 
        getLessonContext: () => ({ 
            title: `Quiz: ${quizState.lessonSlug.replace(/-/g, ' ')}`,
            slug: quizState.lessonSlug,
            summary: `Contains ${quizState.questions.length} questions. Current score: ${quizState.score}/${quizState.questions.length}`
        })
    });
}

// Event listeners
elements.nextButton.addEventListener('click', () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        quizState.currentQuestionIndex++;
        renderQuestion();
    } else {
        showFinalResults();
    }
});

elements.backButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `lesson.html?lesson=${quizState.lessonSlug}`;
});

// Reset button handler
document.getElementById('restart-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to restart this quiz?')) {
        resetProgress();
        quizState.currentQuestionIndex = 0;
        quizState.score = 0;
        quizState.userAnswers = {};
        elements.quizContainer.style.display = 'block';
        elements.finalScoreContainer.style.display = 'none';
        renderQuestion();
    }
});
