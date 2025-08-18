import { getLessonContent, getQuizData } from './github.js';
import { AiTutor } from './ai.js';

class LessonPage {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
        this.year = this.params.get('year');
        this.specialty = this.params.get('specialty');
        this.lessonId = this.params.get('lesson');

        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizData = null;
        this.currentLessonContent = "";
        this.quizMode = 'practice'; // 'practice' or 'exam'

        this.cacheDOMElements();
        this.init();
    }

    cacheDOMElements() {
        this.titleEl = document.getElementById('lesson-title');
        this.contentEl = document.getElementById('lesson-content');
        this.quizContainerEl = document.getElementById('quiz-container');
        this.quizContentEl = document.getElementById('quiz-content');
        this.quizResultsEl = document.getElementById('quiz-results');
        this.scoreEl = document.getElementById('score');
        this.scoreProgressBarEl = document.getElementById('score-progress-bar');
        this.restartQuizBtn = document.getElementById('restart-quiz-btn');
        this.backLink = document.getElementById('back-to-lessons');
        this.practiceModeBtn = document.getElementById('practice-mode-btn');
        this.examModeBtn = document.getElementById('exam-mode-btn');
    }

    async init() {
        if (!this.year || !this.specialty || !this.lessonId) {
            this.contentEl.innerHTML = '<p>Error: Missing lesson details in URL.</p>';
            return;
        }

        this.titleEl.textContent = `${this.capitalize(this.lessonId.replace(/_/g, ' '))}`;
        this.backLink.href = `lessons-list.html?year=${this.year}&specialty=${this.specialty}`;

        this.bindEvents();

        await this.loadLesson();
        await this.loadQuiz();
        
        // This will now run correctly
        new AiTutor(this);
    }
    
    bindEvents() {
        this.restartQuizBtn.addEventListener('click', () => this.startQuiz());
        this.practiceModeBtn.addEventListener('click', () => this.setQuizMode('practice'));
        this.examModeBtn.addEventListener('click', () => this.setQuizMode('exam'));
    }

    capitalize(str) {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    async loadLesson() {
        // In a real app, fetch lesson details from the index first
        const markdown = await getLessonContent(this.year, this.specialty, this.lessonId);
        if (markdown) {
            this.currentLessonContent = markdown;
            this.contentEl.innerHTML = marked.parse(markdown);
        } else {
            this.contentEl.innerHTML = '<p>Lesson content could not be loaded.</p>';
        }
    }

    async loadQuiz() {
        this.quizData = await getQuizData(this.year, this.specialty, this.lessonId);
        // CORRECTED LINE: using 'items' instead of 'questions'
        if (this.quizData && this.quizData.items && this.quizData.items.length > 0) {
            this.quizContainerEl.style.display = 'block';
            this.startQuiz();
        }
    }
    
    setQuizMode(mode) {
        this.quizMode = mode;
        this.practiceModeBtn.classList.toggle('active', mode === 'practice');
        this.examModeBtn.classList.toggle('active', mode === 'exam');
        this.startQuiz(); // Restart quiz when mode changes
    }

    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizResultsEl.style.display = 'none';
        this.quizContentEl.style.display = 'block';
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentQuestionIndex >= this.quizData.items.length) {
            this.showResults();
            return;
        }

        const question = this.quizData.items[this.currentQuestionIndex];
        // Shuffle options to prevent position bias
        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);

        let optionsHtml = shuffledOptions.map(option =>
            `<button class="quiz-option-btn" data-id="${option.id}">${option.text}</button>`
        ).join('');

        this.quizContentEl.innerHTML = `
            <div class="quiz-question">
                <p><strong>Question ${this.currentQuestionIndex + 1}/${this.quizData.items.length}:</strong></p>
                <p>${question.stem}</p>
                <div class="quiz-options">${optionsHtml}</div>
                <div class="explanation" style="display: none;"></div>
            </div>
        `;
        
        this.quizContentEl.querySelectorAll('.quiz-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.checkAnswer(e));
        });
    }

    checkAnswer(event) {
        const selectedId = event.target.dataset.id;
        const question = this.quizData.items[this.currentQuestionIndex];
        const correctIds = new Set(question.correct);

        const buttons = this.quizContentEl.querySelectorAll('.quiz-option-btn');
        const explanationEl = this.quizContentEl.querySelector('.explanation');
        
        buttons.forEach(btn => btn.disabled = true);

        let isCorrect = correctIds.has(selectedId);

        if (isCorrect) {
            event.target.classList.add('correct');
            this.score++;
        } else {
            event.target.classList.add('incorrect');
        }

        if (this.quizMode === 'practice' || !isCorrect) {
            buttons.forEach(btn => {
                if (correctIds.has(btn.dataset.id)) {
                    btn.classList.add('correct');
                }
            });

            if (question.explanation) {
                explanationEl.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
                explanationEl.style.display = 'block';
            }
        }
        
        const delay = (this.quizMode === 'practice' || !isCorrect) ? 2500 : 800;
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }, delay);
    }
    
    showResults() {
        this.quizContentEl.style.display = 'none';
        this.quizResultsEl.style.display = 'block';
        const percentage = Math.round((this.score / this.quizData.items.length) * 100);
        this.scoreEl.textContent = `${this.score} / ${this.quizData.items.length} (${percentage}%)`;
        this.scoreProgressBarEl.style.width = `${percentage}%`;
    }

    getCurrentContext() {
        return `Lesson: ${this.titleEl.textContent}\n\nSummary:\n${this.currentLessonContent.substring(0, 1500)}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LessonPage();
});
