// tools/generateIndex.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const lunr = require('lunr');

const lessonsDir = path.join(__dirname, '../lessons/year5'); // We'll focus on year5 for now
const indexPath = path.join(__dirname, '../lessons-index.json');
const searchIndexPath = path.join(__dirname, '../search-index.json');

console.log('Starting index generation...');

try {
    const lessonFiles = [];
    const specialties = fs.readdirSync(lessonsDir);

    for (const specialty of specialties) {
        const specialtyPath = path.join(lessonsDir, specialty);
        if (fs.statSync(specialtyPath).isDirectory()) {
            const files = fs.readdirSync(specialtyPath).filter(file => file.endsWith('.md'));
            for (const file of files) {
                lessonFiles.push({ specialty, file, path: path.join(specialtyPath, file) });
            }
        }
    }

    console.log(`Found ${lessonFiles.length} lesson files.`);

    const lessonsIndex = lessonFiles.map(({ specialty, file, path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content); // Use gray-matter to parse front matter

        // Basic validation
        if (!data.title || !data.slug || !data.summary) {
            console.warn(`WARN: Missing required front matter in ${file}`);
            return null;
        }

        return {
            title: data.title,
            slug: data.slug,
            path: `lessons/year5/${specialty}/${file}`,
            quizPath: `questions/year5/${specialty}/${file.replace('.md', '.json')}`,
            year: data.year,
            specialty: data.specialty,
            subspecialty: data.subspecialty,
            summary: data.summary,
            duration: data.duration,
            tags: data.tags || [],
            version: data.version || '1.0'
        };
    }).filter(Boolean); // Remove nulls from failed validations

    // Write the main lessons index
    fs.writeFileSync(indexPath, JSON.stringify(lessonsIndex, null, 2));
    console.log(`Successfully generated lessons-index.json with ${lessonsIndex.length} entries.`);

    // Generate the search index using lunr
    const searchIndex = lunr(function () {
        this.ref('slug');
        this.field('title', { boost: 10 });
        this.field('summary');
        this.field('tags', { boost: 5 });
        this.field('specialty');
        this.field('subspecialty');

        lessonsIndex.forEach(doc => {
            this.add(doc);
        });
    });

    fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex));
    console.log('Successfully generated search-index.json.');

} catch (error) {
    console.error('Error during index generation:', error);
    process.exit(1);
}
