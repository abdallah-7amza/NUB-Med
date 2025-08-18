import { getSpecialties, getLessons } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get('year');
    const specialty = params.get('specialty');

    const titleEl = document.getElementById('page-title');
    const containerEl = document.getElementById('content-container');
    const loaderEl = document.getElementById('loader');

    if (!year) {
        containerEl.innerHTML = '<p>No academic year selected. Please go back and choose a year.</p>';
        loaderEl.style.display = 'none';
        return;
    }

    if (specialty) {
        // We are viewing lessons for a specific specialty
        titleEl.textContent = `Lessons for ${capitalize(specialty)}`;
        loadLessons(year, specialty);
    } else {
        // We are viewing the list of specialties for a year
        const yearName = `Year ${year.replace('year', '')}`;
        titleEl.textContent = `Specialties for ${yearName}`;
        loadSpecialties(year);
    }
});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function loadSpecialties(year) {
    const containerEl = document.getElementById('content-container');
    const loaderEl = document.getElementById('loader');

    const specialties = await getSpecialties(year);
    loaderEl.style.display = 'none';

    if (specialties && specialties.length > 0) {
        specialties.forEach(spec => {
            const card = document.createElement('a');
            card.className = 'card';
            card.href = `?year=${year}&specialty=${spec.name.toLowerCase()}`;
            card.innerHTML = `<h3>${spec.name}</h3>`;
            containerEl.appendChild(card);
        });
    } else {
        containerEl.innerHTML = '<p>No specialties found for this year.</p>';
    }
}

async function loadLessons(year, specialty) {
    const containerEl = document.getElementById('content-container');
    const loaderEl = document.getElementById('loader');
    
    document.querySelector('.back-link').href = `lessons-list.html?year=${year}`;

    const lessons = await getLessons(year, specialty);
    loaderEl.style.display = 'none';

    if (lessons && lessons.length > 0) {
        lessons.forEach(lesson => {
            const card = document.createElement('a');
            card.className = 'card';
            card.href = `lesson.html?year=${year}&specialty=${specialty}&lesson=${lesson.id}`;
            card.innerHTML = `<h3>${capitalize(lesson.name)}</h3>`;
            containerEl.appendChild(card);
        });
    } else {
        containerEl.innerHTML = '<p>No lessons found for this specialty.</p>';
    }
}
