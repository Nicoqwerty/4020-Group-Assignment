function loadComponent(url, elementId) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById(elementId);
            if (!container) {
                console.error(`Element with ID ${elementId} not found`);
                return;
            }
            container.innerHTML = html;
            
            if (elementId === 'headerLoad') {
                initThemeToggle(); // Initialize theme toggle
                setActiveLink();   // Set active navigation link
            }
        })
        .catch(error => console.error(`Error loading ${url}:`, error));
}

function setActiveLink() {
    const currentPage = location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header.html', 'headerLoad');
    loadComponent('footer.html', 'footerLoad');
});