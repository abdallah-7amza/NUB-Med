import { getLessonContent, getQuizData } from './github.js';
import { initQuiz } from './quiz.js';
import { initFlashcards } from './flashcards.js';
import { initAITutor } from './ai-tutor.js';

window.currentLesson = {};

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    const year = params.get('year');
    const specialty = params.get('specialty');
    const contentEl = document.getElementById('lesson-content');

    if (!lessonId) {
        contentEl.innerHTML = '<p>Error: Lesson ID is missing.</p>';
        return;
    }

    const backLink = document.getElementById('back-link-lesson');
    if (backLink && year && specialty) {
        backLink.href = `lessons-list.html?year=${year}&specialty=${specialty}`;
    }

    loadLessonAndQuiz(lessonId);
    initAITutor({ getLessonContext });
});

async function loadLessonAndQuiz(lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    
    const [markdownContent, quizData] = await Promise.all([
        getLessonContent(lessonId),
        getQuizData(lessonId)
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
        titleEl.textContent = 'Error';
        contentEl.innerHTML = '<p>Could not load lesson content.</p>';
    }

    if (quizData && quizData.items && quizData.items.length > 0) {
        window.currentLesson.quiz = quizData.items;
        // Initialize both systems with the same data
        initQuiz(quizData.items, lessonId);
        initFlashcards(quizData.items);
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
