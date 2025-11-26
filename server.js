require('dotenv').config();
console.log("OpenAI key loaded:", process.env.OPENAI_API_KEY ? "YES" : "NO");

const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 3000;
const OpenAI = require("openai");

app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// ---------------- GPT CLIENT ----------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------------- MONGO CONNECTION ----------------
const uri = "mongodb+srv://nicog_db_user:PhjNsIHOuMU7Hq7a@4020ass.zqyqk7l.mongodb.net/?appName=4020Ass";
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    db = client.db("test");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}
connectDB();

// ---------------- CLEAR RESULTS ----------------

app.get("/api/clear-gpt", async (req, res) => {
  try {
    const result = await db.collection("gpt_answers").deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- RUN GPT ON 3 DATASETS ----------------

app.get("/api/run-gpt-50", async (req, res) => {
  try {
    const col1 = await db.collection("computer_security_test").find({}).limit(50).toArray();
    const col2 = await db.collection("prehistory_test_cleaned").find({}).limit(50).toArray();
    const col3 = await db.collection("sociology_cleaned").find({}).limit(50).toArray();

    // TAG each doc
    col1.forEach(q => q.source_collection = "computer_security_test");
    col2.forEach(q => q.source_collection = "prehistory_test_cleaned");
    col3.forEach(q => q.source_collection = "sociology_cleaned");

    let questionDocs = [...col1, ...col2, ...col3];
    questionDocs.sort(() => Math.random() - 0.5);

    const results = [];

    for (const doc of questionDocs) {
      const prompt = `
Return ONLY the correct option letter A, B, C, or D.

Question: ${doc.question}

A: ${doc.A}
B: ${doc.B}
C: ${doc.C}
D: ${doc.D}
`;

      const start = Date.now();

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });

      let answer = gptResponse.choices?.[0]?.message?.content?.trim() || "N/A";
      answer = answer.replace(/[^A-D]/gi, "").toUpperCase();
      if (!["A","B","C","D"].includes(answer)) answer = "N/A";

      const correctAnswer = (doc.correct || "").trim().toUpperCase();
      const isCorrect = answer === correctAnswer;
      const timeTaken = Date.now() - start;

      await db.collection("gpt_answers").insertOne({
        question: doc.question,
        A: doc.A, B: doc.B, C: doc.C, D: doc.D,
        correct: correctAnswer,
        gpt_answer: answer,
        isCorrect,
        response_time_ms: timeTaken,
        createdAt: new Date(),
        source_collection: doc.source_collection   
      });

      results.push({
        question: doc.question,
        correct: correctAnswer,
        gpt_answer: answer,
        isCorrect,
        response_time_ms: timeTaken
      });
    }

    res.json({ success: true, count: results.length, results });

  } catch (err) {
    console.error("GPT processing error:", err);
    res.status(500).json({ error: "GPT processing failed", details: err.message });
  }
});

// ---------------- RETURN GROUPED RESULTS ----------------

app.get("/api/results", async (req, res) => {
  try {
    const docs = await db.collection("gpt_answers").find().toArray();

    if (!docs.length) {
      return res.json({ success: false, msg: "No results yet." });
    }

    const datasets = {
      computer_security_test: [],
      prehistory_test_cleaned: [],
      sociology_cleaned: []
    };

    docs.forEach(d => {
      if (datasets[d.source_collection]) {
        datasets[d.source_collection].push(d);
      }
    });

    const computeStats = arr => {
      if (!arr.length) return {
        total: 0, accuracy: "0%", avgResponseTimeMs: 0
      };

      const accuracy =
        (arr.filter(x => x.isCorrect).length / arr.length * 100).toFixed(1);

      const avg =
        Math.round(arr.reduce((a, b) => a + b.response_time_ms, 0) / arr.length);

      return {
        total: arr.length,
        accuracy: accuracy + "%",
        avgResponseTimeMs: avg
      };
    };

    res.json({
      success: true,
      datasets: {
        computer_security_test: {
          stats: computeStats(datasets.computer_security_test),
          results: datasets.computer_security_test
        },
        prehistory_test_cleaned: {
          stats: computeStats(datasets.prehistory_test_cleaned),
          results: datasets.prehistory_test_cleaned
        },
        sociology_cleaned: {
          stats: computeStats(datasets.sociology_cleaned),
          results: datasets.sociology_cleaned
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to compute results." });
  }
});

// ---------------- START SERVER ----------------

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ---------------- WEBSOCKET ----------------
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3001 });

console.log("WebSocket server running on ws://localhost:3001");

function broadcast(msg) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

wss.on("connection", (socket) => {
    console.log("Client connected");
    socket.send("Connected to WebSocket");

    socket.on("message", msg => {
        socket.send("Server Received: " + msg);
        broadcast("Broadcast: " + msg);
    });
});
