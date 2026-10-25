const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", async (req, res) => {
  try {
    await db.checkConnection();
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(503).json({
      status: "error",
      database: "disconnected"
    });
  }
});

app.get("/api/conversions", async (req, res) => {
  try {
    res.json(await db.getConversions());
  } catch (error) {
    console.error("Loading conversions failed:", error.message);
    res.status(500).json({ error: "Could not load conversions" });
  }
});

app.post("/api/conversions", async (req, res) => {
  const { weight, fromUnit, toUnit, result } = req.body || {};

  if (
    weight === "" ||
    weight == null ||
    !Number.isFinite(Number(weight)) ||
    Number(weight) < 0 ||
    !["kg", "g", "lbs", "oz", "stones"].includes(fromUnit) ||
    !["kg", "g", "lbs", "oz", "stones"].includes(toUnit) ||
    result === "" ||
    result == null ||
    !Number.isFinite(Number(result)) ||
    Number(result) < 0
  ) {
    return res.status(400).json({ error: "Invalid conversion data" });
  }

  try {
    const saved = await db.createConversion({
      weight,
      fromUnit,
      toUnit,
      result
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error("Saving conversion failed:", error.message);
    res.status(500).json({ error: "Could not save conversion" });
  }
});

app.delete("/api/conversions/:id", async (req, res) => {
  try {
    await db.deleteConversion(req.params.id);
    res.json({ success: true });
  } catch (error) {
    const invalidId = error.message === "Invalid conversion ID";
    const missing = error.message === "Conversion not found";

    res.status(invalidId ? 400 : missing ? 404 : 500).json({
      error: invalidId || missing ? error.message : "Could not delete conversion"
    });
  }
});

app.delete("/api/conversions", async (req, res) => {
  try {
    await db.deleteAllConversions();
    res.json({ success: true });
  } catch (error) {
    console.error("Clearing conversions failed:", error.message);
    res.status(500).json({ error: "Could not clear history" });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(__dirname, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.listen(PORT, () => {
  console.log(`Weight Calculator running on port ${PORT}`);
});
