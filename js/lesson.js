// =================================================================
//   NUB MED Portal - Lesson Page Logic (Final & Robust Version)
// =================================================================
import { initFlashcards } from './flashcards.js';
import { getLessonContent, getQuizData } from './github.js';
import { initQuiz } from './quiz.js';
import { initAITutor } from './ai-tutor.js';

window.currentLesson = {}; // Global object for AI context

document.addEventListener('DOMContentLoaded', () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const lessonId = params.get('lesson');

        if (!lessonId) {
            throw new Error("Lesson ID is missing from the URL.");
        }

        const year = params.get('year');
        const specialty = params.get('specialty');
        const backLink = document.getElementById('back-link-lesson');
        if (backLink && year && specialty) {
            backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
        }

        loadLessonAndQuiz(lessonId);
        initAITutor({ getLessonContext });

    } catch (error) {
        console.error("A critical error occurred during page initialization:", error);
        const contentEl = document.getElementById('lesson-content');
        if (contentEl) {
            contentEl.innerHTML = `<p style="color: red; text-align: center;">A critical error occurred. Please check the console for details.</p>`;
        }
    }
});

async function loadLessonAndQuiz(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');

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

        titleEl.textContent = lessonTitle;
        contentEl.innerHTML = marked.parse(cleanMarkdown);
    } else {
        throw new Error(`Failed to load lesson content for slug: ${lessonId}`);
    }

    if (quizData && quizData.items && quizData.items.length > 0) {
        window.currentLesson.quiz = quizData.items;
        initQuiz(quizData.items, lessonId);
    }
// هذا الكود الجديد يضاف قبل نهاية الدالة
if (flashcardData && flashcardData.cards && flashcardData.cards.length > 0) {
    initFlashcards(flashcardData.cards);
}

function getLessonContext() {
    return {
        title: window.currentLesson.title || '',
        slug: new URLSearchParams(location.search).get('lesson') || '',
        content: window.currentLesson.content || '',
        quiz: window.currentLesson.quiz || []
    };
}
