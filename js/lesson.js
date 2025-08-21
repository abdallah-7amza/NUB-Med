import { getLessonContent, getQuizData, getFlashcardData } from './github.js';
import { initQuiz } from './quiz.js';
import { initFlashcards } from './flashcards.js';
import { initAITutor } from './ai-tutor.js';

window.currentLesson = {};

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    // NEW: Get the path from the URL to enable the smart "Back" button
    const returnPath = params.get('path'); 

    if (!lessonId) {
        document.body.innerHTML = '<p style="text-align:center; padding-top: 2rem; font-size: 1.2rem;">Error: Lesson ID is missing.</p>';
        return;
    }

    // NEW: Make the "Back" button smart
    const backLink = document.getElementById('back-link-lesson');
    if (backLink && returnPath) {
        // Link back to the correct place in the browser hierarchy
        backLink.href = `browser.html?path=${returnPath}`;
    } else if (backLink) {
        // Fallback to the root browser page if no path is provided for some reason
        backLink.href = 'browser.html';
    }

    loadAllData(lessonId);
    initAITutor({ getLessonContext });
});

async function loadAllData(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    
    // This part remains the same, it fetches all data in parallel.
    const [markdownContent, quizData, flashcardData] = await Promise.all([
        getLessonContent(lessonId), 
        getQuizData(lessonId), 
        getFlashcardData(lessonId)
    ]);

    if (markdownContent) {
        const cleanMarkdown = markdownContent.replace(/^---\s*[\s\S]*?---\s*/, '').trim();
        const titleMatch = cleanMarkdown.match(/^#\s+(.*)/);
        const lessonTitle = titleMatch ? titleMatch[1] : lessonId.replace(/-/g, ' ');
        window.currentLesson.title = lessonTitle;
        window.currentLesson.content = cleanMarkdown;
        if(titleEl) titleEl.textContent = lessonTitle;
        if(contentEl) contentEl.innerHTML = marked.parse(cleanMarkdown);
    } else {
        if(titleEl) titleEl.textContent = 'Error';
        if(contentEl) contentEl.innerHTML = '<p>Could not load lesson content.</p>';
    }

    // Conditionally initialize the quiz if its data exists
    if (quizData && quizData.items && quizData.items.length > 0) {
        window.currentLesson.quiz = quizData.items;
        initQuiz(quizData.items, lessonId);
    }
    
    // Conditionally initialize flashcards if their data exists
    if (flashcardData && flashcardData.items && flashcardData.items.length > 0) {
        initFlashcards(flashcardData.items);
    }
}

function getLessonContext() {
    return {
        title: window.currentLesson.title || '',
        slug: new URLSearchParams(location.search).get('lesson') || '',
        content: window.currentLesson.content || '',
        quiz: window.currentLesson.quiz || []
    };
}
