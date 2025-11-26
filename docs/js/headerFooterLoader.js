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
                initAssistant();   // Initialize Assistant
            }
        })
        .catch(error => console.error(`Error loading ${url}:`, error));
}

function setActiveLink() {
    const currentPage = location.hash || '#/';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (link.getAttribute('href') === currentPage) {
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

/* ----------------------------------------- Dynamic Assistant ---------------------------------- */

function initAssistant() {
    let bubbleVisible = true;

    const assistantBubble = document.getElementById("assistant-bubble");
    const assistantIcon = document.getElementById("assistant-icon");

    assistantIcon.addEventListener("click", () => {
        bubbleVisible = !bubbleVisible;
        assistantBubble.style.display = bubbleVisible ? "block" : "none";
    });



    if (!assistantBubble || !assistantIcon) {
        console.error("Assistant elements not found.");
        return;
    }

    const messages = [
        "Group: John Laurence Mislang, Nicolas Giammarresi, Roman Chaidiouk",
        "Evaluating ChatGPT across multiple domains.",
        "Datasets Evaluated: History, Social Science, Cybersecurity.",
        "Backend uses Node.js, MongoDB, and WebSockets.",
        "Results page's charts will display accuracy and response time.",
        "Hash routing used to keep the site smooth and fast!"
    ];

    let index = 0;

    function showMessage() {
        if (!bubbleVisible) return;

        assistantBubble.classList.add("fade-out");

        setTimeout(() => {
            assistantBubble.textContent = messages[index];
            assistantBubble.classList.remove("fade-out");
            assistantBubble.style.display = "block";
            index = (index + 1) % messages.length;
        }, 500);
    }

    showMessage();

    setInterval(showMessage, 6000);
}
