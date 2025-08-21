let allLessonsData = null;

async function getIndexData() {
    if (allLessonsData) return allLessonsData;
    try {
        const response = await fetch('lessons-index.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error(`Index fetch failed: ${response.status}`);
        allLessonsData = await response.json();
        return allLessonsData;
    } catch (error) {
        console.error("CRITICAL: Could not load lessons-index.json.", error);
        return [];
    }
}

export async function getLessonContent(lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson || !lesson.fullPath) return null;
    try {
        const response = await fetch(lesson.fullPath);
        if (!response.ok) throw new Error('File not found');
        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch content for ${lesson.fullPath}`, error);
        return null;
    }
}

// Stubs for quiz/flashcards - implement them when you are ready
export async function getQuizData(lessonId) { return null; }
export async function getFlashcardData(lessonId) { return null; }
