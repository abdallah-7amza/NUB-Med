// tools/generateIndex.js (UPGRADED SCRIPT)
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const lunr = require('lunr');

const lessonsBaseDir = path.join(__dirname, '../lessons');
const indexPath = path.join(__dirname, '../lessons-index.json');
const searchIndexPath = path.join(__dirname, '../search-index.json');

console.log('Starting universal index generation...');

try {
    const lessonsIndex = [];
    // Get all year folders (e.g., 'year1', 'year4', 'year5')
    const yearDirs = fs.readdirSync(lessonsBaseDir).filter(dir => fs.statSync(path.join(lessonsBaseDir, dir)).isDirectory());

    console.log(`Found year directories: ${yearDirs.join(', ')}`);

    // Loop through each year directory
    for (const yearDir of yearDirs) {
        const yearNumber = yearDir.replace('year', '');
        const yearPath = path.join(lessonsBaseDir, yearDir);
        const specialtyDirs = fs.readdirSync(yearPath).filter(dir => fs.statSync(path.join(yearPath, dir)).isDirectory());

        // Loop through each specialty inside the year
        for (const specialtyDir of specialtyDirs) {
            const specialtyPath = path.join(yearPath, specialtyDir);
            const lessonFiles = fs.readdirSync(specialtyPath).filter(file => file.endsWith('.md'));
            // Process each lesson file
            for (const lessonFile of lessonFiles) {
                const filePath = path.join(specialtyPath, lessonFile);
                const content = fs.readFileSync(filePath, 'utf8');
                const { data } = matter(content);

                if (!data.title || !data.slug || !data.summary) {
                    console.warn(`WARN: Missing required front matter in ${filePath}`);
                    continue;
                }

                lessonsIndex.push({
                    title: data.title,
                    slug: data.slug,
                    path: `lessons/${yearDir}/${specialtyDir}/${lessonFile}`,
                    quizPath: `questions/${yearDir}/${specialtyDir}/${lessonFile.replace('.md', '.json')}`,
                    year: parseInt(yearNumber), // Store year as a number
                    specialty: data.specialty,
                    subspecialty: data.subspecialty,
                    summary: data.summary,
                    duration: data.duration,
                    tags: data.tags || [],
                    version: data.version || '1.0'
                });
            }
        }
    }

    // Write the main lessons index
    fs.writeFileSync(indexPath, JSON.stringify(lessonsIndex, null, 2));
    console.log(`Successfully generated lessons-index.json with ${lessonsIndex.length} total entries.`);

    // Generate the search index
    const searchIndex = lunr(function () {
        this.ref('slug');
        this.field('title', { boost: 10 });
        this.field('summary');
        this.field('tags', { boost: 5 });
        this.field('specialty');
        
        lessonsIndex.forEach(doc => this.add(doc));
    });

    fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex));
    console.log('Successfully generated search-index.json.');

} catch (error) {
    console.error('Error during index generation:', error);
    process.exit(1);
}
