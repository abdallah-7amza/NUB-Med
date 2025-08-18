// The FINAL, COMPLETE, and PROFESSIONAL version of js/lesson.js
import { getLessonContent, getQuizData } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson'); 
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

    loadLessonAndQuiz(lessonId);
    setupAITutor();
});

/**
 * Loads and renders both lesson and quiz content.
 */
async function loadLessonAndQuiz(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const quizContainer = document.getElementById('quiz-container');

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

    // Render Quiz - FINAL FIX
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

    // Replace the icon with a professional SVG
    tutorFab.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9.4 12.4L8 11l-1.4 1.4L5.2 11l-1.4 1.4L2.4 11l1.4-1.4L2.4 8.2l1.4-1.4L5.2 8.2l1.4-1.4L8 8.2l1.4-1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4zm6.6.6h-5v-2h5v2zm0-3h-5v-2h5v2z"/>
        </svg>`;
    
    const sendBtn = document.getElementById('chat-send-btn');
    sendBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>`;

    // Open/Close functionality with animation
    tutorFab.addEventListener('click', () => { 
        chatOverlay.style.display = 'flex';
        setTimeout(() => chatOverlay.classList.add('visible'), 10);
    });
    closeChatBtn.addEventListener('click', () => { 
        chatOverlay.classList.remove('visible');
        setTimeout(() => chatOverlay.style.display = 'none', 200);
    });

    // Handle form submission - FINAL FIX
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevents page reload
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addChatMessage(userMessage, 'user');
        chatInput.value = ''; // Clear input

        // Simulate AI Tutor thinking and responding
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
        return msgDiv; // Return the message element to update it later
    }
}
