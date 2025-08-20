import { getLessonContent, getQuizData, getFlashcardData } from './github.js';
import { initQuiz } from './quiz.js';
import { initFlashcards } from './flashcards.js';
import { initAITutor } from './ai-tutor.js';

window.currentLesson = {};

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    const year = params.get('year');
    const specialty = params.get('specialty');
    if (!lessonId) {
        document.body.innerHTML = '<p style="text-align:center; padding-top: 2rem; font-size: 1.2rem;">Error: Lesson ID is missing.</p>';
        return;
    }
    const backLink = document.getElementById('back-link-lesson');
    if (backLink && year && specialty) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }
    loadAllData(lessonId);
    initAITutor({ getLessonContext });
});

async function loadAllData(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const [markdownContent, quizData, flashcardData] = await Promise.all([
        getLessonContent(lessonId), getQuizData(lessonId), getFlashcardData(lessonId)
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

    if (quizData && quizData.items && quizData.items.length > 0) {
        window.currentLesson.quiz = quizData.items;
        initQuiz(quizData.items, lessonId);
    }
    
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
