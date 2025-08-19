// The FINAL, COMPLETE version of js/lesson.js with API Key logic restored.
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
// THIS IS THE FIX: Remove the metadata block before parsing
        const cleanMarkdown = markdownContent.replace(/^---\s*[\s\S]*?---\s*/, '').trim();
        contentEl.innerHTML = marked.parse(cleanMarkdown); // Use the cleaned content        const firstHeader = contentEl.querySelector('h1');
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
    const API_KEY_STORAGE_ID = 'ai_tutor_api_key'; // Define a constant for the key

    // Open/Close functionality
    tutorFab.addEventListener('click', () => { 
        chatOverlay.style.display = 'flex';
        setTimeout(() => chatOverlay.classList.add('visible'), 10);
    });
    closeChatBtn.addEventListener('click', () => { 
        chatOverlay.classList.remove('visible');
        setTimeout(() => chatOverlay.style.display = 'none', 200);
    });

    // Handle form submission - FINAL FIX with API Key Logic
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevents page reload
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // --- API KEY LOGIC RESTORED ---
        let apiKey = localStorage.getItem(API_KEY_STORAGE_ID);

        if (!apiKey) {
            apiKey = prompt("To use the AI Tutor, please enter your API Key. It will be saved securely in this browser for future use.");
            if (apiKey && apiKey.trim() !== '') {
                localStorage.setItem(API_KEY_STORAGE_ID, apiKey);
            } else {
                alert("An API Key is required to use this feature. Please try again.");
                return; // Stop if user cancels or enters nothing
            }
        }
        // --- END OF API KEY LOGIC ---

        addChatMessage(userMessage, 'user');
        chatInput.value = '';

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
        return msgDiv;
    }
}
