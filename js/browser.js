document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const currentPathStr = params.get('path') || '';
    const currentPathParts = currentPathStr ? currentPathStr.split('/') : [];

    const titleEl = document.getElementById('page-title');
    const containerEl = document.getElementById('content-container');
    const breadcrumbEl = document.getElementById('breadcrumb-nav');

    // --- 1. Generate Breadcrumbs (Final Version) ---
    // The "Home" link will ALWAYS point to index.html, your true main page.
    const homeLink = '<a href="index.html">Home</a>';
    if (currentPathStr) {
        let pathAccumulator = '';
        const breadcrumbLinks = currentPathParts.map(part => {
            pathAccumulator += (pathAccumulator ? '/' : '') + part;
            const capitalizedPart = part.charAt(0).toUpperCase() + part.slice(1);
            return `<a href="browser.html?path=${pathAccumulator}">${capitalizedPart}</a>`;
        });
        breadcrumbEl.innerHTML = [homeLink, ...breadcrumbLinks].join(' &raquo; ');
    } else {
        // If there is no path, we just show a simple instruction.
        breadcrumbEl.innerHTML = homeLink; 
    }

    // Stop execution if no path is provided.
    if (!currentPathStr) {
        titleEl.textContent = 'Please select a topic';
        containerEl.innerHTML = '<p style="text-align: center;">Please return to the Home page to select an academic year.</p>';
        return; // Exit the function here
    }

    // --- 2. Fetch and Render Content (Only runs if a path exists) ---
    const response = await fetch('lessons-index.json?v=' + new Date().getTime());
    const allLessons = await response.json();
    
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
    
    containerEl.innerHTML = '';

    if (subfolders.length > 0) {
        titleEl.textContent = `Topics in ${currentPathParts[currentPathParts.length - 1]}`;
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
            card.href = `lesson.html?lesson=${lesson.slug}&path=${currentPathStr}`;
            card.innerHTML = `<h3>${lesson.title}</h3>`;
            containerEl.appendChild(card);
        });
    } else {
        titleEl.textContent = 'No content found here.';
    }
});
