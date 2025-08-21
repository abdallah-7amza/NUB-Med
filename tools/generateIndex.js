// tools/generateIndex.js (Final Stable Version)
const fs = require('fs');
const path = require('path');

const lessonsBaseDir = path.join(__dirname, '../lessons');
const indexPath = path.join(__dirname, '../lessons-index.json');

console.log('🚀 Starting final index generation...');

try {
    const index = [];
    const yearDirs = fs.readdirSync(lessonsBaseDir).filter(f => fs.statSync(path.join(lessonsBaseDir, f)).isDirectory());

    for (const yearDir of yearDirs) {
        const yearPath = path.join(lessonsBaseDir, yearDir);
        // This is a simple recursive function to find all .md files in any subfolder
        function findMdFiles(dir) {
            const results = [];
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    results.push(...findMdFiles(filePath));
                } else if (file.endsWith('.md')) {
                    results.push(filePath);
                }
            });
            return results;
        }

        const allMdFilesInYear = findMdFiles(yearPath);
        
        for (const filePath of allMdFilesInYear) {
            const content = fs.readFileSync(filePath, 'utf8');
            const slugMatch = content.match(/slug:\s*["']?(.+?)["']?\s/);
            const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s/);

            if (!slugMatch || !titleMatch) {
                console.warn(`--> ⚠️ Skipping ${filePath}: Missing slug or title.`);
                continue;
            }

            const slug = slugMatch[1];
            const title = titleMatch[1];
            const fullPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
            const pathParts = fullPath.substring('lessons/'.length).split('/');

            index.push({
                slug,
                title,
                fullPath,
                pathParts
            });
        }
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`✅ Index generation complete. Found ${index.length} total lessons.`);

} catch (error) {
    console.error('❌ Error during index generation:', error);
    process.exit(1);
}
