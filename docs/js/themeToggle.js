function initThemeToggle() { 
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const themeIcon = themeToggle.querySelector('i');
    const themeText = themeToggle.querySelector('span');

    // Saved preference
    function initTheme() {
        const savedTheme = localStorage.getItem('currentTheme');
        const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        const theme = savedTheme || (systemPrefersLight ? 'light' : 'dark');
        applyTheme(theme);
    }

    // Apply theme consistently
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            themeText.textContent = 'Light Mode';
        } else {
            document.body.classList.remove('light-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            themeText.textContent = 'Dark Mode';
        }
        localStorage.setItem('currentTheme', theme);
    }

    // Toggle
    themeToggle.addEventListener('click', function() {
        const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    initTheme();
}