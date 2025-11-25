const routes = {
    '/': 'home.html',
    '/about': 'about.html',
    '/projects': 'projects.html',
    '/blog': 'blog.html',
    '/resume': 'resume.html',
    '/contact': 'contact.html',
    '/evaluation': 'evaluation.html'
};

function loadPage() {
    const hash = location.hash.replace('#', '') || '/';
    const page = routes[hash];

    if (!page) {
        document.getElementById('app').innerHTML =
            "<h2 style='text-align:center; padding:2rem;'>404 - Page Not Found</h2>";
        return;
    }

    fetch(page)
        .then(res => res.text())
        .then(html => {
            document.getElementById('app').innerHTML = html;

            setActiveLink();

            // Blog page special logic
            if (hash === '/blog') {
                if (typeof loadBlogPosts === 'function') {
                    loadBlogPosts();
                } else {
                    console.error("loadBlogPosts() not found.");
                }
            }

            // WebSocket page logic
            if (hash === '/evaluation') {

                // Load websocket.js dynamically
                const script = document.createElement("script");
                script.src = "js/websocket.js";
                script.onload = () => {
                    console.log("websocket.js loaded");
                    if (typeof initWebSocket === "function") initWebSocket();
                    else console.error("initWebSocket still missing");
                };

                document.body.appendChild(script);
            }

        })
        .catch(err => {
            console.error(`Failed to load ${page}:`, err);
            document.getElementById('app').innerHTML =
                "<h2 style='text-align:center; padding:2rem;'>Error loading page</h2>";
        });
}

window.addEventListener('hashchange', loadPage);
window.addEventListener('DOMContentLoaded', loadPage);
