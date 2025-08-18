// js/github.js - النسخة النهائية
let allLessonsData = null;

async function getIndexData() {
    if (allLessonsData) return allLessonsData;
    try {
        const response = await fetch('lessons-index.json');
        if (!response.ok) throw new Error('Failed to load index');
        allLessonsData = await response.json();
        return allLessonsData;
    } catch (error) {
        console.error("Error loading index:", error);
        return [];
    }
}

export async function getSpecialties(year) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(year.replace('year', ''));
    const specialties = new Set(allLessons.filter(l => l.year === yearNumber).map(l => l.specialty);
    return Array.from(specialties).map(name => ({ name }));
}

export async function getLessons(year, specialty) {
    const allLessons = await getIndexData();
    return allLessons
        .filter(l => l.year === parseInt(year.replace('year', '')) && l.specialty === specialty)
        .map(lesson => ({ name: lesson.title, id: lesson.slug }));
}

export async function getLessonContent(year, specialty, lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson) return null;
    try {
        const response = await fetch(lesson.path);
        return await response.text();
    } catch (error) {
        console.error("Error loading lesson:", error);
        return null;
    }
}
