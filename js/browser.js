document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const currentPathStr = params.get('path') || '';
    const currentPathParts = currentPathStr ? currentPathStr.split('/') : [];

    const titleEl = document.getElementById('page-title');
    const containerEl = document.getElementById('content-container');
    const breadcrumbEl = document.getElementById('breadcrumb-nav');

    // Fetch the main index
    const response = await fetch('lessons-index.json');
    const allLessons = await response.json();

    // --- 1. Generate Breadcrumbs ---
    let pathAccumulator = '';
    const homeLink = '<a href="browser.html">Home</a>';
    const breadcrumbLinks = currentPathParts.map(part => {
        pathAccumulator += (pathAccumulator ? '/' : '') + part;
        const capitalizedPart = part.charAt(0).toUpperCase() + part.slice(1);
        return `<a href="browser.html?path=${pathAccumulator}">${capitalizedPart}</a>`;
    });
    breadcrumbEl.innerHTML = [homeLink, ...breadcrumbLinks].join(' &raquo; ');
    
    // --- 2. Filter content based on the current path ---
    const directLessons = allLessons.filter(lesson => 
        lesson.pathParts.length === currentPathParts.length && 
        lesson.pathParts.every((part, i) => part === currentPathParts[i])
    );

    const subfolders = [...new Set(
        allLessons
            .filter(lesson => 
                lesson.pathParts.length > currentPathParts.length && 
                currentPathParts.every((part, i) => part === lesson.pathParts[i])
            )
            .map(lesson => lesson.pathParts[currentPathParts.length])
    )];

    // --- 3. Render the content ---
    containerEl.innerHTML = ''; // Clear previous content

    if (subfolders.length > 0) {
        titleEl.textContent = currentPathParts.length > 0 ? `Sub-topics in ${currentPathParts[currentPathParts.length - 1]}` : 'Select a Topic';
        subfolders.forEach(folder => {
            const card = document.createElement('a');
            card.className = 'card';
            const newPath = [...currentPathParts, folder].join('/');
            card.href = `browser.html?path=${newPath}`;
            card.innerHTML = `<h3>${folder.charAt(0).toUpperCase() + folder.slice(1)}</h3>`;
            containerEl.appendChild(card);
        });
    } else if (directLessons.length > 0) {
        titleEl.textContent = `Lessons in ${currentPathParts[currentPathParts.length - 1]}`;
        directLessons.forEach(lesson => {
            const card = document.createElement('a');
            card.className = 'card';
            // IMPORTANT: Pass the current path to the lesson page
            card.href = `lesson.html?lesson=${lesson.slug}&path=${currentPathStr}`;
            card.innerHTML = `<h3>${lesson.title}</h3>`;
            containerEl.appendChild(card);
        });
    } else {
        titleEl.textContent = 'No content found here.';
    }
});
