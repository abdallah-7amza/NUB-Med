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

    // اجمع كل التخصصات وحولها lowercase
    const specialties = new Set(
        allLessons
            .filter(l => l.year === yearNumber)
            .map(l => l.specialty.toLowerCase())
    );

    // name = القيمة للـ URL (lowercase)
    // label = النص اللي يظهر للمستخدم
    return Array.from(specialties).map(name => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1)
    }));
}

export async function getLessons(year, specialty) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(year.replace('year', ''));

    return allLessons
        .filter(
            l =>
                l.year === yearNumber &&
                l.specialty.toLowerCase() === specialty.toLowerCase()
        )
        .map(lesson => ({
            name: lesson.title,
            id: lesson.slug
        }));
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
