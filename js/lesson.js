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
    }

    async init() {
        if (!this.year || !this.specialty || !this.lessonId) {
            this.contentEl.innerHTML = '<p>Error: Missing lesson details in URL.</p>';
            return;
        }

        this.titleEl.textContent = `${this.capitalize(this.lessonId.replace(/_/g, ' '))}`;
        this.backLink.href = `lessons-list.html?year=${this.year}&specialty=${this.specialty}`;

        await this.loadLesson();
        await this.loadQuiz();
        
        // Initialize AI Tutor after content is loaded
        new AiTutor(this);

        this.restartQuizBtn.addEventListener('click', () => this.startQuiz());
    }
    
    capitalize(str) {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    async loadLesson() {
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
        if (this.quizData && this.quizData.questions.length > 0) {
            this.quizContainerEl.style.display = 'block';
            this.startQuiz();
        }
    }
    
    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizResultsEl.style.display = 'none';
        this.quizContentEl.style.display = 'block';
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentQuestionIndex >= this.quizData.questions.length) {
            this.showResults();
            return;
        }

        const question = this.quizData.questions[this.currentQuestionIndex];
        let optionsHtml = question.options.map((option, index) =>
            `<button class="quiz-option-btn" data-index="${index}">${option}</button>`
        ).join('');

        this.quizContentEl.innerHTML = `
            <div class="quiz-question">
                <p><strong>Question ${this.currentQuestionIndex + 1}/${this.quizData.questions.length}:</strong></p>
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
        const selectedIndex = parseInt(event.target.dataset.index);
        const question = this.quizData.questions[this.currentQuestionIndex];
        const buttons = this.quizContentEl.querySelectorAll('.quiz-option-btn');
        const explanationEl = this.quizContentEl.querySelector('.explanation');
        
        buttons.forEach(btn => btn.disabled = true); // Disable all buttons

        if (selectedIndex === question.answerIndex) {
            event.target.classList.add('correct');
            this.score++;
        } else {
            event.target.classList.add('incorrect');
            buttons[question.answerIndex].classList.add('correct');
        }

        if (question.explanation) {
            explanationEl.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
            explanationEl.style.display = 'block';
        }
        
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }, 2000); // Wait 2 seconds before next question
    }
    
    showResults() {
        this.quizContentEl.style.display = 'none';
        this.quizResultsEl.style.display = 'block';
        const percentage = Math.round((this.score / this.quizData.questions.length) * 100);
        this.scoreEl.textContent = `${this.score} / ${this.quizData.questions.length} (${percentage}%)`;
        this.scoreProgressBarEl.style.width = `${percentage}%`;
    }

    // Method for AI Tutor to get context
    getCurrentContext() {
        // Simple context: just the lesson title and content for now.
        // Can be expanded to include current quiz question.
        return `Lesson: ${this.titleEl.textContent}\n\nContent:\n${this.currentLessonContent}`;
    }
}

new LessonPage();
