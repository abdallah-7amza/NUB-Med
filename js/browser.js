document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const currentPathStr = params.get('path') || '';
    const currentPathParts = currentPathStr ? currentPathStr.split('/') : [];

    const titleEl = document.getElementById('page-title');
    const containerEl = document.getElementById('content-container');
    const breadcrumbEl = document.getElementById('breadcrumb-nav');

    const response = await fetch('lessons-index.json?v=' + new Date().getTime());
    const allLessons = await response.json();

    // --- Generate Breadcrumbs (CORRECTED) ---
    let pathAccumulator = '';
    // This link now correctly points to the main index page
    const homeLink = '<a href="index.html">Home</a>'; 
    const breadcrumbLinks = currentPathParts.map(part => {
        pathAccumulator += (pathAccumulator ? '/' : '') + part;
        const capitalizedPart = part.charAt(0).toUpperCase() + part.slice(1);
        return `<a href="browser.html?path=${pathAccumulator}">${capitalizedPart}</a>`;
    });
    // Only show breadcrumbs if we are inside a path
    if (currentPathStr) {
        breadcrumbEl.innerHTML = [homeLink, ...breadcrumbLinks].join(' &raquo; ');
    } else {
         breadcrumbEl.innerHTML = 'Select an academic year below:'; // Or leave it empty
    }
    
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
        const titleText = currentPathParts.length > 0 ? `Topics in ${currentPathParts[currentPathParts.length - 1]}` : 'Available Years';
        titleEl.textContent = titleText;
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
        // If there are no subfolders AND no lessons, it means we are at the root
        // So we show the years. This makes index.html optional.
        const years = [...new Set(allLessons.map(lesson => lesson.pathParts[0]))];
        titleEl.textContent = 'Select an Academic Year';
        years.forEach(year => {
             const card = document.createElement('a');
            card.className = 'card';
            card.href = `browser.html?path=${year}`;
            card.innerHTML = `<h3>${year.charAt(0).toUpperCase() + year.slice(1)}</h3>`;
            containerEl.appendChild(card);
        });
    }
});
