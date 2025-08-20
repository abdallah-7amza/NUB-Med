let flashcardItems = [];
let currentCardIndex = 0;

let container, card, cardInner, cardFront, cardBack, progressEl, nextBtn, prevBtn, closeBtn;

export function initFlashcards(items) {
    if (!items || items.length === 0) return;
    flashcardItems = items.map(item => ({
        question: item.stem,
        answer: item.options.find(opt => opt.id === item.correct)?.text || 'N/A'
    }));
    
    const startBtn = document.getElementById('start-flashcards-btn');
    if(startBtn) {
        startBtn.style.display = 'inline-block';
        startBtn.addEventListener('click', showFlashcards);
    }
}

function showFlashcards() {
    container = document.getElementById('flashcard-container');
    card = document.getElementById('flashcard-card');
    cardInner = card.querySelector('.flashcard-inner');
    cardFront = card.querySelector('.flashcard-front');
    cardBack = card.querySelector('.flashcard-back');
    progressEl = document.getElementById('flashcard-progress');
    nextBtn = document.getElementById('flashcard-next-btn');
    prevBtn = document.getElementById('flashcard-prev-btn');
    closeBtn = document.getElementById('close-flashcards-btn');

    if (!container) return;

    container.classList.remove('hidden');
    currentCardIndex = 0;
    renderCard();

    card.addEventListener('click', () => cardInner.classList.toggle('is-flipped'));
    nextBtn.addEventListener('click', nextCard);
    prevBtn.addEventListener('click', prevCard);
    closeBtn.addEventListener('click', hideFlashcards);
}

function hideFlashcards() {
    if (container) container.classList.add('hidden');
    if (cardInner) cardInner.classList.remove('is-flipped');
}

function renderCard() {
    const item = flashcardItems[currentCardIndex];
    cardFront.textContent = item.question;
    cardBack.textContent = item.answer;
    progressEl.textContent = `${currentCardIndex + 1} / ${flashcardItems.length}`;
    cardInner.classList.remove('is-flipped');
    
    prevBtn.disabled = currentCardIndex === 0;
    nextBtn.disabled = currentCardIndex === flashcardItems.length - 1;
}

function nextCard() {
    if (currentCardIndex < flashcardItems.length - 1) {
        currentCardIndex++;
        renderCard();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCard();
    }
}
