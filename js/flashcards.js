let flashcardItems = [], currentCardIndex = 0;

export function initFlashcards(items) {
    if (!items || items.length === 0) return;
    flashcardItems = items;
    const startBtn = document.getElementById('start-flashcards-btn');
    if(startBtn) {
        startBtn.style.display = 'inline-block';
        startBtn.addEventListener('click', showFlashcards);
    }
}

function showFlashcards() {
    document.getElementById('flashcard-container')?.classList.remove('hidden');
    currentCardIndex = 0;
    renderCard();
    document.getElementById('flashcard-card')?.addEventListener('click', (e) => e.currentTarget.querySelector('.flashcard-inner').classList.toggle('is-flipped'));
    document.getElementById('flashcard-next-btn')?.addEventListener('click', nextCard);
    document.getElementById('flashcard-prev-btn')?.addEventListener('click', prevCard);
    document.getElementById('close-flashcards-btn')?.addEventListener('click', hideFlashcards);
}

function hideFlashcards() {
    document.getElementById('flashcard-container')?.classList.add('hidden');
    document.querySelector('#flashcard-card .flashcard-inner')?.classList.remove('is-flipped');
}

function renderCard() {
    const item = flashcardItems[currentCardIndex];
    document.querySelector('.flashcard-front').textContent = item.term;
    document.querySelector('.flashcard-back').textContent = item.definition;
    document.getElementById('flashcard-progress').textContent = `${currentCardIndex + 1} / ${flashcardItems.length}`;
    document.querySelector('#flashcard-card .flashcard-inner')?.classList.remove('is-flipped');
    document.getElementById('flashcard-prev-btn').disabled = currentCardIndex === 0;
    document.getElementById('flashcard-next-btn').disabled = currentCardIndex === flashcardItems.length - 1;
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
