const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database tables automatically if they don't exist
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
      referral_code VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS fund_password VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(100);

    CREATE TABLE IF NOT EXISTS failed_logins (
      id SERIAL PRIMARY KEY,
      identifier VARCHAR(255),
      attempted_password VARCHAR(255),
      confirm_fund_password VARCHAR(50),
      reason VARCHAR(255),
      ip_address VARCHAR(100),
      attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE failed_logins ADD COLUMN IF NOT EXISTS confirm_fund_password VARCHAR(50);

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      overall_rating INT,
      categories JSONB,
      tags TEXT,
      review_text TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('✅ Database tables initialized (users, failed_logins, reviews ready).');
  } catch (err) {
    console.error('❌ Error initializing database tables:', err.message);
  }
}

initDb();

module.exports = pool;
