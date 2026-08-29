/**
 * Database Configuration
 * Path: config/database.js
 * PostgreSQL connection pool + query helpers
 */

const { Pool } = require('pg');

// Hỗ trợ 2 cách cấu hình:
// 1. DATABASE_URL (Render, Neon, Heroku...) — connection string, tự bật SSL khi cần
// 2. Các biến DB_* riêng lẻ (VPS tự quản)
function buildPoolConfig() {
  const base = { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 };

  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const needsSSL =
      url.includes('render.com') || url.includes('neon.tech') ||
      url.includes('sslmode=require') || process.env.PGSSL === 'true';
    return {
      ...base,
      connectionString: url,
      ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    ...base,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err.message);
});

/** Run a query, return full result */
async function query(text, params) {
  return pool.query(text, params);
}

/** Return all rows */
async function getAll(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

/** Return first row or null */
async function getOne(text, params) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

/** Run callback inside a transaction */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, getAll, getOne, transaction };
