// --- GitHub API Service ---

const REPO_OWNER = 'Abdallah-7amza';
const REPO_NAME = 'MED-Portal-NUB';
const API_BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// Helper function to handle API requests
async function fetchFromGitHub(path) {
    try {
        const response = await fetch(`${API_BASE_URL}/${path}`);
        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch from GitHub path: ${path}`, error);
        return null;
    }
}

/**
 * Fetches a list of specialties (directories) for a given year.
 * The year corresponds to the folder name in the repo (e.g., 'year5').
 * @param {string} year - The academic year folder (e.g., 'year5').
 * @returns {Promise<Array|null>} A promise that resolves to an array of specialty objects or null on error.
 */
export async function getSpecialties(year) {
    const data = await fetchFromGitHub(`lessons/${year}`);
    if (Array.isArray(data)) {
        return data.filter(item => item.type === 'dir').map(dir => ({
            name: dir.name.charAt(0).toUpperCase() + dir.name.slice(1), // Capitalize
            path: dir.path
        }));
    }
    return [];
}

/**
 * Fetches a list of lessons (.md files) for a given specialty.
 * @param {string} year - The academic year folder.
 * @param {string} specialty - The specialty folder name.
 * @returns {Promise<Array|null>} A promise that resolves to an array of lesson objects or null on error.
 */
export async function getLessons(year, specialty) {
    const data = await fetchFromGitHub(`lessons/${year}/${specialty}`);
     if (Array.isArray(data)) {
        return data
            .filter(item => item.type === 'file' && item.name.endsWith('.md'))
            .map(file => ({
                name: file.name.replace('.md', '').replace(/_/g, ' '),
                id: file.name.replace('.md', '')
            }));
    }
    return [];
}

/**
 * Fetches the content of a specific lesson's Markdown file.
 * @param {string} year
 * @param {string} specialty
 * @param {string} lessonId - The filename without extension (e.g., 'anemia').
 * @returns {Promise<string|null>} A promise that resolves to the decoded content of the file.
 */
export async function getLessonContent(year, specialty, lessonId) {
    const data = await fetchFromGitHub(`lessons/${year}/${specialty}/${lessonId}.md`);
    if (data && data.content) {
        return atob(data.content); // Decode base64 content
    }
    return null;
}

/**
 * Fetches the quiz data from a specific JSON file.
 * @param {string} year
 * @param {string} specialty
 * @param {string} lessonId - The filename without extension.
 * @returns {Promise<Object|null>} A promise that resolves to the parsed JSON quiz data.
 */
export async function getQuizData(year, specialty, lessonId) {
     const data = await fetchFromGitHub(`questions/${year}/${specialty}/${lessonId}.json`);
    if (data && data.content) {
        const decodedContent = atob(data.content);
        return JSON.parse(decodedContent);
    }
    return null;
}
