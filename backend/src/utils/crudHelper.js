// ============================================================
// ROUTES INDEX — semua route lainnya
// ============================================================
// File ini berisi boilerplate untuk route-route berikut:
// daerah, tim, auditor, cuti, fraud, rekomendasi,
// notifikasi, peta, export, hariLibur, config, user
// ============================================================

'use strict';
const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const auditLog = require('../services/auditLog.service');
const notifService = require('../services/notification.service');

// ── Helper CRUD generator ─────────────────────────────────────────────────────
function crudRouter(table, pkField, allowedRoles = ['admin']) {
  const router = express.Router();
  router.get('/', authenticate, async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} ORDER BY 1`);
      res.json({ success: true, data: r.rows });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });
  router.get('/:id', authenticate, async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} WHERE ${pkField} = $1`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      res.json({ success: true, data: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  });
  return router;
}

module.exports = { crudRouter };
