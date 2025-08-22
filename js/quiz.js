// js/quiz.js
let quizItems = [];
let userAnswers = {};
let lessonId = '';

export function initQuiz(items, id) {
  quizItems = items;
  lessonId = id;
  loadProgress();
  renderQuiz();
  document.getElementById('quiz-reset-btn').onclick = resetQuiz;
}

function renderQuiz() {
  const quizContentEl = document.getElementById('quiz-content');
  quizContentEl.innerHTML = '';

  quizItems.forEach((q, index) => {
    const isAnswered = userAnswers.hasOwnProperty(index);
    const userAnswerId = userAnswers[index];

    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';

    const optionsHtml = q.options.map(opt => {
      let cls = '';
      if (isAnswered) {
        if (opt.id === q.correct) cls = 'correct';
        else if (opt.id === userAnswerId) cls = 'incorrect';
      }
      return `
        <label class="${cls}">
          <input type="radio" name="q-${index}" value="${opt.id}" ${isAnswered ? 'disabled' : ''} ${userAnswerId === opt.id ? 'checked' : ''}>
          <span>${opt.text}</span>
        </label>`;
    }).join('');

    questionDiv.innerHTML = `<p><strong>${index+1}. ${q.stem}</strong></p><div class="quiz-options">${optionsHtml}</div>`;
    quizContentEl.appendChild(questionDiv);
  });

  document.querySelectorAll('.quiz-options input[type="radio"]:not(:disabled)').forEach(input => {
    input.addEventListener('change', handleSelect);
  });

  updateUI();
}

function handleSelect(e) {
  const idx = parseInt(e.target.name.split('-')[1]);
  userAnswers[idx] = e.target.value;
  saveProgress();
  renderQuiz();
}

function updateUI() {
  const scoreEl = document.getElementById('quiz-score');
  const progressValueEl = document.getElementById('quiz-progress-value');
  const resetBtn = document.getElementById('quiz-reset-btn');

  let score = 0;
  Object.keys(userAnswers).forEach(i => {
    if (quizItems[i].correct === userAnswers[i]) score++;
  });

  const answeredCount = Object.keys(userAnswers).length;
  const total = quizItems.length;

  scoreEl.textContent = `Score: ${score} / ${total}`;
  progressValueEl.style.width = total > 0 ? `${(answeredCount/total)*100}%` : "0%";
  resetBtn.style.display = answeredCount > 0 ? 'inline-block' : 'none';
}

function saveProgress() {
  localStorage.setItem(`quiz_${lessonId}`, JSON.stringify(userAnswers));
}

function loadProgress() {
  userAnswers = JSON.parse(localStorage.getItem(`quiz_${lessonId}`) || '{}');
}

function resetQuiz() {
  if (confirm('Reset your quiz progress?')) {
    localStorage.removeItem(`quiz_${lessonId}`);
    userAnswers = {};
    renderQuiz();
  }
}
