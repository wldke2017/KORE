const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
async function initDb() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(50) UNIQUE,
      password VARCHAR(255),
      fund_password VARCHAR(255),
      password_hash VARCHAR(255),
      fund_password_hash VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS fund_password VARCHAR(255);
  `;
  try {
    await pool.query(queryText);
    console.log('Database initialized successfully: users table ready.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDb();

module.exports = pool;
