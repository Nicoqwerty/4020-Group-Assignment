console.log("scripts.js loaded");

// ------------------- BLOG POSTS -------------------
function loadBlogPosts() {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;  // Only run on blog page

    fetch('data/posts.json')
        .then(response => response.json())
        .then(posts => {
            blogList.innerHTML = ""; // Clear previous posts

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


// ------------------- EVALUATION PAGE INIT -------------------
function initEvaluationPage() {
    console.log("Initializing Evaluation Page…");

    setupRunEvaluation();
    setupLoadResults();
    setupCharts();
}


// ------------------- RUN GPT EVALUATION -------------------
function setupRunEvaluation() {
    const runBtn = document.getElementById("runEvalBtn");
    if (!runBtn) return;

    runBtn.addEventListener("click", async () => {
        try {
            runBtn.disabled = true;
            runBtn.innerText = "Running…";

            const res = await fetch("/api/run-gpt-50");
            const data = await res.json();

            alert("Finished processing " + data.count + " questions.");

            runBtn.disabled = false;
            runBtn.innerText = "Run Evaluation";

        } catch (err) {
            console.error(err);
            alert("Error starting evaluation.");
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

            if (!data.success) {
                document.getElementById("resultsOutput").innerHTML =
                    "<p>No results found.</p>";
                return;
            }

            displaySummary(data.stats);
            displayDetailedResults(data.results);

            // update response time chart
            if (window.responseChart) {
                const labels = data.results.map((_, i) => "Q" + (i + 1));
                const times = data.results.map(r => r.response_time_ms);

                window.responseChart.data.labels = labels;
                window.responseChart.data.datasets[0].data = times;
                window.responseChart.update();
            }

        } catch (err) {
            console.error(err);
            alert("Error loading results.");
        }
    });
}


// ------------------- DISPLAY SUMMARY -------------------
function displaySummary(stats) {
    const out = document.getElementById("resultsOutput");

    out.innerHTML = `
        <p><strong>Total Answers:</strong> ${stats.total}</p>
        <p><strong>Average Response Time:</strong> ${stats.avgResponseTimeMs} ms</p>
        <p><strong>Accuracy:</strong> ${stats.accuracy}</p>

        <br><hr><br>

        <h3>Detailed Results</h3>
        <table class="resultTable">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Expected</th>
                    <th>GPT Answer</th>
                    <th>Correct?</th>
                    <th>Time (ms)</th>
                </tr>
            </thead>
            <tbody id="detailedResultsBody"></tbody>
        </table>
    `;
}


// ------------------- DETAILED RESULTS TABLE -------------------
function displayDetailedResults(results) {
    const tbody = document.getElementById("detailedResultsBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    results.forEach((r, i) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${r.question}</td>
            <td>${r.correct}</td>
            <td>${r.gpt_answer}</td>
            <td style="color:${r.isCorrect ? 'lightgreen' : 'red'};">
                ${r.isCorrect ? "✔" : "✘"}
            </td>
            <td>${r.response_time_ms}</td>
        `;

        tbody.appendChild(tr);
    });
}


// ------------------- CHART SETUP -------------------
function setupCharts() {
    const chartCanvas = document.getElementById("responseChart");
    if (!chartCanvas || typeof Chart === "undefined") {
        console.warn("Chart.js not loaded yet.");
        return;
    }

    const ctx = chartCanvas.getContext("2d");

    window.responseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: "Response Time (ms)",
                data: [],
                borderColor: "#4caf50",
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: "#4caf50",
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}
