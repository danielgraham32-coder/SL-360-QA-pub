const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'reviews.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDb() {
  const conn = getDb();

  conn.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      summary TEXT
    );

    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      slide_number INTEGER,
      slide_title TEXT,
      description TEXT NOT NULL,
      suggestion TEXT,
      screenshot_path TEXT,
      element_selector TEXT,
      raw_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES reviews(id)
    );

    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id TEXT NOT NULL,
      slide_number INTEGER NOT NULL,
      title TEXT,
      screenshot_path TEXT,
      url TEXT,
      text_content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (review_id) REFERENCES reviews(id)
    );
  `);
}

module.exports = { getDb, initDb };
