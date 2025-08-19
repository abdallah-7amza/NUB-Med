// The final, corrected, and integrated version of js/lesson.js
import { getLessonContent, getQuizData } from './github.js';

// --- Global variables for the new quiz system ---
let quizItems = [];
let userAnswers = {};
let lessonId = '';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    // Use a different variable name to avoid conflict with the global lessonId
    const currentLessonId = params.get('lesson'); 
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    if (!currentLessonId) {
        contentEl.innerHTML = '<p style="color: red; text-align: center;">Error: Lesson ID is missing in the URL.</p>';
        return;
    }

    const backLink = document.getElementById('back-link-lesson');
    if (backLink && year && specialty) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }

    // Call the main functions
    loadLessonAndQuiz(currentLessonId);
    setupAITutor();
});

async function loadLessonAndQuiz(currentLessonId) {
    // Set the global lessonId for the quiz system to use
    lessonId = currentLessonId;

    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const quizContainer = document.getElementById('quiz-container');

    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId)
    ]);

    // 1. Render Lesson Content (with metadata fix)
    if (markdownContent) {
        const cleanMarkdown = markdownContent.replace(/^---\s*[\s\S]*?---\s*/, '').trim();
        contentEl.innerHTML = marked.parse(cleanMarkdown);
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

    // 2. Initialize the Interactive Quiz if it exists
    if (quizData && quizData.items && quizData.items.length > 0) {
        quizContainer.style.display = 'block';
        initQuiz(quizData.items);
    }
}

// --- NEW INTERACTIVE QUIZ SYSTEM ---





        const optionsHtml = question.options.map(option => {
            let labelClass = '';
            if (isAnswered) {
                if (option.id === question.correct) {
                    labelClass = 'correct';
                } else if (option.id === userAnswerId) {
                    labelClass = 'incorrect';
                }
            }
            return `
                <label class="${labelClass}">
                    <input type="radio" name="question-${index}" value="${option.id}" ${isAnswered ? 'disabled' : ''} ${userAnswerId === option.id ? 'checked' : ''}>
                    <span>${option.text}</span>
                </label>
            `;
        }).join('');

        questionDiv.innerHTML = `
            <p><strong>${index + 1}. ${question.stem}</strong></p>
            <div class="quiz-options">${optionsHtml}</div>
        `;
        quizContentEl.appendChild(questionDiv);
    });

    document.querySelectorAll('.quiz-options input[type="radio"]:not(:disabled)').forEach(input => {
        input.addEventListener('change', handleOptionSelect);
    });

    updateUI();
}




    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = quizItems.length;
    scoreEl.textContent = `Score: ${score} / ${totalQuestions}`;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    progressValueEl.style.width = `${progressPercent}%`;
    resetButton.style.display = answeredCount > 0 ? 'inline-block' : 'none';
}

function getStorageKey() {
    return `quiz_progress_${lessonId}`;
}

function saveProgress() {
    localStorage.setItem(getStorageKey(), JSON.stringify(userAnswers));
}

function loadProgress() {
    const savedData = localStorage.getItem(getStorageKey());
    userAnswers = savedData ? JSON.parse(savedData) : {};
}



/**
 * Sets up all functionality for the AI Tutor chat window.
 * This function is untouched and will work as before.
 */
function setupAITutor() {
    const tutorFab = document.getElementById('ai-tutor-fab');
    const chatOverlay = document.getElementById('chat-overlay');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const API_KEY_STORAGE_ID = 'ai_tutor_api_key';

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

        let apiKey = localStorage.getItem(API_KEY_STORAGE_ID);
        if (!apiKey) {
            apiKey = prompt("To use the AI Tutor, please enter your API Key. It will be saved securely in this browser for future use.");
            if (apiKey && apiKey.trim() !== '') {
                localStorage.setItem(API_KEY_STORAGE_ID, apiKey);
            } else {
                alert("An API Key is required to use this feature. Please try again.");
                return;
            }
        }

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
