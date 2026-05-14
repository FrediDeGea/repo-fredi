'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { sign } = require('../config/jwt');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });

    const userRes = await pool.query('SELECT * FROM m_user WHERE email = $1 AND status_aktif = true', [email]);
    if (!userRes.rows.length) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    await pool.query('UPDATE m_user SET last_login = NOW() WHERE id_user = $1', [user.id_user]);
    const token = sign({ id_user: user.id_user, role: user.role });

    return res.json({
      success: true,
      message: 'Login berhasil',
      data: { token, user: { id_user: user.id_user, nama: user.nama, email: user.email, role: user.role } }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

// POST /api/auth/users — buat user baru (Admin only)
router.post('/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;
    if (!nama || !email || !password || !role) return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });

    const existing = await pool.query('SELECT id_user FROM m_user WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });

    const hash = await bcrypt.hash(password, 12);
    const newUser = await pool.query(
      `INSERT INTO m_user (nama, email, password_hash, role, status_aktif, created_at)
       VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id_user, nama, email, role`,
      [nama, email, hash, role]
    );
    return res.status(201).json({ success: true, data: newUser.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/users/:id/reset-password — Admin only
router.put('/users/:id/reset-password', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password) return res.status(400).json({ success: false, message: 'Password baru wajib diisi' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE m_user SET password_hash = $1 WHERE id_user = $2', [hash, req.params.id]);
    return res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
