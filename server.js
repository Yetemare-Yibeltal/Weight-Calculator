const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));

// --- HEALTH CHECK ---
app.get("/api/health", async (req, res) => {
  try {
    await db.getConversions();
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", database: "disconnected", error: err.message });
  }
});

// --- API ROUTES ---
app.get("/api/conversions", async (req, res) => {
  try {
    const rows = await db.getConversions();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.delete("/api/conversions", async (req, res) => {
  try {
    await db.deleteAllConversions();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATCH‑ALL: serve index.html for unmatched routes ---
// Use "/*" instead of "*" to work with newer Express versions.
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`⚖️  Weight Lab server running at http://localhost:${PORT}`);
});
