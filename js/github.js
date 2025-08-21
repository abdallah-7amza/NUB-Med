// js/github.js (Corrected Version)
let allLessonsData = null;

// This function now fetches the new hierarchical index
async function getIndexData() {
    if (allLessonsData) {
        return allLessonsData;
    }
    try {
        // Add cache-busting parameter to ensure we always get the latest index
        const response = await fetch('lessons-index.json?v=' + new Date().getTime());
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

// THIS IS THE CORRECTED FUNCTION
export async function getLessonContent(lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson || !lesson.fullPath) { // Check for fullPath, not path
        console.error(`Lesson with slug "${lessonId}" not found or has no path in index.`);
        return null;
    }
    try {
        // Use lesson.fullPath to fetch the content
        const response = await fetch(lesson.fullPath); 
        if (!response.ok) throw new Error('File not found');
        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch content for ${lesson.fullPath}`, error);
        return null;
    }
}

// The rest of the functions for quiz/flashcards remain correct
export async function getQuizData(lessonId) {
    // This function should be implemented if you add quizzes back
    return null;
}

export async function getFlashcardData(lessonId) {
    // This function should be implemented if you add flashcards back
    return null;
}
