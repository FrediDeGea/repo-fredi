'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const auditLog = require('../services/auditLog.service');

router.get('/', authenticate, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT t.*, u.nama AS area_manager_nama,
        array_agg(DISTINCT tw.zona) AS wilayah_cakupan
      FROM m_tim t
      LEFT JOIN m_user u ON t.id_area_manager = u.id_user
      LEFT JOIN m_tim_wilayah tw ON t.id_tim = tw.id_tim
      GROUP BY t.id_tim, u.nama
      ORDER BY t.accumulated_score ASC`);
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const tim = await pool.query('SELECT * FROM m_tim WHERE id_tim = $1', [req.params.id]);
    if (!tim.rows.length) return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    const auditor = await pool.query('SELECT * FROM m_auditor WHERE id_tim = $1 AND status_aktif = true', [req.params.id]);
    const wilayah = await pool.query('SELECT zona FROM m_tim_wilayah WHERE id_tim = $1', [req.params.id]);
    res.json({ success: true, data: { ...tim.rows[0], auditor: auditor.rows, wilayah: wilayah.rows.map(w => w.zona) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { nama_tim, mode_transport, bandara_asal } = req.body;
    const old = await pool.query('SELECT * FROM m_tim WHERE id_tim = $1', [req.params.id]);
    const r = await pool.query(
      `UPDATE m_tim SET nama_tim=COALESCE($1,nama_tim), mode_transport=COALESCE($2,mode_transport),
       bandara_asal=COALESCE($3,bandara_asal) WHERE id_tim=$4 RETURNING *`,
      [nama_tim, mode_transport, bandara_asal, req.params.id]
    );
    await auditLog.log({ id_user: req.user.id_user, aksi: 'UPDATE', tabel_target: 'm_tim', id_record: req.params.id, data_lama: old.rows[0], data_baru: r.rows[0] });
    res.json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
