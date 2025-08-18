// FINAL SYNCHRONIZED VERSION
import { getLessonContent, getQuizData } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson'); // The unique ID (slug) from the URL
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    if (!lessonId) {
        contentEl.innerHTML = '<p style="color: red; text-align: center;">Error: Lesson ID is missing in the URL.</p>';
        return;
    }

    const backLink = document.getElementById('back-link-lesson');
    if (backLink && year && specialty) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }

    loadLessonAndQuiz(lessonId); // Call the main function with just the ID
    setupAITutor();
});

/**
 * Loads and renders lesson and quiz content using only the lessonId.
 */
async function loadLessonAndQuiz(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const quizContainer = document.getElementById('quiz-container');

    // CORRECTED: Call the functions with the correct, single argument (lessonId)
    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId)
    ]);
    
    // Render Lesson
    if (markdownContent) {
        contentEl.innerHTML = marked.parse(markdownContent);
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

    // Render Quiz
    if (quizData && quizData.items && quizData.items.length > 0) {
        quizContainer.style.display = 'block';
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
 * Sets up all functionality for the AI Tutor chat window.
 */
function setupAITutor() {
    const tutorFab = document.getElementById('ai-tutor-fab');
    const chatOverlay = document.getElementById('chat-overlay');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    tutorFab.addEventListener('click', () => { 
        chatOverlay.style.display = 'flex';
        setTimeout(() => chatOverlay.classList.add('visible'), 10);
    });
    closeChatBtn.addEventListener('click', () => { 
        chatOverlay.classList.remove('visible');
        setTimeout(() => chatOverlay.style.display = 'none', 200);
    });

    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

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
