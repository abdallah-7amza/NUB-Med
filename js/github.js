// =================================================================
// The CORRECTED and FINAL version of js/github.js
// This version has the correct relative paths.
// =================================================================

let allLessonsData = null;

async function getIndexData() {
    if (allLessonsData) {
        return allLessonsData;
    }

    try {
        // CORRECTED PATH: Relative path from the root HTML file.
        const response = await fetch('lessons-index.json'); 
        if (!response.ok) {
            throw new Error(`Failed to load lesson index. Status: ${response.status}`);
        }
        allLessonsData = await response.json();
        console.log('Lesson index loaded successfully!');
        return allLessonsData;
    } catch (error) {
        console.error("CRITICAL ERROR: Could not load lessons-index.json.", error);
        const container = document.getElementById('content-container') || document.body;
        container.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load the main content file.</p>`;
        return [];
    }
}

export async function getSpecialties(year) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(String(year).replace('year', ''));

    const specialtyNames = new Set(
        allLessons
            .filter(lesson => lesson.year === yearNumber)
            .map(lesson => lesson.specialty)
    );

    return Array.from(specialtyNames).map(name => ({
        name: name.charAt(0).toUpperCase() + name.slice(1)
    }));
}

export async function getLessons(year, specialty) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(String(year).replace('year', ''));

    return allLessons
        .filter(lesson => lesson.year === yearNumber && lesson.specialty.toLowerCase() === specialty.toLowerCase())
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
        // CORRECTED PATH: The path from the index is already correct and relative.
        const response = await fetch(lesson.path);
        if (!response.ok) throw new Error('File not found');
        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch content for ${lesson.path}`, error);
        return null;
    }
}

export async function getQuizData(year, specialty, lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
     if (!lesson || !lesson.quizPath) return null;

    try {
        // CORRECTED PATH: The path from the index is already correct and relative.
        const response = await fetch(lesson.quizPath);
        if (!response.ok) throw new Error('File not found');
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch quiz for ${lesson.quizPath}`, error);
        return null;
    }
}
