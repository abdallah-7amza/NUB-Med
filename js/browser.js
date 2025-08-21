// js/browser.js (UPGRADED with Dual-Section Display)
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

    // --- 2. Fetch Data and Filter ---
    const response = await fetch('lessons-index.json?v=' + new Date().getTime());
    const allLessons = await response.json();

    // Filter for lessons directly in the current folder
    const directLessons = allLessons.filter(lesson =>
        lesson.pathParts.length === currentPathParts.length + 1 &&
        currentPathParts.every((part, i) => part === lesson.pathParts[i])
    );

    // Find all unique subfolders at the next level
    const subfolders = [...new Set(
        allLessons
            .filter(lesson =>
                lesson.pathParts.length > currentPathParts.length + 1 &&
                currentPathParts.every((part, i) => part === lesson.pathParts[i])
            )
            .map(lesson => lesson.pathParts[currentPathParts.length])
    )];

    // --- 3. Render Content ---
    containerEl.innerHTML = ''; // Clear previous content
    titleEl.textContent = currentPathParts.length > 0 ? currentPathParts[currentPathParts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Home';
    
    let contentRendered = false;

    // Render Subfolders section if they exist
    if (subfolders.length > 0) {
        containerEl.innerHTML += '<h2>Sub-Topics</h2>';
        const subfolderGrid = document.createElement('div');
        subfolderGrid.className = 'grid-container';
        subfolders.forEach(folder => {
            const card = document.createElement('a');
            card.className = 'card';
            const newPath = [...currentPathParts, folder].join('/');
            card.href = `browser.html?path=${newPath}`;
            card.innerHTML = `<h3>📁 ${folder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>`;
            subfolderGrid.appendChild(card);
        });
        containerEl.appendChild(subfolderGrid);
        contentRendered = true;
    }

    // Render Lessons section if they exist
    if (directLessons.length > 0) {
        containerEl.innerHTML += '<h2>Lessons</h2>';
        const lessonGrid = document.createElement('div');
        lessonGrid.className = 'grid-container';
        directLessons.forEach(lesson => {
            const card = document.createElement('a');
            card.className = 'card';
            card.href = `lesson.html?lesson=${lesson.slug}&path=${currentPathStr}`;
            card.innerHTML = `<h3>📄 ${lesson.title}</h3>`;
            lessonGrid.appendChild(card);
        });
        containerEl.appendChild(lessonGrid);
        contentRendered = true;
    }

    if (!contentRendered) {
        containerEl.innerHTML = '<p style="text-align: center;">No content found in this section.</p>';
    }
});
