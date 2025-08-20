// =================================================================
//   NUB MED Portal - Lesson Page Logic (Final & Integrated Version)
// =================================================================
import { getLessonContent, getQuizData, getFlashcardData } from './github.js';
import { initQuiz } from './quiz.js';
import { initAITutor } from './ai-tutor.js';
import { initFlashcards } from './flashcards.js';

// Global object to hold lesson data for other modules
window.currentLesson = {};

document.addEventListener('DOMContentLoaded', () => {
    // A wrapper to catch any critical errors during setup
    try {
        const params = new URLSearchParams(window.location.search);
        const lessonId = params.get('lesson');

        if (!lessonId) {
            throw new Error("Lesson ID is missing from the URL.");
        }

        // Setup the back button link
        const year = params.get('year');
        const specialty = params.get('specialty');
        const backLink = document.getElementById('back-link-lesson');
        if (backLink && year && specialty) {
            backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
        }

        // Load all content and initialize all interactive modules
        loadAllModules(lessonId);
        initAITutor({ getLessonContext });

    } catch (error) {
        console.error("A critical error occurred during page initialization:", error);
        const contentEl = document.getElementById('lesson-content');
        if (contentEl) {
            contentEl.innerHTML = `<p style="color: red; text-align: center;">A critical error occurred. Please check the console for details.</p>`;
        }
    }
});

/**
 * Fetches all necessary data and initializes the corresponding modules.
 * @param {string} lessonId - The unique slug for the lesson.
 */
async function loadAllModules(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');

    // Fetch lesson, quiz, and flashcard data all at once for speed
    const [markdownContent, quizData, flashcardData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId),
        getFlashcardData(lessonId)
    ]);

    // 1. Render the main lesson content
    if (markdownContent) {
        const cleanMarkdown = markdownContent.replace(/^---\s*[\s\S]*?---\s*/, '').trim();
        const titleMatch = cleanMarkdown.match(/^#\s+(.*)/);
        const lessonTitle = titleMatch ? titleMatch[1] : lessonId.replace(/-/g, ' ');

        // Store data globally for the AI Tutor to access
        window.currentLesson.title = lessonTitle;
        window.currentLesson.content = cleanMarkdown;

        titleEl.textContent = lessonTitle;
        contentEl.innerHTML = marked.parse(cleanMarkdown);
    } else {
        // If lesson content fails to load, stop everything
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p style="color: red;">Could not load lesson content.</p>';
        throw new Error(`Failed to load lesson content for slug: ${lessonId}`);
    }

    // 2. Initialize the Quiz system if data exists
    if (quizData && quizData.items && quizData.items.length > 0) {
        window.currentLesson.quiz = quizData.items;
        initQuiz(quizData.items, lessonId);
    }

    // 3. Initialize the Flashcards system if data exists
    if (flashcardData && flashcardData.cards && flashcardData.cards.length > 0) {
        initFlashcards(flashcardData.cards);
    }
}

/**
 * Provides the full context of the lesson to the AI Tutor.
 * @returns {object}
 */
function getLessonContext() {
    return {
        title: window.currentLesson.title || '',
        slug: new URLSearchParams(location.search).get('lesson') || '',
        content: window.currentLesson.content || '',
        quiz: window.currentLesson.quiz || []
    };
}
