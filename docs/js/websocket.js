let ws = null;

function initWebSocket() {
    console.log("Initializing WebSocket...");

    ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
        appendWSMessage("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
        appendWSMessage("Server: " + event.data);
    };

    ws.onclose = () => {
        appendWSMessage("WebSocket disconnected");
    };

    ws.onerror = (err) => {
        appendWSMessage("WebSocket error");
        console.error(err);
    };
}

function sendWSMessage() {
    const input = document.getElementById("ws-input");
    const text = input.value.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(text);
    appendWSMessage("You: " + text);
    input.value = "";
}

function appendWSMessage(text) {
    const box = document.getElementById("ws-box");
    if (!box) return;

    const p = document.createElement("p");
    p.textContent = text;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
}
