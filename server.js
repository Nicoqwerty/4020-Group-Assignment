require('dotenv').config();
console.log("OpenAI key loaded:", process.env.OPENAI_API_KEY ? "YES" : "NO");
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 3000;
const OpenAI = require("openai");

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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



//GPT stuff
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

app.get("/api/run-gpt-50", async (req, res) => {
  try {
    const questionDocs = await db.collection("sociology_cleaned")
                                 .find({})
                                 .limit(50)
                                 .toArray();

    const results = [];

    for (const doc of questionDocs) {
      const questionText = doc.question ?? doc[Object.keys(doc).find(k => k !== "_id")];
      if (!questionText) {
        console.log("Skipping doc with no question:", doc);
        continue;
      }

      console.log("Processing question:", questionText);

      const start = Date.now();

      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: questionText }
        ]
      });

      console.log("Raw GPT response:", gptResponse);

      const timeTaken = Date.now() - start;
      const answerText = gptResponse.choices?.[0]?.message?.content ?? "No response";

      await db.collection("gpt_answers").insertOne({
        question: questionText,
        gpt_answer: answerText,
        response_time_ms: timeTaken,
        createdAt: new Date()
      });

      results.push({
        question: questionText,
        gpt_answer: answerText,
        response_time_ms: timeTaken
      });
    }

    res.json({ success: true, count: results.length, results });

  } catch (err) {
    console.error("GPT processing error:", err);
    res.status(500).json({ 
      error: "GPT processing failed", 
      details: err.message,
      stack: err.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ----------------------------- WebSocket Server -----------------------------

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

        // Echo back only to sender
        socket.send("Server Received: " + msg);

        // Send to all connected clients
        broadcast("Broadcast: " + msg);
    });

    socket.on("close", () => console.log("Client disconnected"));
});
