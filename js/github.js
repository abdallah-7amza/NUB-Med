// FINAL SYNCHRONIZED VERSION
let allLessonsData = null;

async function getIndexData() {
    if (allLessonsData) {
        return allLessonsData;
    }
    try {
        const response = await fetch('lessons-index.json');
        if (!response.ok) {
            throw new Error(`Failed to load lesson index. Status: ${response.status}`);
        }
        allLessonsData = await response.json();
        return allLessonsData;
    } catch (error) {
        console.error("CRITICAL ERROR: Could not load lessons-index.json.", error);
        return [];
    }
}

export async function getSpecialties(year) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(String(year).replace('year', ''));
    const specialtyNames = [...new Set(allLessons.filter(l => l.year === yearNumber).map(l => l.specialty))];
    return specialtyNames.map(name => ({ name: name.charAt(0).toUpperCase() + name.slice(1) }));
}

export async function getLessons(year, specialty) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(String(year).replace('year', ''));
    return allLessons
        .filter(l => l.year === yearNumber && l.specialty.toLowerCase() === specialty.toLowerCase())
        .map(l => ({ name: l.title, id: l.slug }));
}

// CORRECTED: This function now only needs the lesson's unique ID (slug).
export async function getLessonContent(lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson) return null;
    try {
        const response = await fetch(lesson.path);
        if (!response.ok) throw new Error('File not found');
        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch content for ${lesson.path}`, error);
        return null;
    }
}

// CORRECTED: This function also only needs the lesson's unique ID (slug).
export async function getQuizData(lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson || !lesson.quizPath) return null;
    try {
        const response = await fetch(lesson.quizPath);
        if (!response.ok) throw new Error('File not found');
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch quiz for ${lesson.quizPath}`, error);
        return null;
    }
}


// أضف هذه الدالة الجديدة في نهاية الملف
export async function getFlashcardData(lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson || !lesson.flashcardPath) return null;

    try {
        const response = await fetch(lesson.flashcardPath);
        if (!response.ok) throw new Error('Flashcard file not found');
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch flashcards for ${lesson.flashcardPath}`, error);
        return null;
    }
}
