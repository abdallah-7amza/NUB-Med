// js/browser.js (Final Version with Original Style)
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const currentPathStr = params.get('path') || '';
    const currentPathParts = currentPathStr ? currentPathStr.split('/') : [];

    const titleEl = document.getElementById('page-title');
    const containerEl = document.getElementById('content-container');
    const breadcrumbEl = document.getElementById('breadcrumb-nav');

    // --- 1. Generate Breadcrumbs ---
    const homeLink = '<a href="index.html">Home</a>';
    if (currentPathStr) {
        let pathAccumulator = '';
        const breadcrumbLinks = currentPathParts.map(part => {
            pathAccumulator += (pathAccumulator ? '/' : '') + part;
            const capitalizedPart = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<a href="browser.html?path=${pathAccumulator}">${capitalizedPart}</a>`;
        });
        breadcrumbEl.innerHTML = [homeLink, ...breadcrumbLinks].join(' &raquo; ');
    } else {
        breadcrumbEl.innerHTML = homeLink;
    }

    if (!currentPathStr) {
        titleEl.textContent = 'Please Select a Year';
        containerEl.innerHTML = '<p style="text-align: center;">Please return to the Home page to select an academic year.</p>';
        return;
    }

    // --- 2. Fetch Data and Prepare Items ---
    const response = await fetch('lessons-index.json?v=' + new Date().getTime());
    const allLessons = await response.json();

    const itemsToDisplay = [];

    // Find all unique subfolders at the next level
    const subfolders = [...new Set(
        allLessons
            .filter(lesson =>
                lesson.pathParts.length > currentPathParts.length + 1 &&
                currentPathParts.every((part, i) => part === lesson.pathParts[i])
            )
            .map(lesson => lesson.pathParts[currentPathParts.length])
    )];

    subfolders.forEach(folder => {
        itemsToDisplay.push({
            type: 'folder',
            name: folder,
            path: [...currentPathParts, folder].join('/')
        });
    });

    // Filter for lessons directly in the current folder
    const directLessons = allLessons.filter(lesson =>
        lesson.pathParts.length === currentPathParts.length + 1 &&
        currentPathParts.every((part, i) => part === lesson.pathParts[i])
    );

    directLessons.forEach(lesson => {
        itemsToDisplay.push({
            type: 'lesson',
            name: lesson.title,
            slug: lesson.slug,
            path: currentPathStr
        });
    });

    // --- 3. Render Content in a Single Grid ---
    containerEl.innerHTML = ''; // Clear previous content
    titleEl.textContent = currentPathParts.length > 0 ? currentPathParts[currentPathParts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Home';
    
    if (itemsToDisplay.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'grid-container';
        itemsToDisplay.forEach(item => {
            const card = document.createElement('a');
            card.className = 'card';
            if (item.type === 'folder') {
                card.href = `browser.html?path=${item.path}`;
                card.innerHTML = `<h3>📁 ${item.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>`;
            } else { // type is 'lesson'
                card.href = `lesson.html?lesson=${item.slug}&path=${item.path}`;
                card.innerHTML = `<h3>📄 ${item.name}</h3>`;
            }
            grid.appendChild(card);
        });
        containerEl.appendChild(grid);
    } else {
        containerEl.innerHTML = '<p style="text-align: center;">No content found in this section.</p>';
    }
});
