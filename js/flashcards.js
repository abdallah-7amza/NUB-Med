// =====================================================
//      NUB MED Portal - Flashcards System
// =====================================================

let allCards = [], currentIndex = 0;
let dom = {};

export function initFlashcards(cards) {
    if (!cards || cards.length === 0) return;
    allCards = cards;
    currentIndex = 0;

    // Find all DOM elements
    dom.btn = document.getElementById('flashcard-btn');
    dom.modal = document.getElementById('flashcard-modal');
    dom.card = document.querySelector('.flashcard');
    dom.front = document.querySelector('.flashcard-face.front');
    dom.back = document.querySelector('.flashcard-face.back');
    dom.prevBtn = document.getElementById('flashcard-prev-btn');
    dom.nextBtn = document.getElementById('flashcard-next-btn');
    dom.progress = document.getElementById('flashcard-progress');
    dom.closeBtn = document.getElementById('close-flashcards-btn');

    // Make the button visible and attach listeners
    if (dom.btn) {
        dom.btn.style.display = 'inline-block';
        attachEventListeners();
        showCard(currentIndex);
    }
}

function attachEventListeners() {
    dom.btn.addEventListener('click', () => {
        dom.modal.style.display = 'flex';
    });
    
    dom.closeBtn.addEventListener('click', () => {
        dom.modal.style.display = 'none';
        dom.card.classList.remove('is-flipped'); // Reset flip state on close
    });

    dom.card.addEventListener('click', () => {
        dom.card.classList.toggle('is-flipped');
    });

    dom.nextBtn.addEventListener('click', () => {
        if (currentIndex < allCards.length - 1) {
            currentIndex++;
            showCard(currentIndex);
        }
    });

    dom.prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            showCard(currentIndex);
        }
    });
}

function showCard(index) {
    dom.card.classList.remove('is-flipped'); // Always show the front first
    const cardData = allCards[index];
    
    // Update content after a short delay to allow the card to flip back
    setTimeout(() => {
        dom.front.textContent = cardData.front;
        dom.back.textContent = cardData.back;
        dom.progress.textContent = `Card ${index + 1} of ${allCards.length}`;
        
        // Update button states
        dom.prevBtn.disabled = index === 0;
        dom.nextBtn.disabled = index === allCards.length - 1;
    }, 150);
}
