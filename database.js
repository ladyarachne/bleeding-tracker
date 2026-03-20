const Database = require('better-sqlite3');
const path = require('path');

console.log("DATABASE FILE LOADED");

const dbPath = path.join(__dirname, 'tracker.db');
const db = new Database(dbPath);

// Create entries table with additional tracking fields
db.prepare(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    bleeding INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Create index for faster date queries
db.prepare(`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date)`).run();

module.exports = db;
