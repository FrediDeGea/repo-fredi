'use strict';
const pool = require('../config/database');

// ── Notification Service ──────────────────────────────────────────────────────
async function create({ id_user, pesan }) {
  await pool.query(
    `INSERT INTO t_notifikasi (id_user, pesan, is_read, created_at) VALUES ($1,$2,false,NOW())`,
    [id_user, pesan]
  );
}

async function getByUser(id_user) {
  const r = await pool.query(
    `SELECT * FROM t_notifikasi WHERE id_user=$1 ORDER BY created_at DESC LIMIT 50`, [id_user]
  );
  return r.rows;
}

async function markRead(id_notif, id_user) {
  await pool.query(
    `UPDATE t_notifikasi SET is_read=true WHERE id_notif=$1 AND id_user=$2`, [id_notif, id_user]
  );
}

async function markAllRead(id_user) {
  await pool.query(`UPDATE t_notifikasi SET is_read=true WHERE id_user=$1`, [id_user]);
}

module.exports = { create, getByUser, markRead, markAllRead };
