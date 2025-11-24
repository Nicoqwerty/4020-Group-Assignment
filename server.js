require('dotenv').config();
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

 const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// -----------------------------------
// MONGODB (OFFICIAL DRIVER ONLY)
// -----------------------------------
const uri = "mongodb+srv://nicog_db_user:PhjNsIHOuMU7Hq7a@4020ass.zqyqk7l.mongodb.net/?appName=4020Ass";
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    db = client.db("test"); // choose your database, e.g., test
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

connectDB();

// -----------------------------------
// INSERT DATA ROUTE
// -----------------------------------
app.post('/api/message', async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ error: "Text is required." });
  }

  const messages = db.collection("messages");
  await messages.insertOne({ text, createdAt: new Date() });

  res.json({ success: true, message: "Saved to database." });
});

// -----------------------------------
// READ DATA ROUTE
// -----------------------------------
app.get('/api/messages', async (req, res) => {
  const messages = db.collection("messages");
  const data = await messages.find().toArray();

  res.json(data);
});

// -----------------------------------
// FETCH CSV COLLECTION
// -----------------------------------
app.get('/api/result', async (req, res) => {
  try {
    const sociologyCollection = db.collection("sociology_test"); // your CSV collection
    const data = await sociologyCollection.find().limit(50).toArray(); // fetch first 50 rows
    res.json(data);
  } catch (err) {
    console.error("Error fetching sociology_test:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});


// -----------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
