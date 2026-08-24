// database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "weight.db");
const db = new sqlite3.Database(dbPath);

// Initialize the table
db.run(`
  CREATE TABLE IF NOT EXISTS conversions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight REAL NOT NULL,
    fromUnit TEXT NOT NULL,
    toUnit TEXT NOT NULL,
    result REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Helper to run queries with promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// --- CRUD Functions ---
function getConversions() {
  return getAll("SELECT * FROM conversions ORDER BY timestamp DESC");
}

function createConversion({ weight, fromUnit, toUnit, result }) {
  return runQuery(
    "INSERT INTO conversions (weight, fromUnit, toUnit, result) VALUES (?, ?, ?, ?)",
    [weight, fromUnit, toUnit, result],
  );
}

function deleteConversion(id) {
  return runQuery("DELETE FROM conversions WHERE id = ?", [id]);
}

function deleteAllConversions() {
  return runQuery("DELETE FROM conversions");
}

module.exports = {
  getConversions,
  createConversion,
  deleteConversion,
  deleteAllConversions,
};
