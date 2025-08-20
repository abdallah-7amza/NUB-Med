// =================================================================
//   NUB MED Portal - Definitive Lesson Page Logic (lesson.js)
// =================================================================
import { getLessonContent, getQuizData } from './github.js';
import { initQuiz } from './quiz.js';
import { initAITutor } from './ai-tutor.js';

// A global object to hold the current lesson's data for the AI Tutor to access.
window.currentLesson = {};

/**
 * This is the entry point function that runs after the page has loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    // Ensure a lesson ID is present in the URL.
    if (!lessonId) {
        contentEl.innerHTML = '<p style="color: red; text-align: center;">Error: Lesson ID is missing in the URL.</p>';
        return;
    }

    // Correctly set the "Back" button's link.
    const backLink = document.getElementById('back-link-lesson');
    if (backLink && year && specialty) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }

    // Load the lesson content and the quiz.
    loadLessonAndQuiz(lessonId);
    
    // Initialize and set up the AI Tutor.
    initAITutor({ getLessonContext });
});

/**
 * Fetches, processes, and displays the lesson and quiz content.
 * @param {string} lessonId - The unique ID (slug) of the lesson.
 */
async function loadLessonAndQuiz(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    
    // Request both the lesson and quiz files simultaneously for faster loading.
    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId)
    ]);

    // 1. Display the lesson content.
    if (markdownContent) {
        // Safely remove the metadata block from the top of the markdown file.
        const cleanMarkdown = markdownContent.replace(/^---\s*[\s\S]*?---\s*/, '').trim();
        
        // Attempt to find the main title from the first H1 tag (e.g., # Lesson Title).
        const titleMatch = cleanMarkdown.match(/^#\s+(.*)/);
        const lessonTitle = titleMatch ? titleMatch[1] : lessonId.replace(/-/g, ' ');

        // Store all necessary info in the global variable for the AI to read.
        window.currentLesson.title = lessonTitle;
        window.currentLesson.summary = ''; // Summary is not reliably available without metadata parsing.
        window.currentLesson.content = cleanMarkdown; // Store the full, clean lesson content.
        
        // Display the title and render the markdown content as HTML.
        titleEl.textContent = lessonTitle;
        contentEl.innerHTML = marked.parse(cleanMarkdown);
    } else {
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p style="color: red;">Could not load lesson content.</p>';
    }

    // 2. Initialize the advanced quiz system.
    if (quizData && quizData.items && quizData.items.length > 0) {
        // Also store the quiz questions for the AI to read.
        window.currentLesson.quiz = quizData.items;
        
        // Start the quiz system with the loaded questions.
        initQuiz(quizData.items, lessonId);
    }
}

/**
 * Provides the full context of the current lesson to the AI Tutor.
 * @returns {object} An object containing all relevant data about the lesson.
 */
function getLessonContext() {
    return {
        title: window.currentLesson.title || '',
        summary: window.currentLesson.summary || '',
        slug: new URLSearchParams(location.search).get('lesson') || '',
        content: window.currentLesson.content || '', // Provide the full lesson content.
        quiz: window.currentLesson.quiz || []       // Provide all quiz questions.
    };
}
