/**
 * Database Configuration
 * Path: config/database.js
 * PostgreSQL connection pool + query helpers
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
