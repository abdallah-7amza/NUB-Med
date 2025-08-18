// =================================================================
// The NEW and FINAL version of js/github.js
// Replace the entire content of your file with this code.
// This version uses the fast `lessons-index.json` and is reliable.
// =================================================================

// This variable will hold all our lesson data so we only load it once.
let allLessonsData = null;

/**
 * Fetches the data from our lessons-index.json file.
 * This is the only network request this file will make for lists.
 */
async function getIndexData() {
    // If we already loaded the data, don't load it again.
    if (allLessonsData) {
        return allLessonsData;
    }

    try {
        // Fetch the index file from the root of the site.
        // NOTE: The path '/NUB-Med/' must match your repository name.
        const response = await fetch('/NUB-Med/lessons-index.json'); 
        if (!response.ok) {
            throw new Error(`Failed to load lesson index. Status: ${response.status}`);
        }
        allLessonsData = await response.json();
        console.log('Lesson index loaded successfully!');
        return allLessonsData;
    } catch (error) {
        console.error("CRITICAL ERROR: Could not load lessons-index.json.", error);
        const container = document.getElementById('content-container') || document.body;
        container.innerHTML = `<p style="color: red; text-align: center;">Error: Could not load the main content file (lessons-index.json). The site cannot function.</p>`;
        return []; // Return empty array to stop further errors
    }
}

/**
 * Fetches a list of specialties for a given year by filtering the index data.
 */
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

/**
 * Fetches a list of lessons for a given specialty by filtering the index data.
 */
export async function getLessons(year, specialty) {
    const allLessons = await getIndexData();
    const yearNumber = parseInt(String(year).replace('year', ''));

    return allLessons
        .filter(lesson => lesson.year === yearNumber && lesson.specialty.toLowerCase() === specialty.toLowerCase())
        .map(lesson => ({
            name: lesson.title, // Use the full, user-friendly title
            id: lesson.slug    // Use the slug as the unique ID for the URL
        }));
}

/**
 * Fetches the content for a specific lesson's Markdown file.
 */
export async function getLessonContent(year, specialty, lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
    if (!lesson) return null;

    try {
        // NOTE: The path '/NUB-Med/' must match your repository name.
        const response = await fetch(`/NUB-Med/${lesson.path}`);
        if (!response.ok) throw new Error('File not found');
        return await response.text(); // Return the raw markdown text
    } catch (error) {
        console.error(`Failed to fetch content for ${lesson.path}`, error);
        return null;
    }
}

/**
 * Fetches the quiz data for a specific lesson.
 */
export async function getQuizData(year, specialty, lessonId) {
    const allLessons = await getIndexData();
    const lesson = allLessons.find(l => l.slug === lessonId);
     if (!lesson || !lesson.quizPath) return null;

    try {
        // NOTE: The path '/NUB-Med/' must match your repository name.
        const response = await fetch(`/NUB-Med/${lesson.quizPath}`);
        if (!response.ok) throw new Error('File not found');
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch quiz for ${lesson.quizPath}`, error);
        return null;
    }
}
