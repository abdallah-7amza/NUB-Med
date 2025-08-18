// The FINAL, corrected version of js/lesson.js
import { getLessonContent } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson');
    const year = params.get('year');
    const specialty = params.get('specialty');

    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');

    if (!lessonId || !year || !specialty) {
        contentEl.innerHTML = '<p style="color: red;">Error: Lesson details are missing.</p>';
        return;
    }

    loadLesson(year, specialty, lessonId);
});

async function loadLesson(year, specialty, lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');

    const markdownContent = await getLessonContent(year, specialty, lessonId);
    
    if (markdownContent) {
        // Use the marked.js library to convert Markdown to HTML
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
}
