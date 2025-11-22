const routes = {
    '/': 'home.html',
    '/about': 'about.html',
    '/projects': 'projects.html',
    '/blog': 'blog.html',
    '/resume': 'resume.html',
    '/contact': 'contact.html'
};

function loadPage() {
    const hash = location.hash.replace('#', '') || '/';
    const page = routes[hash];

    if (!page) {
        document.getElementById('app').innerHTML =
            "<h2 style='text-align:center;padding:2rem'>404 - Page Not Found</h2>";
        return;
    }

    fetch(page)
        .then(res => res.text())
        .then(html => {
            document.getElementById('app').innerHTML = html;
            setActiveLink();
        });
}

window.addEventListener('hashchange', loadPage);
window.addEventListener('DOMContentLoaded', loadPage);
