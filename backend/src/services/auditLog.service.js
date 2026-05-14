'use strict';
const pool = require('../config/database');

async function log({ id_user, aksi, tabel_target, id_record, data_lama, data_baru }) {
  await pool.query(
    `INSERT INTO t_audit_log (id_user, aksi, tabel_target, id_record, data_lama, data_baru, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [id_user, aksi, tabel_target, id_record,
     data_lama ? JSON.stringify(data_lama) : null,
     data_baru ? JSON.stringify(data_baru) : null]
  );
}

module.exports = { log };
