// The FINAL and COMPLETE version of js/lesson.js
import { getLessonContent, getQuizData } from './github.js';

// --- Main Function: Runs when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson'); 
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');
    const loaderEl = document.getElementById('loader');

    if (!lessonId || !year || !specialty) {
        if(loaderEl) loaderEl.style.display = 'none';
        contentEl.innerHTML = '<p style="color: red;">Error: Lesson details missing.</p>';
        return;
    }

    loadLessonAndQuiz(year, specialty, lessonId);
    setupAITutor();
});


// --- 1. Lesson and Quiz Loading ---
async function loadLessonAndQuiz(year, specialty, lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const loaderEl = document.getElementById('loader');
    const quizContainer = document.getElementById('quiz-container');

    // Fetch both lesson and quiz data at the same time
    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(year, specialty, lessonId),
        getQuizData(year, specialty, lessonId)
    ]);
    
    if (loaderEl) loaderEl.style.display = 'none';

    // Display Lesson Content
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

    // Display Quiz if it exists
    if (quizData && quizData.items && quizData.items.length > 0) {
        quizContainer.style.display = 'block';
        renderQuiz(quizData.items);
    }
}

function renderQuiz(questions) {
    const quizContentEl = document.getElementById('quiz-content');
    quizContentEl.innerHTML = ''; // Clear previous questions
    questions.forEach((q, index) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'quiz-question';
        let optionsHtml = q.options.map(opt => `
            <label>
                <input type="radio" name="question${index}" value="${opt.id}">
                ${opt.text}
            </label>
        `).join('');

        questionEl.innerHTML = `
            <p>${index + 1}. ${q.stem}</p>
            <div class="quiz-options">${optionsHtml}</div>
        `;
        quizContentEl.appendChild(questionEl);
    });
}


// --- 2. AI Tutor Functionality ---
function setupAITutor() {
    const tutorFab = document.getElementById('ai-tutor-fab');
    const chatOverlay = document.getElementById('chat-overlay');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const API_KEY_STORAGE = 'user_openai_api_key';

    // Open/Close Chat Window
    tutorFab.addEventListener('click', () => { chatOverlay.style.display = 'flex'; });
    closeChatBtn.addEventListener('click', () => { chatOverlay.style.display = 'none'; });

    // Handle sending a message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        
        // 1. Check for API Key
        let apiKey = localStorage.getItem(API_KEY_STORAGE);
        if (!apiKey) {
            apiKey = prompt("Please enter your OpenAI API Key. It will be saved in your browser for future use.");
            if (apiKey) {
                localStorage.setItem(API_KEY_STORAGE, apiKey);
            } else {
                alert("API Key is required to use the AI Tutor.");
                return;
            }
        }

        // 2. Display user message and clear input
        addChatMessage(userMessage, 'user');
        chatInput.value = '';

        // 3. (Placeholder) Call the real AI API here
        // For now, it just shows a placeholder response.
        callAI(userMessage, apiKey);
    });

    function addChatMessage(message, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = message;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function callAI(message, key) {
        // This is a placeholder. You would replace this with a real fetch call to an AI service.
        addChatMessage("Thinking...", 'tutor');
        setTimeout(() => {
            const thinkingMsg = chatMessages.lastChild;
            thinkingMsg.textContent = "AI response functionality is not yet connected. This is where the AI's answer would appear.";
        }, 1000);
    }
}
