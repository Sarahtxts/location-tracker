const sql = require('mssql');
require('dotenv').config();

// SQL Server configuration
const config = {
  server: 'localhost\\SQLEXPRESS',
  database: 'LocationTrackerDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  authentication: {
    type: 'default'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Connection pool
let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
  }
  return pool;
}

// Initialize database and tables
async function initializeDatabase() {
  try {
    // First connect to master database to create our database
    const masterConfig = {
      server: 'localhost\\SQLEXPRESS',
      database: 'master',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      },
      authentication: {
        type: 'default'
      }
    };

    const masterPool = await sql.connect(masterConfig);

    // Create database if it doesn't exist
    await masterPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LocationTrackerDB')
      BEGIN
        CREATE DATABASE LocationTrackerDB;
      END
    `);

    console.log('✅ Database LocationTrackerDB created/verified');
    await masterPool.close();

    // Now connect to our database and create tables
    const appPool = await getPool();

    // Create Users table
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          role NVARCHAR(50) NOT NULL,
          phoneNumber NVARCHAR(20),
          password NVARCHAR(255) NOT NULL,
          reportingManagerEmail NVARCHAR(255),
          profilePic NVARCHAR(MAX),
          createdAt NVARCHAR(50),
          CONSTRAINT UC_User UNIQUE (name, role)
        );
      END
    `);
    console.log('✅ Users table created/verified');

    // Create Visits table
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visits')
      BEGIN
        CREATE TABLE visits (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userName NVARCHAR(255) NOT NULL,
          clientName NVARCHAR(255),
          companyName NVARCHAR(255),
          checkInAddress NVARCHAR(MAX),
          checkInMapLink NVARCHAR(MAX),
          checkInTime NVARCHAR(50),
          checkOutTime NVARCHAR(50),
          checkOutAddress NVARCHAR(MAX),
          checkOutMapLink NVARCHAR(MAX),
          locationMismatch INT DEFAULT 0,
          createdAt NVARCHAR(50)
        );
      END
    `);
    console.log('✅ Visits table created/verified');

    // Create Clients table
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'clients')
      BEGIN
        CREATE TABLE clients (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL UNIQUE,
          company NVARCHAR(255),
          location NVARCHAR(MAX),
          createdAt NVARCHAR(50)
        );
      END
    `);
    console.log('✅ Clients table created/verified');

    // Create Settings table
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'settings')
      BEGIN
        CREATE TABLE settings (
          [key] NVARCHAR(255) PRIMARY KEY,
          value NVARCHAR(MAX) NOT NULL
        );
      END
    `);
    console.log('✅ Settings table created/verified');

    console.log('✅ Database initialization complete');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

// Helper functions to mimic SQLite API for minimal code changes

// Execute a query (for SELECT statements)
async function all(query, params = []) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    // Replace ? with @param0, @param1, etc.
    let sqlQuery = query;
    params.forEach((_, index) => {
      sqlQuery = sqlQuery.replace('?', `@param${index}`);
    });

    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
}

// Execute a query and get single row
async function get(query, params = []) {
  const results = await all(query, params);
  return results.length > 0 ? results[0] : null;
}

// Execute a query (for INSERT, UPDATE, DELETE)
async function run(query, params = []) {
  try {
    const pool = await getPool();
    const request = pool.request();

    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    // Replace ? with @param0, @param1, etc.
    let sqlQuery = query;
    params.forEach((_, index) => {
      sqlQuery = sqlQuery.replace('?', `@param${index}`);
    });

    const result = await request.query(sqlQuery);
    return {
      lastID: result.recordset && result.recordset.length > 0 ? result.recordset[0].id : null,
      changes: result.rowsAffected[0]
    };
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
}

module.exports = {
  initializeDatabase,
  getPool,
  all,
  get,
  run,
  sql
};
