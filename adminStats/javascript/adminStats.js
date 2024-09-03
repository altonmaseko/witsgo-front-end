function showStats(pageId, title) {
    const pages = document.querySelectorAll('#stats-content .stats-page');
    pages.forEach(page => page.style.display = 'none');
    
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    const statsTitle = document.getElementById('stats-title');
    if (statsTitle) {
        statsTitle.textContent = title;
    }
}
