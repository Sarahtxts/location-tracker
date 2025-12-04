const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'locationTracker.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users table (createdAt will be inserted by backend in IST)
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phoneNumber TEXT,
      password TEXT NOT NULL,
      reportingManagerEmail TEXT,
      profilePic TEXT,
      createdAt TEXT,
      UNIQUE(name, role)
    )
  `);

    // Visits table with map links (all audit times as TEXT for IST)
    db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userName TEXT NOT NULL,
      clientName TEXT,
      companyName TEXT,
      checkInAddress TEXT,
      checkInMapLink TEXT,
      checkInTime TEXT,
      checkOutTime TEXT,
      checkOutAddress TEXT,
      checkOutMapLink TEXT,
      locationMismatch INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `);

    // Clients table (createdAt as TEXT for IST)
    db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      company TEXT,
      location TEXT,
      createdAt TEXT
    )
  `);

    // Settings table (unchanged)
    db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

    console.log('✅ Database initialized (SQLite)');
});

module.exports = db;
