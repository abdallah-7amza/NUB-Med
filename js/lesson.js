// The NEW and FINAL version of js/lesson.js
import { getLessonContent, getQuizData } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    // URL Parameters
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson'); 
    const year = params.get('year');
    const specialty = params.get('specialty');

    // Page Elements
    const contentEl = document.getElementById('lesson-content');
    const loaderEl = document.getElementById('loader');

    // Check for required parameters
    if (!lessonId || !year || !specialty) {
        if(loaderEl) loaderEl.style.display = 'none';
        contentEl.innerHTML = '<p style="color: red;">Error: Lesson details are missing in the URL.</p>';
        return;
    }

    // Load lesson content
    loadLesson(year, specialty, lessonId);

    // AI Tutor Logic (NEWLY ADDED)
    const tutorFab = document.getElementById('ai-tutor-fab');
    const chatOverlay = document.getElementById('chat-overlay');
    const closeChatBtn = document.getElementById('close-chat-btn');

    if (tutorFab && chatOverlay && closeChatBtn) {
        tutorFab.addEventListener('click', () => {
            chatOverlay.style.display = 'flex';
        });
        closeChatBtn.addEventListener('click', () => {
            chatOverlay.style.display = 'none';
        });
    }
});

async function loadLesson(year, specialty, lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const loaderEl = document.getElementById('loader');

    // Fetch the raw markdown content
    const markdownContent = await getLessonContent(year, specialty, lessonId);
    
    // HIDE THE LOADER (FIX)
    if (loaderEl) loaderEl.style.display = 'none';

    if (markdownContent) {
        // Use marked.js library to convert Markdown to HTML
        contentEl.innerHTML = marked.parse(markdownContent);
        
        // Set the page title from the first H1 tag in the content
        const firstHeader = contentEl.querySelector('h1');
        if (firstHeader) {
            titleEl.textContent = firstHeader.textContent;
            firstHeader.remove(); // Optional: remove the title to avoid repetition
        } else {
            titleEl.textContent = lessonId.replace(/-/g, ' ');
        }
    } else {
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p style="color: red;">Could not load the lesson content.</p>';
    }
}
