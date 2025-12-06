const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // REQUIRED for AWS RDS
  }
});

pool.on('connect', () => {
  console.log('Connected to AWS RDS PostgreSQL');
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phoneNumber TEXT,
        password TEXT NOT NULL,
        reportingManagerEmail TEXT,
        profilePic TEXT,
        createdAt TEXT,
        UNIQUE(name, role)
      );
    `);

    // Visits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
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
      );
    `);

    // Clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        company TEXT,
        location TEXT,
        createdAt TEXT
      );
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    console.log('✅ Database initialized (PostgreSQL)');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  } finally {
    client.release();
  }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
