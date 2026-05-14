'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const priorityScore = require('../services/priorityScore.service');
const auditLog = require('../services/auditLog.service');
const notif = require('../services/notification.service');

// POST /api/exit-meeting
router.post('/', authenticate, authorize(['area_manager']), async (req, res) => {
  try {
    const { id_jadwal, items, skor_temuan, is_fraud } = req.body;
    if (!id_jadwal || !Array.isArray(items))
      return res.status(400).json({ success: false, message: 'id_jadwal dan items wajib diisi' });

    const totalPoin = priorityScore.calculateExitMeetingTotal(items);
    const thresholds = await priorityScore.getThresholds();
    const priorityLabel = priorityScore.determinePriorityLabel(totalPoin, is_fraud || false, thresholds);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hasilRes = await client.query(
        `INSERT INTO t_hasil_audit (id_jadwal, skor_temuan, total_poin_exit, priority_label, is_fraud, tgl_input)
         VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id_hasil`,
        [id_jadwal, skor_temuan, totalPoin, priorityLabel, is_fraud || false]
      );
      const id_hasil = hasilRes.rows[0].id_hasil;

      for (const item of items) {
        await client.query(
          `INSERT INTO t_hasil_exit_item (id_hasil, id_item, label, keterangan) VALUES ($1,$2,$3,$4)`,
          [id_hasil, item.id_item, item.label, item.keterangan || null]
        );
      }
      await client.query('COMMIT');

      // Update priority score daerah
      const jadwalRes = await pool.query(
        'SELECT id_daerah FROM t_penjadwalan WHERE id_jadwal=$1', [id_jadwal]
      );
      if (jadwalRes.rows.length) {
        await priorityScore.calculatePriorityScore(jadwalRes.rows[0].id_daerah);
      }

      // Update accumulated_score tim
      const jadwalDetail = await pool.query(
        `SELECT p.id_tim, d.base_point,
                (EXTRACT(DAY FROM p.tgl_selesai - p.tgl_mulai) + 1) AS durasi
         FROM t_penjadwalan p JOIN m_daerah d ON p.id_daerah=d.id_daerah
         WHERE p.id_jadwal=$1`, [id_jadwal]
      );
      if (jadwalDetail.rows.length) {
        const { id_tim, base_point, durasi } = jadwalDetail.rows[0];
        const tambahan = parseInt(base_point) + parseInt(durasi) + totalPoin;
        await pool.query(
          'UPDATE m_tim SET accumulated_score = accumulated_score + $1 WHERE id_tim=$2',
          [tambahan, id_tim]
        );
      }

      // Notifikasi Manager
      const mgrRes = await pool.query(`SELECT id_user FROM m_user WHERE role='manager'`);
      for (const m of mgrRes.rows) {
        await notif.create({ id_user: m.id_user, pesan: `Hasil exit meeting baru: Jadwal ID ${id_jadwal} (${priorityLabel})` });
      }

      await auditLog.log({ id_user: req.user.id_user, aksi: 'CREATE', tabel_target: 't_hasil_audit', id_record: id_hasil, data_lama: null, data_baru: { id_jadwal, totalPoin, priorityLabel } });

      return res.status(201).json({ success: true, data: { id_hasil, total_poin_exit: totalPoin, priority_label: priorityLabel } });
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/exit-meeting/:id
router.put('/:id', authenticate, authorize(['area_manager']), async (req, res) => {
  try {
    const { items, skor_temuan, is_fraud } = req.body;
    const old = await pool.query('SELECT * FROM t_hasil_audit WHERE id_hasil=$1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const totalPoin = priorityScore.calculateExitMeetingTotal(items);
    const thresholds = await priorityScore.getThresholds();
    const priorityLabel = priorityScore.determinePriorityLabel(totalPoin, is_fraud || false, thresholds);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE t_hasil_audit SET skor_temuan=$1, total_poin_exit=$2, priority_label=$3, is_fraud=$4 WHERE id_hasil=$5`,
        [skor_temuan, totalPoin, priorityLabel, is_fraud || false, req.params.id]
      );
      await client.query('DELETE FROM t_hasil_exit_item WHERE id_hasil=$1', [req.params.id]);
      for (const item of items) {
        await client.query(
          `INSERT INTO t_hasil_exit_item (id_hasil, id_item, label, keterangan) VALUES ($1,$2,$3,$4)`,
          [req.params.id, item.id_item, item.label, item.keterangan || null]
        );
      }
      await client.query('COMMIT');

      // Recalculate priority
      const jadwalRes = await pool.query(
        `SELECT id_daerah FROM t_penjadwalan WHERE id_jadwal=(SELECT id_jadwal FROM t_hasil_audit WHERE id_hasil=$1)`,
        [req.params.id]
      );
      if (jadwalRes.rows.length) await priorityScore.calculatePriorityScore(jadwalRes.rows[0].id_daerah);

      // Notif Manager
      const mgrRes = await pool.query(`SELECT id_user FROM m_user WHERE role='manager'`);
      for (const m of mgrRes.rows) {
        await notif.create({ id_user: m.id_user, pesan: `Hasil exit meeting ID ${req.params.id} telah diedit` });
      }

      await auditLog.log({ id_user: req.user.id_user, aksi: 'UPDATE', tabel_target: 't_hasil_audit', id_record: req.params.id, data_lama: old.rows[0], data_baru: { totalPoin, priorityLabel } });
      return res.json({ success: true, data: { total_poin_exit: totalPoin, priority_label: priorityLabel } });
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/exit-meeting/:id_jadwal
router.get('/:id_jadwal', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ha.*, json_agg(json_build_object('id_item',ei.id_item,'nama_item',m.nama_item,'label',ei.label,'keterangan',ei.keterangan)) AS items
       FROM t_hasil_audit ha
       LEFT JOIN t_hasil_exit_item ei ON ha.id_hasil=ei.id_hasil
       LEFT JOIN m_exit_item m ON ei.id_item=m.id_item
       WHERE ha.id_jadwal=$1 GROUP BY ha.id_hasil ORDER BY ha.tgl_input DESC`,
      [req.params.id_jadwal]
    );
    return res.json({ success: true, data: r.rows });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/exit-meeting/:id/clear-fraud
router.post('/:id/clear-fraud', authenticate, authorize(['manager']), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Catatan tindak lanjut wajib diisi' });
    const old = await pool.query('SELECT * FROM t_hasil_audit WHERE id_hasil=$1', [req.params.id]);
    await pool.query(
      `UPDATE t_hasil_audit SET fraud_cleared_by=$1, fraud_cleared_at=NOW(), fraud_cleared_note=$2 WHERE id_hasil=$3`,
      [req.user.id_user, note, req.params.id]
    );
    await auditLog.log({ id_user: req.user.id_user, aksi: 'FRAUD_CLEAR', tabel_target: 't_hasil_audit', id_record: req.params.id, data_lama: old.rows[0], data_baru: { fraud_cleared_note: note } });
    return res.json({ success: true, message: 'Status fraud berhasil direset' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
