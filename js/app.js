// js/app.js - النسخة النهائية
import { getSpecialties, getLessons } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
    const year = new URLSearchParams(window.location.search).get('year');
    const specialty = new URLSearchParams(window.location.search).get('specialty');
    const containerEl = document.getElementById('content-container');

    if (specialty) {
        loadLessons(year, specialty);
    } else {
        loadSpecialties(year);
    }
});

async function loadSpecialties(year) {
    const specialties = await getSpecialties(year);
    const containerEl = document.getElementById('content-container');
    specialties.forEach(spec => {
        const card = document.createElement('a');
        card.href = `lessons-list.html?year=${year}&specialty=${spec.name}`;
        card.innerHTML = `<h3>${spec.name}</h3>`;
        containerEl.appendChild(card);
    });
}

async function loadLessons(year, specialty) {
    const lessons = await getLessons(year, specialty);
    const containerEl = document.getElementById('content-container');
    lessons.forEach(lesson => {
        const card = document.createElement('a');
        card.href = `lesson.html?year=${year}&specialty=${specialty}&lesson=${lesson.id}`;
        card.innerHTML = `<h3>${lesson.name}</h3>`;
        containerEl.appendChild(card);
    });
}
