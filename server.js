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

//Result = 5 code
app.get('/api/add', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);

  if (isNaN(a) || isNaN(b)) {
    return res.status(400).json({ error: 'Both a and b must be numbers' });
  }

  const result = a + b;
  res.json({ result });
});

// GPT test
app.get("/api/test-gpt", async (req, res) => {
  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello, test connection!" }]
    });

    res.json({
      success: true,
      answer: gptResponse.choices[0].message.content
    });
  } catch (err) {
    console.error("OpenAI test error:", err);
    res.status(500).json({ error: "OpenAI test failed", details: err.message });
  }
});

// -------- GPT + DATABASE SETUP -------- //

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

// ------------------- Simple message storage (unchanged) -------------------

app.post('/api/message', async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ error: "Text is required." });
  }

  const messages = db.collection("messages");
  await messages.insertOne({ text, createdAt: new Date() });

  res.json({ success: true, message: "Saved to database." });
});

app.get('/api/messages', async (req, res) => {
  const messages = db.collection("messages");
  const data = await messages.find().toArray();

  res.json(data);
});

// ------------------------- GPT MULTIPLE-CHOICE PROCESSING -------------------------

app.get("/api/clear-gpt", async (req, res) => {
  try {
    const result = await db.collection("gpt_answers").deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/run-gpt-50", async (req, res) => {
  try {
    const questionDocs = await db.collection("sociology_cleaned")
                                 .find({})
                                 .limit(50)
                                 .toArray();

    const results = [];

    for (const doc of questionDocs) {

      const questionText = doc.question;
      const correctAnswer = (doc.correct || "").trim().toUpperCase();

      // Build prompt with choices
      const prompt =
        `You are answering a multiple-choice question. 
Return ONLY the correct letter (A, B, C, or D). Do not explain.

Question: ${doc.question}

A: ${doc.A}
B: ${doc.B}
C: ${doc.C}
D: ${doc.D}

Return ONLY a single letter.`;

      const start = Date.now();

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });

      let answer = gptResponse.choices?.[0]?.message?.content?.trim() || "N/A";

      // Sanitize GPT answer
      answer = answer.replace(/[^A-D]/gi, "").toUpperCase();
      if (!["A","B","C","D"].includes(answer)) {
        answer = "N/A";
      }

      const timeTaken = Date.now() - start;

      const isCorrect = (answer === correctAnswer);

      // Store in DB
      await db.collection("gpt_answers").insertOne({
        question: questionText,
        A: doc.A,
        B: doc.B,
        C: doc.C,
        D: doc.D,
        correct: correctAnswer,
        gpt_answer: answer,
        isCorrect,
        response_time_ms: timeTaken,
        createdAt: new Date()
      });

      results.push({
        question: questionText,
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

// ------------------------- RESULTS SUMMARY -------------------------

app.get("/api/results", async (req, res) => {
  try {
    const docs = await db.collection("gpt_answers").find().toArray();

    if (!docs.length) {
      return res.json({ success: false, msg: "No results yet." });
    }

    const avgTime =
      docs.reduce((acc, d) => acc + (d.response_time_ms || 0), 0) / docs.length;

    const accuracy =
      (docs.filter(d => d.isCorrect).length / docs.length * 100).toFixed(1);

    res.json({
      success: true,
      stats: {
        total: docs.length,
        avgResponseTimeMs: Math.round(avgTime),
        accuracy: accuracy + "%"
      },
      results: docs
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to compute results." });
  }
});

// ------------------------- START SERVER -------------------------

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ------------------------- WEBSOCKET SERVER (unchanged) -------------------------

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
    console.log("Client connected to WebSocket");

    socket.send("Connected to WebSocket Server!");

    socket.on("message", (msg) => {
        console.log("Client says:", msg.toString());
        socket.send("Server Received: " + msg);
        broadcast("Broadcast: " + msg);
    });

    socket.on("close", () => console.log("Client disconnected"));
});
