'use strict';

const { Pool } = require('pg');

const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) throw new Error(`[db] ENV tidak ditemukan: ${missing.join(', ')}`);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000
});

pool.on('error', err => console.error('[db] Idle client error:', err.message));
process.on('SIGINT', () => pool.end(() => process.exit(0)));
process.on('SIGTERM', () => pool.end(() => process.exit(0)));

module.exports = pool;
