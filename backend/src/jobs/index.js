'use strict';
const cron = require('node-cron');
const axios = require('axios');
const pool = require('../config/database');

// ── CRON 1: Reset accumulated_score → 1 Januari 00:01 ──────────────────────
const resetScore = cron.schedule('1 0 1 1 *', async () => {
  console.log('[cron] Reset accumulated_score...');
  try {
    const r = await pool.query('UPDATE m_tim SET accumulated_score = 0 RETURNING id_tim');
    await pool.query(
      `INSERT INTO t_audit_log (id_user,aksi,tabel_target,data_baru,created_at)
       VALUES (NULL,'SCORE_RESET','m_tim',$1,NOW())`,
      [JSON.stringify({ total: r.rowCount, reset_at: new Date() })]
    );
    console.log(`[cron] Reset selesai: ${r.rowCount} tim`);
  } catch (e) { console.error('[cron] Reset error:', e.message); }
}, { scheduled: false });

// ── CRON 2: Sync hari libur → 1 Januari 00:01 ──────────────────────────────
const syncHoliday = cron.schedule('1 0 1 1 *', async () => {
  console.log('[cron] Sync hari libur...');
  try {
    const tahun = new Date().getFullYear();
    const url = 'https://raw.githubusercontent.com/guangrei/APIHariLibur/main/calendar.json';
    const { data } = await axios.get(url, { timeout: 15000 });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM m_hari_libur WHERE tahun = $1', [tahun]);
      let count = 0;
      for (const [tanggal, info] of Object.entries(data)) {
        if (!tanggal.startsWith(String(tahun))) continue;
        await client.query(
          `INSERT INTO m_hari_libur (tanggal, nama_libur, tahun) VALUES ($1,$2,$3)
           ON CONFLICT (tanggal) DO UPDATE SET nama_libur=$2`,
          [tanggal, info.summary || info.name || 'Hari Libur Nasional', tahun]
        );
        count++;
      }
      await client.query('COMMIT');
      console.log(`[cron] Sync libur: ${count} hari`);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (e) { console.error('[cron] Sync holiday error:', e.message); }
}, { scheduled: false });

// ── Manual triggers ─────────────────────────────────────────────────────────
async function manualResetScore(id_user) {
  const r = await pool.query('UPDATE m_tim SET accumulated_score = 0 RETURNING id_tim');
  await pool.query(
    `INSERT INTO t_audit_log (id_user,aksi,tabel_target,data_baru,created_at)
     VALUES ($1,'SCORE_RESET','m_tim',$2,NOW())`,
    [id_user, JSON.stringify({ total: r.rowCount, manual: true })]
  );
  return r.rowCount;
}

async function manualSyncHoliday() {
  const tahun = new Date().getFullYear();
  const url = 'https://raw.githubusercontent.com/guangrei/APIHariLibur/main/calendar.json';
  const { data } = await axios.get(url, { timeout: 15000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM m_hari_libur WHERE tahun=$1', [tahun]);
    let count = 0;
    for (const [tanggal, info] of Object.entries(data)) {
      if (!tanggal.startsWith(String(tahun))) continue;
      await client.query(
        `INSERT INTO m_hari_libur (tanggal,nama_libur,tahun) VALUES ($1,$2,$3)
         ON CONFLICT (tanggal) DO UPDATE SET nama_libur=$2`,
        [tanggal, info.summary || info.name || 'Hari Libur Nasional', tahun]
      );
      count++;
    }
    await client.query('COMMIT');
    return count;
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

function startAll() {
  resetScore.start();
  syncHoliday.start();
  console.log('[cron] Semua cron job aktif');
}

module.exports = { startAll, manualResetScore, manualSyncHoliday };

// ── CRON 3: Reminder exit meeting belum diinput ─────────────────────────────
// Jalankan setiap hari jam 08:00
const reminderExitMeeting = cron.schedule('0 8 * * *', async () => {
  try {
    const cfgRes = await pool.query(
      `SELECT value FROM m_config WHERE key = 'reminder_exit_meeting_hari'`
    );
    const hariThreshold = parseInt(cfgRes.rows[0]?.value || '3', 10);
    const batasDate = new Date();
    batasDate.setDate(batasDate.getDate() - hariThreshold);

    // Cari jadwal approved yang sudah lewat batas tapi belum ada exit meeting
    const res = await pool.query(
      `SELECT p.id_jadwal, p.id_tim, p.tgl_selesai,
              d.nama_daerah, t.nama_tim, t.id_area_manager
       FROM t_penjadwalan p
       JOIN m_daerah d ON p.id_daerah = d.id_daerah
       JOIN m_tim t ON p.id_tim = t.id_tim
       WHERE p.status_approval = 'approved'
         AND p.tgl_selesai <= $1
         AND NOT EXISTS (
           SELECT 1 FROM t_hasil_audit ha WHERE ha.id_jadwal = p.id_jadwal
         )`,
      [batasDate.toISOString().split('T')[0]]
    );

    for (const row of res.rows) {
      if (row.id_area_manager) {
        await pool.query(
          `INSERT INTO t_notifikasi (id_user, pesan, is_read, created_at)
           VALUES ($1, $2, false, NOW())`,
          [row.id_area_manager,
           `⏰ Reminder: Exit meeting untuk ${row.nama_daerah} (${row.nama_tim}) belum diinput. Jadwal selesai: ${row.tgl_selesai}.`]
        );
      }
    }

    if (res.rows.length > 0) {
      console.log(`[cron] Reminder exit meeting: ${res.rows.length} jadwal belum diinput`);
    }
  } catch (e) {
    console.error('[cron] Reminder exit meeting error:', e.message);
  }
}, { scheduled: false });

// Update startAll
const _originalStartAll = module.exports?.startAll;
module.exports.startAll = function() {
  if (_originalStartAll) _originalStartAll();
  reminderExitMeeting.start();
  console.log('[cron] Reminder exit meeting aktif (daily 08:00)');
};
