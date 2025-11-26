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

            // Evaluation page logic (MINIMAL ADDITION)
            if (hash === '/evaluation') {

                // Load Chart.js first
                const chartScript = document.createElement("script");
                chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
                chartScript.onload = () => {
                    console.log("Chart.js loaded");

                    // Ensure scripts.js functions are reinitialized
                    if (typeof initEvaluationPage === "function") {
                        initEvaluationPage();
                    } else {
                        console.error("initEvaluationPage() missing");
                    }

                    // Load websocket.js
                    const wsScript = document.createElement("script");
                    wsScript.src = "js/websocket.js";
                    wsScript.onload = () => {
                        console.log("websocket.js loaded");
                        if (typeof initWebSocket === "function") {
                            initWebSocket();
                        } else {
                            console.error("initWebSocket() missing");
                        }
                    };

                    document.body.appendChild(wsScript);
                };

                document.body.appendChild(chartScript);
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