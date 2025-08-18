// The FINAL, corrected version of js/app.js
import { getSpecialties, getLessons } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get('year');
    const specialty = params.get('specialty');

    const titleEl = document.getElementById('page-title');
    const containerEl = document.getElementById('content-container');
    const backLink = document.querySelector('.btn-secondary'); // Selector for the back button

    if (!year) {
        containerEl.innerHTML = '<p>No academic year selected.</p>';
        return;
    }

    // This logic determines if we are on the specialties page or the lessons page
    if (specialty) {
        // We are on the lessons page
        titleEl.textContent = `Lessons for ${capitalize(specialty)}`;
        if (backLink) {
           backLink.style.display = 'inline-block';
           backLink.href = `lessons-list.html?year=${year}`; // Link back to specialties
        }
        loadLessons(year, specialty);
    } else {
        // We are on the specialties page
        titleEl.textContent = `Specialties for Year ${year.replace('year', '')}`;
        if (backLink) {
            backLink.href = `index.html`; // Link back to the main page
        }
        loadSpecialties(year);
    }
});

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function loadSpecialties(year) {
    const containerEl = document.getElementById('content-container');
    containerEl.innerHTML = ''; // Clear previous content
    const specialties = await getSpecialties(year);
    
    if (specialties && specialties.length > 0) {
        specialties.forEach(spec => {
            const card = document.createElement('a');
            card.className = 'card';
            card.href = `lessons-list.html?year=${year}&specialty=${spec.name.toLowerCase()}`;
            card.innerHTML = `<h3>${spec.name}</h3>`;
            containerEl.appendChild(card);
        });
    } else {
        containerEl.innerHTML = '<p>No specialties found for this year.</p>';
    }
}

async function loadLessons(year, specialty) {
    const containerEl = document.getElementById('content-container');
    containerEl.innerHTML = ''; // Clear previous content
    const lessons = await getLessons(year, specialty);

    if (lessons && lessons.length > 0) {
        lessons.forEach(lesson => {
            const card = document.createElement('a');
            card.className = 'card';
            // This now correctly uses the 'id' (which is the slug) to build the link for lesson.html
            card.href = `lesson.html?year=${year}&specialty=${specialty}&lesson=${lesson.id}`;
            card.innerHTML = `<h3>${lesson.name}</h3>`;
            containerEl.appendChild(card);
        });
    } else {
        containerEl.innerHTML = '<p>No lessons found for this specialty.</p>';
    }
}
