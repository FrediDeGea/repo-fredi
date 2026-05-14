'use strict';
const pool = require('../config/database');

async function check(id_tim, tgl_mulai, tgl_selesai, { jedaHari = 3 } = {}) {
  // 1. Cek hari libur nasional
  const libur = await pool.query(
    `SELECT COUNT(*) AS total FROM m_hari_libur WHERE tanggal BETWEEN $1 AND $2`,
    [tgl_mulai, tgl_selesai]
  );
  if (parseInt(libur.rows[0].total, 10) > 0) return false;

  // 2. Cek cuti auditor approved
  const cuti = await pool.query(
    `SELECT COUNT(*) AS total FROM t_cuti_auditor ca
     JOIN m_auditor a ON ca.id_auditor = a.id_auditor
     WHERE a.id_tim = $1 AND ca.status = 'approved'
       AND ca.tgl_mulai <= $3 AND ca.tgl_selesai >= $2`,
    [id_tim, tgl_mulai, tgl_selesai]
  );
  if (parseInt(cuti.rows[0].total, 10) > 0) return false;

  // 3. Cek jeda minimal
  const batasMulai = new Date(tgl_mulai);
  batasMulai.setDate(batasMulai.getDate() - jedaHari);
  const batasAkhir = new Date(tgl_selesai);
  batasAkhir.setDate(batasAkhir.getDate() + jedaHari);

  const jadwal = await pool.query(
    `SELECT COUNT(*) AS total FROM t_penjadwalan
     WHERE id_tim = $1 AND status_approval != 'rejected'
       AND (tgl_mulai BETWEEN $2 AND $3 OR tgl_selesai BETWEEN $2 AND $3
            OR (tgl_mulai <= $2 AND tgl_selesai >= $3))`,
    [id_tim, batasMulai.toISOString().split('T')[0], batasAkhir.toISOString().split('T')[0]]
  );
  if (parseInt(jadwal.rows[0].total, 10) > 0) return false;

  return true;
}

module.exports = { check };
