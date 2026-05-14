'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const auditLog = require('../services/auditLog.service');

// GET /api/daerah
router.get('/', authenticate, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM m_daerah ORDER BY priority_score DESC NULLS LAST, nama_daerah');
    res.json({ success: true, data: r.rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/daerah/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM m_daerah WHERE id_daerah = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Daerah tidak ditemukan' });
    res.json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/daerah
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { nama_daerah, zona, base_point, kode_iata_bandara, durasi_hari, latitude, longitude } = req.body;
    const r = await pool.query(
      `INSERT INTO m_daerah (nama_daerah, zona, base_point, kode_iata_bandara, durasi_hari, latitude, longitude, priority_label, priority_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'NEW',0) RETURNING *`,
      [nama_daerah, zona, base_point, kode_iata_bandara, durasi_hari, latitude, longitude]
    );
    await auditLog.log({ id_user: req.user.id_user, aksi: 'CREATE', tabel_target: 'm_daerah', id_record: r.rows[0].id_daerah, data_lama: null, data_baru: r.rows[0] });
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/daerah/:id
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { nama_daerah, zona, base_point, kode_iata_bandara, durasi_hari, latitude, longitude } = req.body;
    const old = await pool.query('SELECT * FROM m_daerah WHERE id_daerah = $1', [req.params.id]);
    const r = await pool.query(
      `UPDATE m_daerah SET nama_daerah=COALESCE($1,nama_daerah), zona=COALESCE($2,zona),
       base_point=COALESCE($3,base_point), kode_iata_bandara=COALESCE($4,kode_iata_bandara),
       durasi_hari=COALESCE($5,durasi_hari), latitude=COALESCE($6,latitude), longitude=COALESCE($7,longitude)
       WHERE id_daerah=$8 RETURNING *`,
      [nama_daerah, zona, base_point, kode_iata_bandara, durasi_hari, latitude, longitude, req.params.id]
    );
    await auditLog.log({ id_user: req.user.id_user, aksi: 'UPDATE', tabel_target: 'm_daerah', id_record: req.params.id, data_lama: old.rows[0], data_baru: r.rows[0] });
    res.json({ success: true, data: r.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
