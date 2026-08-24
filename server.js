// server.js
const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "."))); // Serve files from current folder

// --- API ROUTES ---

// GET all conversions
app.get("/api/conversions", async (req, res) => {
  try {
    const rows = await db.getConversions();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new conversion
app.post("/api/conversions", async (req, res) => {
  const { weight, fromUnit, toUnit, result } = req.body;
  if (weight == null || !fromUnit || !toUnit || result == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const resultObj = await db.createConversion({
      weight,
      fromUnit,
      toUnit,
      result,
    });
    res.status(201).json({ id: resultObj.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a single conversion
app.delete("/api/conversions/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    await db.deleteConversion(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all conversions (Clear history)
app.delete("/api/conversions", async (req, res) => {
  try {
    await db.deleteAllConversions();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`⚖️  Weight Lab server running at http://localhost:${PORT}`);
});
