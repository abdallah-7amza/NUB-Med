// js/lesson.js
import { getLessonContent, getQuizData } from './github.js';
import { initQuiz } from './quiz.js';
import { initAITutor } from './ai-tutor.js';

window.currentLesson = {};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get('lesson');
  const year = params.get('year');
  const specialty = params.get('specialty');

  if (!lessonId) {
    document.getElementById('lesson-content').innerHTML = "<p style='color:red;'>Error: Lesson ID missing.</p>";
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

    window.currentLesson = {
      title: lessonTitle,
      summary: '',
      content: cleanMarkdown
    };

    titleEl.textContent = lessonTitle;
    contentEl.innerHTML = marked.parse(cleanMarkdown);
  }

  if (quizData && quizData.items?.length > 0) {
    window.currentLesson.quiz = quizData.items;
    document.getElementById('start-quiz-btn').onclick = () => {
      document.getElementById('quiz-container').style.display = 'block';
      initQuiz(quizData.items, lessonId);
    };
  }
}

function getLessonContext() {
  return {
    title: window.currentLesson.title || '',
    summary: window.currentLesson.summary || '',
    slug: new URLSearchParams(location.search).get('lesson') || '',
    content: window.currentLesson.content || '',
    quiz: window.currentLesson.quiz || []
  };
}
