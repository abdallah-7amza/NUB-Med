const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const lessonsBaseDir = path.join(__dirname, '../lessons');
const indexPath = path.join(__dirname, '../lessons-index.json');

console.log('Starting deep hierarchical index generation...');
const lessonsIndex = [];

function scanDirectory(directory, currentPath = []) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // If it's a directory, scan it recursively
            scanDirectory(fullPath, [...currentPath, file]);
        } else if (file.endsWith('.md')) {
            // If it's a lesson file, process it
            const content = fs.readFileSync(fullPath, 'utf8');
            const { data } = matter(content);

            if (!data.title || !data.slug) {
                console.warn(`WARN: Missing required front matter in ${fullPath}`);
                return;
            }

            lessonsIndex.push({
                title: data.title,
                slug: data.slug,
                // Store the full path for linking
                fullPath: `lessons/${[...currentPath, file].join('/')}`,
                // Store path parts for filtering and navigation
                pathParts: currentPath 
            });
        }
    });
}

try {
    scanDirectory(lessonsBaseDir);
    fs.writeFileSync(indexPath, JSON.stringify(lessonsIndex, null, 2));
    console.log(`Successfully generated lessons-index.json with ${lessonsIndex.length} entries.`);
} catch (error) {
    console.error('Error during index generation:', error);
    process.exit(1);
}
