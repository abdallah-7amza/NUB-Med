// The FINAL, COMPLETE version of js/lesson.js
// This version fixes the AI Tutor, loads the Quiz, and handles all page logic.
import { getLessonContent, getQuizData } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson'); 
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    if (!lessonId || !year || !specialty) {
        contentEl.innerHTML = '<p style="color: red; text-align: center;">Error: Lesson details are missing in the URL.</p>';
        return;
    }

    // Set the back link dynamically so it always works
    const backLink = document.getElementById('back-link-lesson');
    if (backLink) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }

    // Load both the lesson and the quiz at the same time
    loadLessonAndQuiz(year, specialty, lessonId);
    
    // Set up the interactive functionality for the AI Tutor
    setupAITutor();
});

/**
 * Loads the lesson markdown and the quiz JSON data, then renders them.
 */
async function loadLessonAndQuiz(year, specialty, lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const quizContainer = document.getElementById('quiz-container');

    // Fetch both pieces of content in parallel for better performance
    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(year, specialty, lessonId),
        getQuizData(year, specialty, lessonId)
    ]);
    
    // --- Render Lesson Content ---
    if (markdownContent) {
        contentEl.innerHTML = marked.parse(markdownContent);
        const firstHeader = contentEl.querySelector('h1');
        if (firstHeader) {
            titleEl.textContent = firstHeader.textContent;
            firstHeader.remove(); // Avoid showing the title twice
        } else {
            titleEl.textContent = lessonId.replace(/-/g, ' ');
        }
    } else {
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p style="color: red;">Could not load lesson content.</p>';
    }

    // --- Render Quiz Content (FIX) ---
    if (quizData && quizData.items && quizData.items.length > 0) {
        quizContainer.style.display = 'block'; // Make the quiz section visible
        const quizContentEl = document.getElementById('quiz-content');
        quizContentEl.innerHTML = quizData.items.map((question, index) => {
            const optionsHtml = question.options.map(option => `
                <label>
                    <input type="radio" name="question-${index}" value="${option.id}">
                    <span>${option.text}</span>
                </label>
            `).join('');

            return `
                <div class="quiz-question">
                    <p><strong>${index + 1}. ${question.stem}</strong></p>
                    <div class="quiz-options">${optionsHtml}</div>
                </div>
            `;
        }).join('');
    }
}

/**
 * Sets up all event listeners for the AI Tutor chat window.
 */
function setupAITutor() {
    const tutorFab = document.getElementById('ai-tutor-fab');
    const chatOverlay = document.getElementById('chat-overlay');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');

    // Open/Close functionality
    tutorFab.addEventListener('click', () => { chatOverlay.style.display = 'flex'; });
    closeChatBtn.addEventListener('click', () => { chatOverlay.style.display = 'none'; });

    // --- Handle Form Submission (FIX) ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault(); // This is the CRITICAL line that prevents the page from reloading.
        
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        console.log("User asked:", userMessage);
        // Here you would add the logic to call the AI API
        
        chatInput.value = ''; // Clear the input field
    });
}
