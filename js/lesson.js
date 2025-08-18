import { getLessonContent, getQuizData } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('lesson'); 
    const year = params.get('year');
    const specialty = params.get('specialty');

    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const loaderEl = document.getElementById('loader');

    if (!lessonId || !year || !specialty) {
        if(loaderEl) loaderEl.style.display = 'none';
        contentEl.innerHTML = '<p style="color: red;">Error: Lesson details are missing in the URL.</p>';
        return;
    }

    loadLesson(year, specialty, lessonId);
});

async function loadLesson(year, specialty, lessonId) {
    const titleEl = document.getElementById('page-title');
    const contentEl = document.getElementById('lesson-content');
    const loaderEl = document.getElementById('loader');

    const markdownContent = await getLessonContent(year, specialty, lessonId);

    if (loaderEl) loaderEl.style.display = 'none';

    if (markdownContent) {
        // استخدم المكتبة لتحويل Markdown إلى HTML
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
        contentEl.innerHTML = '<p style="color: red;">Could not load the lesson content.</p>';
    }
}
