'use strict';
const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const auditLog = require('../services/auditLog.service');
const notifService = require('../services/notification.service');

// ── AUDITOR ───────────────────────────────────────────────────────────────────
const auditorRouter = express.Router();
auditorRouter.get('/', authenticate, async (req, res) => {
  try {
    const { id_tim } = req.query;
    let q = 'SELECT a.*, t.nama_tim FROM m_auditor a JOIN m_tim t ON a.id_tim = t.id_tim WHERE 1=1';
    const params = [];
    if (id_tim) { q += ' AND a.id_tim = $1'; params.push(id_tim); }
    q += ' ORDER BY t.nama_tim, a.nama';
    const r = await pool.query(q, params);
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
auditorRouter.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id_tim, nama, bandara_asal_personal } = req.body;
    const r = await pool.query(
      'INSERT INTO m_auditor (id_tim, nama, bandara_asal_personal, status_aktif) VALUES ($1,$2,$3,true) RETURNING *',
      [id_tim, nama, bandara_asal_personal]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
auditorRouter.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { nama, bandara_asal_personal, status_aktif } = req.body;
    const r = await pool.query(
      `UPDATE m_auditor SET nama=COALESCE($1,nama), bandara_asal_personal=COALESCE($2,bandara_asal_personal),
       status_aktif=COALESCE($3,status_aktif) WHERE id_auditor=$4 RETURNING *`,
      [nama, bandara_asal_personal, status_aktif, req.params.id]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CUTI ──────────────────────────────────────────────────────────────────────
const cutiRouter = express.Router();
cutiRouter.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.*, a.nama AS nama_auditor, t.nama_tim
      FROM t_cuti_auditor c JOIN m_auditor a ON c.id_auditor = a.id_auditor
      JOIN m_tim t ON a.id_tim = t.id_tim ORDER BY c.tgl_mulai DESC`);
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
cutiRouter.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id_auditor, tgl_mulai, tgl_selesai, jenis_cuti, keterangan } = req.body;
    const r = await pool.query(
      `INSERT INTO t_cuti_auditor (id_auditor, tgl_mulai, tgl_selesai, jenis_cuti, keterangan, status)
       VALUES ($1,$2,$3,$4,$5,'approved') RETURNING *`,
      [id_auditor, tgl_mulai, tgl_selesai, jenis_cuti, keterangan]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
cutiRouter.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM t_cuti_auditor WHERE id_cuti = $1', [req.params.id]);
    res.json({ success: true, message: 'Data cuti dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── FRAUD ─────────────────────────────────────────────────────────────────────
const fraudRouter = express.Router();
fraudRouter.get('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ha.id_hasil, ha.is_fraud, ha.fraud_cleared_at, ha.fraud_cleared_note,
             d.nama_daerah, t.nama_tim, p.tgl_mulai, p.tgl_selesai
      FROM t_hasil_audit ha
      JOIN t_penjadwalan p ON ha.id_jadwal = p.id_jadwal
      JOIN m_daerah d ON p.id_daerah = d.id_daerah
      JOIN m_tim t ON p.id_tim = t.id_tim
      WHERE ha.is_fraud = true AND ha.fraud_cleared_at IS NULL`);
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
fraudRouter.post('/:id/clear', authenticate, authorize(['manager']), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Catatan tindak lanjut wajib diisi' });
    const old = await pool.query('SELECT * FROM t_hasil_audit WHERE id_hasil = $1', [req.params.id]);
    await pool.query(
      `UPDATE t_hasil_audit SET fraud_cleared_by=$1, fraud_cleared_at=NOW(), fraud_cleared_note=$2
       WHERE id_hasil=$3`,
      [req.user.id_user, note, req.params.id]
    );
    await auditLog.log({ id_user: req.user.id_user, aksi: 'FRAUD_CLEAR', tabel_target: 't_hasil_audit', id_record: req.params.id, data_lama: old.rows[0], data_baru: { fraud_cleared_note: note } });
    res.json({ success: true, message: 'Status fraud berhasil direset' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── REKOMENDASI ───────────────────────────────────────────────────────────────
const rekomendasiRouter = express.Router();
rekomendasiRouter.get('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT r.*, d.nama_daerah, d.priority_label, d.priority_score
      FROM t_rekomendasi_audit r JOIN m_daerah d ON r.id_daerah = d.id_daerah
      ORDER BY r.created_at DESC`);
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
rekomendasiRouter.post('/:id/approve', authenticate, authorize(['manager']), async (req, res) => {
  try {
    await pool.query(`UPDATE t_rekomendasi_audit SET status='approved', updated_at=NOW() WHERE id_rekomendasi=$1`, [req.params.id]);
    const adminRes = await pool.query(`SELECT id_user FROM m_user WHERE role='admin'`);
    for (const a of adminRes.rows) await notifService.create({ id_user: a.id_user, pesan: `Rekomendasi audit ulang ID ${req.params.id} disetujui Manager` });
    res.json({ success: true, message: 'Rekomendasi diapprove' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
rekomendasiRouter.post('/:id/reject', authenticate, authorize(['manager']), async (req, res) => {
  try {
    const { catatan_manager } = req.body;
    if (!catatan_manager) return res.status(400).json({ success: false, message: 'Catatan wajib diisi saat reject' });
    await pool.query(`UPDATE t_rekomendasi_audit SET status='rejected', catatan_manager=$1, updated_at=NOW() WHERE id_rekomendasi=$2`, [catatan_manager, req.params.id]);
    res.json({ success: true, message: 'Rekomendasi direject' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── NOTIFIKASI ────────────────────────────────────────────────────────────────
const notifRouter = express.Router();
notifRouter.get('/', authenticate, async (req, res) => {
  try {
    const r = await notifService.getByUser(req.user.id_user);
    res.json({ success: true, data: r });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
notifRouter.put('/:id/read', authenticate, async (req, res) => {
  try {
    await notifService.markRead(req.params.id, req.user.id_user);
    res.json({ success: true, message: 'Notifikasi ditandai telah dibaca' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
notifRouter.put('/read-all', authenticate, async (req, res) => {
  try {
    await notifService.markAllRead(req.user.id_user);
    res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PETA ──────────────────────────────────────────────────────────────────────
const petaRouter = express.Router();
petaRouter.get('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id_tim, tgl_mulai, tgl_selesai, priority_label, warna } = req.query;
    let q = `
      SELECT d.id_daerah, d.nama_daerah, d.latitude, d.longitude,
             d.priority_label, d.priority_score,
             ha.skor_temuan, ha.is_fraud, ha.tgl_input,
             t.nama_tim, p.tgl_mulai, p.tgl_selesai,
             CASE
               WHEN ha.is_fraud = true AND ha.fraud_cleared_at IS NULL THEN 'merah'
               WHEN ha.skor_temuan < 50 THEN 'merah'
               WHEN ha.skor_temuan BETWEEN 50 AND 75 THEN 'kuning'
               WHEN ha.skor_temuan > 75 THEN 'hijau'
               ELSE 'abu'
             END AS warna_marker
      FROM m_daerah d
      LEFT JOIN (
        SELECT DISTINCT ON (p.id_daerah) ha.*, p.id_daerah, p.id_tim, p.tgl_mulai, p.tgl_selesai
        FROM t_hasil_audit ha JOIN t_penjadwalan p ON ha.id_jadwal = p.id_jadwal
        ORDER BY p.id_daerah, ha.tgl_input DESC
      ) ha ON d.id_daerah = ha.id_daerah
      LEFT JOIN m_tim t ON ha.id_tim = t.id_tim
      WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (id_tim) { q += ` AND ha.id_tim = $${idx++}`; params.push(id_tim); }
    if (tgl_mulai) { q += ` AND ha.tgl_mulai >= $${idx++}`; params.push(tgl_mulai); }
    if (tgl_selesai) { q += ` AND ha.tgl_selesai <= $${idx++}`; params.push(tgl_selesai); }
    if (priority_label) { q += ` AND d.priority_label = $${idx++}`; params.push(priority_label); }
    const r = await pool.query(q, params);
    let data = r.rows;
    if (warna) data = data.filter(d => d.warna_marker === warna);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET detail daerah di peta (3 audit terakhir)
petaRouter.get('/:id_daerah', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const daerah = await pool.query('SELECT * FROM m_daerah WHERE id_daerah = $1', [req.params.id_daerah]);
    if (!daerah.rows.length) return res.status(404).json({ success: false, message: 'Daerah tidak ditemukan' });
    const riwayat = await pool.query(`
      SELECT ha.*, t.nama_tim, p.tgl_mulai, p.tgl_selesai,
        array_agg(json_build_object('nama_item', m.nama_item, 'label', ei.label)) AS items
      FROM t_hasil_audit ha
      JOIN t_penjadwalan p ON ha.id_jadwal = p.id_jadwal
      JOIN m_tim t ON p.id_tim = t.id_tim
      LEFT JOIN t_hasil_exit_item ei ON ha.id_hasil = ei.id_hasil
      LEFT JOIN m_exit_item m ON ei.id_item = m.id_item
      WHERE p.id_daerah = $1
      GROUP BY ha.id_hasil, t.nama_tim, p.tgl_mulai, p.tgl_selesai
      ORDER BY ha.tgl_input DESC LIMIT 3`,
      [req.params.id_daerah]
    );
    res.json({ success: true, data: { daerah: daerah.rows[0], riwayat_audit: riwayat.rows } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── EXPORT ────────────────────────────────────────────────────────────────────
const exportRouter = express.Router();
exportRouter.get('/feeding-analis/:id_jadwal', authenticate, authorize(['area_manager', 'manager', 'admin']), async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const r = await pool.query(`
      SELECT d.nama_daerah, t.nama_tim, p.tgl_mulai, p.tgl_selesai,
             ha.skor_temuan, ha.total_poin_exit, ha.priority_label,
             ha.keterangan_feeding_analis
      FROM t_hasil_audit ha
      JOIN t_penjadwalan p ON ha.id_jadwal = p.id_jadwal
      JOIN m_daerah d ON p.id_daerah = d.id_daerah
      JOIN m_tim t ON p.id_tim = t.id_tim
      WHERE ha.id_jadwal = $1`, [req.params.id_jadwal]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(r.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Feeding Analis');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=feeding-analis-${req.params.id_jadwal}.xlsx`);
    res.send(buf);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

exportRouter.get('/rekap-jadwal', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { tgl_mulai, tgl_selesai } = req.query;
    const r = await pool.query(`
      SELECT d.nama_daerah, d.zona, t.nama_tim, p.tgl_mulai, p.tgl_selesai,
             p.status_approval, p.is_locked, ha.skor_temuan, ha.priority_label
      FROM t_penjadwalan p
      JOIN m_daerah d ON p.id_daerah = d.id_daerah
      JOIN m_tim t ON p.id_tim = t.id_tim
      LEFT JOIN t_hasil_audit ha ON ha.id_jadwal = p.id_jadwal
      WHERE ($1::date IS NULL OR p.tgl_mulai >= $1)
        AND ($2::date IS NULL OR p.tgl_selesai <= $2)
      ORDER BY p.tgl_mulai`, [tgl_mulai || null, tgl_selesai || null]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(r.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Jadwal');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=rekap-jadwal.xlsx');
    res.send(buf);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── HARI LIBUR ────────────────────────────────────────────────────────────────
const hariLiburRouter = express.Router();
hariLiburRouter.get('/', authenticate, async (req, res) => {
  try {
    const { tahun } = req.query;
    let q = 'SELECT * FROM m_hari_libur WHERE 1=1';
    const params = [];
    if (tahun) { q += ' AND tahun = $1'; params.push(tahun); }
    q += ' ORDER BY tanggal';
    const r = await pool.query(q, params);
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
hariLiburRouter.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tanggal, nama_libur } = req.body;
    const tahun = new Date(tanggal).getFullYear();
    const r = await pool.query(
      'INSERT INTO m_hari_libur (tanggal, nama_libur, tahun) VALUES ($1,$2,$3) ON CONFLICT (tanggal) DO UPDATE SET nama_libur=$2 RETURNING *',
      [tanggal, nama_libur, tahun]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
hariLiburRouter.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM m_hari_libur WHERE id_libur = $1', [req.params.id]);
    res.json({ success: true, message: 'Hari libur dihapus' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CONFIG ────────────────────────────────────────────────────────────────────
const configRouter = express.Router();
configRouter.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM m_config ORDER BY key');
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
configRouter.put('/:key', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query('UPDATE m_config SET value = $1 WHERE key = $2', [value, req.params.key]);
    res.json({ success: true, message: 'Config berhasil diupdate' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── USER ──────────────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const r = await pool.query('SELECT id_user, nama, email, role, status_aktif, created_at, last_login FROM m_user ORDER BY created_at DESC');
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
userRouter.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { nama, role, status_aktif } = req.body;
    const r = await pool.query(
      'UPDATE m_user SET nama=COALESCE($1,nama), role=COALESCE($2,role), status_aktif=COALESCE($3,status_aktif) WHERE id_user=$4 RETURNING id_user,nama,email,role,status_aktif',
      [nama, role, status_aktif, req.params.id]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = { auditorRouter, cutiRouter, fraudRouter, rekomendasiRouter, notifRouter, petaRouter, exportRouter, hariLiburRouter, configRouter, userRouter };
