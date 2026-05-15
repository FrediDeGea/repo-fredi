'use strict';

const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
  console.log('[db] Menggunakan DATABASE_URL');
} else {
  if (!process.env.DB_HOST) {
    console.warn('[db] WARNING: DB_HOST tidak ditemukan — pastikan ENV sudah diset di Railway');
  }
  pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME     || 'postgres',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
  console.log(`[db] Menggunakan DB_HOST: ${process.env.DB_HOST || 'tidak diset'}`);
}

pool.on('connect', () => console.log('[db] ✅ Koneksi database berhasil'));
pool.on('error',   err => console.error('[db] ❌ Error:', err.message));

process.on('SIGINT',  () => pool.end(() => process.exit(0)));
process.on('SIGTERM', () => pool.end(() => process.exit(0)));

module.exports = pool;
