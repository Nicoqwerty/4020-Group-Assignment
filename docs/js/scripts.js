console.log("scripts.js loaded");

// ------------------- BLOG POSTS -------------------
function loadBlogPosts() {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;

    fetch('data/posts.json')
        .then(response => response.json())
        .then(posts => {
            blogList.innerHTML = "";

            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'blog-post';

                postElement.innerHTML = `
                    <h2 class="post-title">${post.title}</h2>

                    <div class="post-meta">
                        <i class="fa-solid fa-calendar"></i>
                        <span class="space"></span>
                        <time>${new Date(post.date).toLocaleDateString()}</time>
                    </div>

                    <div class="post-content">${post.content}</div>
                `;

                blogList.appendChild(postElement);
            });
        })
        .catch(error => console.error('Error loading blog posts:', error));
}

// ------------------- EVALUATION INIT -------------------
function initEvaluationPage() {
    console.log("Initializing Evaluation Page…");

    setupRunEvaluation();
    setupLoadResults();
}

// ------------------- RUN GPT -------------------
function setupRunEvaluation() {
    const runBtn = document.getElementById("runEvalBtn");
    if (!runBtn) return;

    runBtn.addEventListener("click", async () => {
        try {
            runBtn.disabled = true;
            runBtn.innerText = "Running…";

            const res = await fetch("/api/run-gpt-50");
            const data = await res.json();

            alert(`Finished processing ${data.count} questions.`);

            runBtn.disabled = false;
            runBtn.innerText = "Run Evaluation";

        } catch (err) {
            console.error(err);
            alert("Error running evaluation.");
        }
    });
}

// ------------------- LOAD RESULTS -------------------
function setupLoadResults() {
    const loadBtn = document.getElementById("loadResultsBtn");
    if (!loadBtn) return;

    loadBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/results");
            const data = await res.json();

            const out = document.getElementById("resultsOutput");
            out.innerHTML = "";

            if (!data.success) {
                out.innerHTML = "<p>No results found.</p>";
                return;
            }

            // Render dataset tables WITHOUT charts
            if (data.datasets.computer_security_test)
                renderDataset("Computer Security", data.datasets.computer_security_test);

            if (data.datasets.prehistory_test_cleaned)
                renderDataset("Prehistory", data.datasets.prehistory_test_cleaned);

            if (data.datasets.sociology_cleaned)
                renderDataset("Sociology", data.datasets.sociology_cleaned);

            // Add ONE combined chart container
            out.innerHTML += `
                <h2 style="margin-top: 40px; color:#4caf50;">
                    Combined Response Time Chart
                </h2>
                <canvas id="combinedChart" width="600" height="200"
                    style="background:#1b1e24; border-radius:10px; padding:10px;">
                </canvas>
            `;

            renderCombinedChart(data.datasets);

        } catch (err) {
            console.error(err);
            alert("Error loading results.");
        }
    });
}

// ------------------- RENDER TABLE ONLY -------------------
function renderDataset(title, dataset) {
    if (!dataset || !dataset.results) return;

    const id = title.replace(/\s+/g, "");

    const out = document.getElementById("resultsOutput");

    out.innerHTML += `
        <h2 style="margin-top:40px; color:#d86060;">${title}</h2>

        <p><strong>Total Answers:</strong> ${dataset.stats.total}</p>
        <p><strong>Accuracy:</strong> ${dataset.stats.accuracy}</p>
        <p><strong>Avg Response Time:</strong> ${dataset.stats.avgResponseTimeMs} ms</p>

        <br>

        <table class="resultTable">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Expected</th>
                    <th>GPT</th>
                    <th>Correct?</th>
                    <th>Time (ms)</th>
                </tr>
            </thead>
            <tbody id="${id}_tbody"></tbody>
        </table>

        <br>
    `;

    const tbody = document.getElementById(`${id}_tbody`);

    dataset.results.forEach((r, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${r.question}</td>
                <td>${r.correct}</td>
                <td>${r.gpt_answer}</td>
                <td style="color:${r.isCorrect ? "lightgreen" : "red"};">
                    ${r.isCorrect ? "✔" : "✘"}
                </td>
                <td>${r.response_time_ms}</td>
            </tr>
        `;
    });
}

// ------------------- ONE COMBINED CHART -------------------
function renderCombinedChart(datasets) {
    const allRT = [];
    const labels = [];

    function pushDataset(name, set) {
        set.results.forEach((r, i) => {
            allRT.push(r.response_time_ms);
            labels.push(`${name} Q${i + 1}`);
        });
    }

    pushDataset("CS", datasets.computer_security_test);
    pushDataset("Pre", datasets.prehistory_test_cleaned);
    pushDataset("Soc", datasets.sociology_cleaned);

    const ctx = document.getElementById("combinedChart");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Response Times (ms)",
                data: allRT,
                borderColor: "#4caf50",
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true
        }
    });
}
