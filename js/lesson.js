// =================================================================
//   NUB MED Portal - Final Lesson Page Logic (lesson.js)
// =================================================================
import { getLessonContent, getQuizData } from './github.js';
import { initQuiz } from './quiz.js';
import { initAITutor } from './ai-tutor.js';

// This global object will hold the lesson's data so the AI Tutor can access it.
window.currentLesson = {};

/**
 * This is the main function that runs after the page has finished loading.
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    // Make sure there is a lesson ID in the URL.
    if (!lessonId) {
        contentEl.innerHTML = '<p style="color: red; text-align: center;">Error: Lesson ID is missing in the URL.</p>';
        return;
    }

    // Set up the "Back" button link correctly.
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
 * This function fetches the lesson and quiz files from the server.
 * @param {string} lessonId - The unique ID of the lesson (the slug).
 */
async function loadLessonAndQuiz(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    
    // Request both files at the same time to make loading faster.
    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId)
    ]);

    // 1. Display the lesson content on the page.
    if (markdownContent) {
        // Use the 'matter' library to separate the metadata (like the title) from the actual lesson content.
        const { data, content } = matter(markdownContent);
        
        // Store all important lesson info in the global variable for the AI to read.
        window.currentLesson.title = data.title || lessonId.replace(/-/g, ' ');
        window.currentLesson.summary = data.summary || 'No summary available.';
        window.currentLesson.content = content; // Store the full lesson content.
        
        // Display the title and the lesson content on the page.
        titleEl.textContent = window.currentLesson.title;
        contentEl.innerHTML = marked.parse(content);
    } else {
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p style="color: red;">Could not load lesson content.</p>';
    }

    // 2. Set up the new, advanced quiz system.
    if (quizData && quizData.items && quizData.items.length > 0) {
        // Also store the quiz questions for the AI to read.
        window.currentLesson.quiz = quizData.items;
        
        // Start the quiz system using the questions we loaded.
        initQuiz(quizData.items, lessonId);
    }
}

/**
 * This helper function gives all the current lesson's information to the AI Tutor.
 * @returns {object} An object containing the full context of the lesson.
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
