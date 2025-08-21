// tools/generateIndex.js (UPGRADED with Recursive Logic)
const fs = require('fs');
const path = require('path');

const lessonsBaseDir = path.join(__dirname, '../lessons');
const indexPath = path.join(__dirname, '../lessons-index.json');

console.log('🚀 Starting deep index generation...');

// A recursive function to walk through all directories
function walkDir(dir, allLessons = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // If it's a directory, go deeper
            walkDir(filePath, allLessons);
        } else if (file.endsWith('.md')) {
            // If it's a markdown file, process it
            const content = fs.readFileSync(filePath, 'utf8');
            const slugMatch = content.match(/slug:\s*["']?(.+?)["']?\s/);
            const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s/);

            if (!slugMatch || !titleMatch) {
                console.warn(`--> ⚠️ Skipping ${filePath}: Missing slug or title.`);
                continue;
            }

            const slug = slugMatch[1];
            const title = titleMatch[1];
            
            // This creates a clean, relative path from the project root
            const fullPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
            
            // This creates the array of path parts for navigation
            // e.g., "lessons/year5/pediatrics/cardiology/vsd/diagnosis.md"
            // becomes ["year5", "pediatrics", "cardiology", "vsd", "diagnosis.md"]
            const pathParts = fullPath.substring('lessons/'.length).split('/');

            allLessons.push({
                slug,
                title,
                fullPath,
                pathParts
            });
        }
    }
    return allLessons;
}

try {
    const lessonsIndex = walkDir(lessonsBaseDir);
    fs.writeFileSync(indexPath, JSON.stringify(lessonsIndex, null, 2));
    console.log(`✅ Index generation complete. Found ${lessonsIndex.length} lessons.`);
} catch (error) {
    console.error('❌ Error during index generation:', error);
    process.exit(1);
}
