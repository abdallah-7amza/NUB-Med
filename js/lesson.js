// ---------------------------------------
// LESSON.JS (FINAL VERSION)
// ---------------------------------------

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const year = urlParams.get("year");
const specialty = urlParams.get("specialty");
const lessonSlug = urlParams.get("lesson");

// DOM elements
const lessonContentEl = document.getElementById("lesson-content");
const pageTitleEl = document.getElementById("page-title");

// Load lesson + quiz
async function loadLessonAndQuiz() {
  if (!year || !specialty || !lessonSlug) {
    lessonContentEl.innerHTML =
      "<p style='color:red;'>Lesson parameters missing in URL.</p>";
    return;
  }

  try {
    const indexRes = await fetch("lessons-index.json");
    const lessons = await indexRes.json();

    const lesson = lessons.find(
      (l) =>
        l.year === year &&
        l.specialty === specialty &&
        l.slug === lessonSlug
    );

    if (!lesson) {
      lessonContentEl.innerHTML =
        "<p style='color:red;'>Lesson not found.</p>";
      return;
    }

    // Set page title
    pageTitleEl.textContent = lesson.title;

    // Load markdown content
    const lessonRes = await fetch(
      `lessons/${year}/${specialty}/${lessonSlug}.md`
    );
    const lessonText = await lessonRes.text();
    const html = marked.parse(lessonText);
    lessonContentEl.innerHTML = html;

    // Load quiz if available
    if (lesson.quizPath && document.getElementById("start-quiz-wrapper")) {
      document.getElementById("start-quiz-wrapper").style.display = "block";

      try {
        const quizRes = await fetch(lesson.quizPath);
        if (!quizRes.ok) throw new Error("Quiz file not found");
        const quizData = await quizRes.json();
        initQuiz(quizData);
      } catch (err) {
        console.error("Quiz load failed:", err);
        document.getElementById("quiz-content").innerHTML =
          "<p style='color:red;'>Quiz not available.</p>";
      }
    }
  } catch (err) {
    console.error("Lesson load failed:", err);
    lessonContentEl.innerHTML =
      "<p style='color:red;'>Failed to load lesson content.</p>";
  }
}

loadLessonAndQuiz();

// ---------------------------------------
// QUIZ SYSTEM (Browse + Sequential)
// ---------------------------------------

let quizItems = [];
let userAnswers = {}; // for browse mode
let seqState = {
  currentIndex: 0,
  answers: {},
  finished: false,
};
let lessonId = lessonSlug || "";
let mode = null; // 'browse' | 'sequential'

const $ = (sel) => document.querySelector(sel);

function getSeqKey() {
  return `quiz_seq_${lessonId}`;
}
function getBrowseKey() {
  return `quiz_progress_${lessonId}`;
}

function saveSeq() {
  localStorage.setItem(getSeqKey(), JSON.stringify(seqState));
}
function loadSeq() {
  const raw = localStorage.getItem(getSeqKey());
  seqState = raw
    ? JSON.parse(raw)
    : { currentIndex: 0, answers: {}, finished: false };
}
function saveBrowse() {
  localStorage.setItem(getBrowseKey(), JSON.stringify(userAnswers));
}
function loadBrowse() {
  const raw = localStorage.getItem(getBrowseKey());
  userAnswers = raw ? JSON.parse(raw) : {};
}

function initQuiz(items) {
  quizItems = items;

  // Show "Test Yourself" button
  const startWrap = $("#start-quiz-wrapper");
  const startBtn = $("#start-quiz-btn");
  if (startWrap && startBtn) {
    startWrap.style.display = "block";
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModeModal();
    });
  }

  // Hide quiz container initially
  const quizContainer = $("#quiz-container");
  if (quizContainer) quizContainer.style.display = "none";

  // Load saved progress
  loadBrowse();
  loadSeq();

  // Update header progress
  updateHeaderProgress();

  // Reset button
  const resetBtn = $("#quiz-reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", resetAllProgress);
}

function openModeModal() {
  const modal = $("#quiz-mode-modal");
  const resumeWrap = $("#resume-exam-wrap");
  const resumeBtn = $("#mode-resume");
  const closeBtn = $("#mode-close");
  const startExamBtn = $("#mode-start-exam");
  const browseBtn = $("#mode-browse");

  if (!modal) return;

  if (Object.keys(seqState.answers).length > 0 && !seqState.finished) {
    resumeWrap.style.display = "block";
  } else {
    resumeWrap.style.display = "none";
  }

  modal.setAttribute("aria-hidden", "false");

  const closeModal = () => modal.setAttribute("aria-hidden", "true");

  closeBtn.onclick = closeModal;
  browseBtn.onclick = () => {
    closeModal();
    startBrowseMode();
  };
  startExamBtn.onclick = () => {
    closeModal();
    startSequentialExam(false);
  };
  resumeBtn &&
    (resumeBtn.onclick = () => {
      closeModal();
      startSequentialExam(true);
    });
}

// --- Browse Mode ---
function startBrowseMode() {
  mode = "browse";
  $("#quiz-container").style.display = "block";
  $("#quiz-controls").style.display = "none";
  renderBrowse();
}

function renderBrowse() {
  const host = $("#quiz-content");
  host.innerHTML = "";

  quizItems.forEach((q, index) => {
    const answered = userAnswers.hasOwnProperty(index);
    const userAns = userAnswers[index];

    const questionDiv = document.createElement("div");
    questionDiv.className = "quiz-question";

    const optionsHtml = q.options
      .map((opt) => {
        let cls = opt.id === q.correct ? "correct" : "";
        if (answered && opt.id === userAns && userAns !== q.correct)
          cls = "incorrect";
        return `
          <label class="${cls}">
            <input type="radio" name="q-${index}" value="${opt.id}" ${
          answered ? "disabled" : ""
        } ${userAns === opt.id ? "checked" : ""}>
            <span>${opt.text}</span>
          </label>
        `;
      })
      .join("");

    questionDiv.innerHTML = `
      <p><strong>${index + 1}. ${q.stem}</strong></p>
      <div class="quiz-options">${optionsHtml}</div>
    `;
    host.appendChild(questionDiv);
  });

  host
    .querySelectorAll(
      ".quiz-options input[type='radio']:not(:disabled)"
    )
    .forEach((input) => {
      input.addEventListener("change", (e) => {
        const idx = parseInt(e.target.name.split("-")[1]);
        userAnswers[idx] = e.target.value;
        saveBrowse();
        renderBrowse();
        updateHeaderProgress();
      });
    });

  updateHeaderProgress();
}

// --- Sequential Exam ---
function startSequentialExam(resume = false) {
  mode = "sequential";
  $("#quiz-container").style.display = "block";
  $("#quiz-controls").style.display = "flex";
  if (!resume) {
    seqState = { currentIndex: 0, answers: {}, finished: false };
    saveSeq();
  }
  renderSequential();
}

function renderSequential() {
  const host = $("#quiz-content");
  host.innerHTML = "";

  const i = seqState.currentIndex;
  const q = quizItems[i];
  const yourAnswer = seqState.answers[i];

  const optionsHtml = q.options
    .map((opt) => {
      let cls = "";
      if (yourAnswer !== undefined) {
        if (opt.id === q.correct) cls = "correct";
        else if (opt.id === yourAnswer) cls = "incorrect";
      }
      const disabled = yourAnswer !== undefined ? "disabled" : "";
      const checked = yourAnswer === opt.id ? "checked" : "";
      return `
        <label class="${cls}">
          <input type="radio" name="q-${i}" value="${opt.id}" ${disabled} ${checked}>
          <span>${opt.text}</span>
        </label>
      `;
    })
    .join("");

  host.innerHTML = `
    <p><strong>Question ${i + 1} of ${quizItems.length}</strong></p>
    <p style="margin:.25rem 0 1rem 0;">${q.stem}</p>
    <div class="quiz-options">${optionsHtml}</div>
    <div style="margin-top:.75rem;">
      <button id="ask-ai" class="btn-secondary">Ask AI about this question</button>
    </div>
    <div id="review-note" style="margin-top:.5rem; display:${
      yourAnswer !== undefined ? "block" : "none"
    };">
      ${
        yourAnswer !== undefined
          ? yourAnswer === q.correct
            ? "Correct ✅"
            : "Incorrect ❌"
          : ""
      }
    </div>
  `;

  host
    .querySelectorAll(".quiz-options input[type='radio']")
    .forEach((input) => {
      input.addEventListener("change", (e) => {
        seqState.answers[i] = e.target.value;
        saveSeq();
        renderSequential();
        updateHeaderProgress();
        updateNavButtons();
      });
    });

  const aiBtn = $("#ask-ai");
  aiBtn.onclick = () => {
    const aiFab = $("#ai-tutor-fab");
    aiFab && aiFab.click();
    const prompt = `Explain this MCQ and why the correct answer is correct:
Question: ${q.stem}
Options:
${q.options.map((o) => `- ${o.text} (${o.id})`).join("\n")}
User answer: ${seqState.answers[i] ?? "Not answered yet"}
Correct answer: ${q.correct}`;
    const chatInput = $("#chat-input");
    const chatForm = $("#chat-input-form");
    if (chatInput && chatForm) {
      chatInput.value = prompt;
      chatForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }
  };

  updateNavButtons();
  updateHeaderProgress();
}

function updateNavButtons() {
  const prev = $("#prev-q");
  const next = $("#next-q");
  const finish = $("#finish-exam");

  const i = seqState.currentIndex;
  const total = quizItems.length;
  const answered = seqState.answers.hasOwnProperty(i);

  prev.disabled = i === 0;
  next.style.display = i < total - 1 ? "inline-block" : "none";
  finish.style.display = i === total - 1 ? "inline-block" : "none";

  next.disabled = !answered;
  finish.disabled = !answered;

  prev.onclick = () => {
    if (i > 0) {
      seqState.currentIndex--;
      saveSeq();
      renderSequential();
    }
  };
  next.onclick = () => {
    if (i < total - 1 && answered) {
      seqState.currentIndex++;
      saveSeq();
      renderSequential();
    }
  };
  finish.onclick = () => {
    if (answered) showResults();
  };
}

function showResults() {
  seqState.finished = true;
  saveSeq();

  const host = $("#quiz-content");
  const total = quizItems.length;
  let score = 0;

  const reviewHtml = quizItems
    .map((q, idx) => {
      const ua = seqState.answers[idx];
      const ok = ua === q.correct;
      if (ok) score++;
      const list = q.options
        .map((o) => {
          let cls = "";
          if (o.id === q.correct) cls = "correct";
          else if (ua === o.id) cls = "incorrect";
          return `<li class="${cls}" style="margin:.25rem 0;">${o.text} <small>(${o.id})</small></li>`;
        })
        .join("");
      return `
        <div class="quiz-question">
          <p><strong>${idx + 1}. ${q.stem}</strong></p>
          <ul style="padding-left:1rem; margin-top:.5rem;">${list}</ul>
          <p style="margin:.25rem 0;">Your answer: <strong>${
            ua ?? "—"
          }</strong> | Correct: <strong>${q.correct}</strong></p>
        </div>
      `;
    })
    .join("");

  host.innerHTML = `
    <h3>Results</h3>
    <p style="margin:.25rem 0 1rem 0;">You scored <strong>${score}</strong> out of <strong>${total}</strong>.</p>
    <div>${reviewHtml}</div>
    <div style="display:flex; gap:.5rem; margin-top:1rem;">
      <button id="review-browse" class="btn-secondary">Browse Questions</button>
      <button id="restart-exam" class="btn">Retake Exam</button>
    </div>
  `;

  $("#quiz-controls").style.display = "none";

  $("#review-browse").onclick = () => startBrowseMode();
  $("#restart-exam").onclick = () => {
    seqState = { currentIndex: 0, answers: {}, finished: false };
    saveSeq();
    startSequentialExam(false);
  };

  updateHeaderProgress();
}

function updateHeaderProgress() {
  const scoreEl = $("#quiz-score");
  const progressEl = $("#quiz-progress-value");
  const resetBtn = $("#quiz-reset-btn");

  const total = quizItems.length;

  const answeredBrowse = Object.keys(userAnswers).length;
  const answeredSeq = Object.keys(seqState.answers).length;
  const answered =
    mode === "sequential"
      ? answeredSeq
      : Math.max(answeredBrowse, answeredSeq);

  let score = 0;
  Object.keys(seqState.answers).forEach((i) => {
    if (quizItems[i].correct === seqState.answers[i]) score++;
  });

  scoreEl.textContent = `Score: ${score} / ${total}`;
  const percent = total ? (answered / total) * 100 : 0;
  progressEl.style.width = `${percent}%`;
  resetBtn.style.display = answered > 0 ? "inline-block" : "none";
}

function resetAllProgress() {
  if (!confirm("Are you sure you want to reset your progress?")) return;
  localStorage.removeItem(getBrowseKey());
  localStorage.removeItem(getSeqKey());
  userAnswers = {};
  seqState = { currentIndex: 0, answers: {}, finished: false };
  $("#quiz-content").innerHTML = "";
  $("#quiz-controls").style.display = "none";
  $("#quiz-container").style.display = "none";
  updateHeaderProgress();
  openModeModal();
}
