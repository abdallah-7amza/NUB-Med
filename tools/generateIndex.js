// tools/generateIndex.js (Final Bulletproof Version with Logging)
const fs = require('fs');
const path = require('path');

const lessonsBaseDir = path.join(__dirname, '../lessons');
const indexPath = path.join(__dirname, '../lessons-index.json');

console.log('--- Starting Bulletproof Index Generation ---');

try {
    const index = [];
    if (!fs.existsSync(lessonsBaseDir)) {
        throw new Error(`CRITICAL: The base 'lessons' directory does not exist!`);
    }

    const yearDirs = fs.readdirSync(lessonsBaseDir).filter(f => fs.statSync(path.join(lessonsBaseDir, f)).isDirectory());
    console.log(`[INFO] Found ${yearDirs.length} year directories: ${yearDirs.join(', ')}`);

    for (const yearDir of yearDirs) {
        console.log(`\nProcessing Year: ${yearDir}`);
        const yearPath = path.join(lessonsBaseDir, yearDir);
        
        const specialtyDirs = fs.readdirSync(yearPath).filter(f => fs.statSync(path.join(yearPath, f)).isDirectory());
        console.log(`  [INFO] Found ${specialtyDirs.length} specialty directories in ${yearDir}: ${specialtyDirs.join(', ')}`);

        for (const specialtyDir of specialtyDirs) {
            console.log(`    Processing Specialty: ${specialtyDir}`);
            const specialtyPath = path.join(yearPath, specialtyDir);
            const lessonFiles = fs.readdirSync(specialtyPath).filter(file => file.endsWith('.md'));
            
            if (lessonFiles.length === 0) {
                 console.log(`      [WARN] No .md files found in ${specialtyDir}.`);
            }

            for (const lessonFile of lessonFiles) {
                const filePath = path.join(specialtyPath, lessonFile);
                console.log(`      -> Found lesson file: ${lessonFile}`);
                
                const content = fs.readFileSync(filePath, 'utf8');
                const slugMatch = content.match(/slug:\s*["']?(.+?)["']?\s/);
                const titleMatch = content.match(/title:\s*["']?(.+?)["']?\s/);

                if (!slugMatch || !titleMatch) {
                    console.warn(`        [WARN] Skipping ${lessonFile}: Missing slug or title.`);
                    continue;
                }

                const slug = slugMatch[1];
                const title = titleMatch[1];
                const fullPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
                const pathParts = fullPath.substring('lessons/'.length).split('/');

                index.push({ slug, title, fullPath, pathParts });
            }
        }
    }
    
    if (index.length === 0) {
        console.error('\n[CRITICAL ERROR] The script ran successfully but found ZERO lessons to index. The final lessons-index.json will be empty. Please check your folder structure.');
    } else {
        console.log(`\n[SUCCESS] Index generation complete. Found ${index.length} total lessons.`);
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

} catch (error) {
    console.error('\n[FATAL SCRIPT ERROR] The script crashed:', error);
    process.exit(1);
}
