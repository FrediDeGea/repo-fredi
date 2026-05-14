'use strict';

const { verify } = require('../config/jwt');
const pool = require('../config/database');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }
    const token = header.split(' ')[1];
    const decoded = verify(token);
    const user = await pool.query(
      'SELECT id_user, nama, email, role, status_aktif FROM m_user WHERE id_user = $1',
      [decoded.id_user]
    );
    if (!user.rows.length || !user.rows[0].status_aktif) {
      return res.status(401).json({ success: false, message: 'User tidak valid atau tidak aktif' });
    }
    req.user = user.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah expired' });
  }
}

module.exports = { authenticate };
