import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY!;
const SECRET_KEY = process.env.AMAZON_SECRET_KEY!;
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG!;

// Placeholder route for testing
app.get("/", (req, res) => {
  res.send("Amazon GPT backend is running.");
});

// Example search endpoint
app.get("/search", async (req, res) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: "Missing search query (?q=...)" });
  }

  // Normally, you'd make a real call to the Amazon API here.
  // For now, we'll just simulate a result.
  res.json({
    query,
    results: [
      {
        title: `Sample result for "${query}"`,
        price: "$19.99",
        url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${ASSOCIATE_TAG}`
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
