'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const auditLog = require('../services/auditLog.service');
const notifService = require('../services/notification.service');

// ── GET /api/jadwal ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { tgl_mulai, tgl_selesai, id_tim, status } = req.query;
    let q = `
      SELECT p.*, d.nama_daerah, d.zona, d.base_point, d.tipe_kunjungan,
             t.nama_tim, t.mode_transport, p.status_approval, p.is_locked
      FROM t_penjadwalan p
      JOIN m_daerah d ON p.id_daerah = d.id_daerah
      JOIN m_tim t ON p.id_tim = t.id_tim
      WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (tgl_mulai)  { q += ` AND p.tgl_mulai >= $${idx++}`;  params.push(tgl_mulai); }
    if (tgl_selesai){ q += ` AND p.tgl_selesai <= $${idx++}`; params.push(tgl_selesai); }
    if (id_tim)     { q += ` AND p.id_tim = $${idx++}`;       params.push(id_tim); }
    if (status)     { q += ` AND p.status_approval = $${idx++}`; params.push(status); }
    q += ' ORDER BY p.tgl_mulai ASC';
    const r = await pool.query(q, params);
    return res.json({ success: true, data: r.rows });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /api/jadwal/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const jadwal = await pool.query(
      `SELECT p.*, d.nama_daerah, d.zona, d.base_point,
              d.tipe_kunjungan, d.durasi_hari,
              t.nama_tim, t.mode_transport,
              u.nama AS created_by_nama
       FROM t_penjadwalan p
       JOIN m_daerah d ON p.id_daerah = d.id_daerah
       JOIN m_tim t ON p.id_tim = t.id_tim
       LEFT JOIN m_user u ON p.created_by = u.id_user
       WHERE p.id_jadwal = $1`,
      [req.params.id]
    );
    if (!jadwal.rows.length)
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    // Ambil SO Cabang yang ikut jadwal ini
    const soCabang = await pool.query(
      `SELECT id_daerah, nama_daerah, bus_area
       FROM m_daerah
       WHERE parent_daerah_id = $1 AND tipe_kunjungan = 'SO_cabang'`,
      [jadwal.rows[0].id_daerah]
    );

    return res.json({
      success: true,
      data: { ...jadwal.rows[0], so_cabang: soCabang.rows }
    });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── PUT /api/jadwal/:id ──────────────────────────────────────────────────────
// Mengganti daerah, tim, atau tanggal jadwal
// Validasi:
//   1. Jadwal tidak boleh terkunci
//   2. Jika daerah diganti → cek tim masih cover zona baru
//   3. Jika status approved & ada perubahan → reset ke pending + notif Manager
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id_daerah, id_tim, tgl_mulai, tgl_selesai, catatan_personel } = req.body;

    // Ambil data jadwal saat ini
    const oldRes = await pool.query(
      `SELECT p.*, d.zona AS zona_lama, t.nama_tim
       FROM t_penjadwalan p
       JOIN m_daerah d ON p.id_daerah = d.id_daerah
       JOIN m_tim t ON p.id_tim = t.id_tim
       WHERE p.id_jadwal = $1`,
      [req.params.id]
    );
    if (!oldRes.rows.length)
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    const old = oldRes.rows[0];

    // ── Validasi 1: Tidak boleh terkunci ────────────────────────────────────
    if (old.is_locked)
      return res.status(403).json({
        success: false,
        message: 'Jadwal terkunci. Lakukan unlock terlebih dahulu sebelum mengedit.'
      });

    const warnings = [];
    let newStatus = old.status_approval;
    const timFinal    = id_tim    || old.id_tim;
    const daerahFinal = id_daerah || old.id_daerah;

    // ── Validasi 2: Cek tim masih cover zona daerah baru ───────────────────
    if (id_daerah && id_daerah !== old.id_daerah) {
      const daerahBaru = await pool.query(
        'SELECT zona, nama_daerah FROM m_daerah WHERE id_daerah = $1',
        [id_daerah]
      );
      if (!daerahBaru.rows.length)
        return res.status(400).json({ success: false, message: 'Daerah baru tidak ditemukan' });

      const zonaBaru = daerahBaru.rows[0].zona;

      // Cek apakah tim (lama atau baru) cover zona daerah pengganti
      const timIdCheck = id_tim || old.id_tim;
      const coverRes = await pool.query(
        `SELECT 1 FROM m_tim_wilayah
         WHERE id_tim = $1 AND (zona = $2 OR zona = 'all')`,
        [timIdCheck, zonaBaru]
      );

      if (!coverRes.rows.length) {
        // Tim tidak cover zona baru — cari tim lain yang cover
        const timAlternatifRes = await pool.query(
          `SELECT t.id_tim, t.nama_tim FROM m_tim t
           JOIN m_tim_wilayah tw ON t.id_tim = tw.id_tim
           WHERE tw.zona = $1 OR tw.zona = 'all'
           ORDER BY t.accumulated_score ASC LIMIT 5`,
          [zonaBaru]
        );

        return res.status(400).json({
          success: false,
          message: `Tim saat ini tidak memiliki cakupan wilayah untuk zona '${zonaBaru}'. Ganti tim juga.`,
          zona_baru: zonaBaru,
          alternatif_tim: timAlternatifRes.rows
        });
      }

      warnings.push(`Daerah diubah dari ID ${old.id_daerah} ke ID ${id_daerah} (${daerahBaru.rows[0].nama_daerah})`);
    }

    // ── Validasi 3: Jika approved & ada perubahan → reset ke pending ───────
    const adaPerubahan =
      (id_daerah && id_daerah !== old.id_daerah) ||
      (id_tim    && id_tim    !== old.id_tim)     ||
      (tgl_mulai && tgl_mulai !== old.tgl_mulai?.toISOString().split('T')[0]) ||
      (tgl_selesai && tgl_selesai !== old.tgl_selesai?.toISOString().split('T')[0]);

    if (old.status_approval === 'approved' && adaPerubahan) {
      newStatus = 'pending';
      warnings.push('Status direset ke pending karena ada perubahan. Manager perlu re-approve.');

      // Notifikasi ke Manager
      const managerRes = await pool.query(
        `SELECT id_user FROM m_user WHERE role = 'manager'`
      );
      for (const mgr of managerRes.rows) {
        await notifService.create({
          id_user: mgr.id_user,
          pesan: `Jadwal ID ${req.params.id} telah diubah Admin dan membutuhkan re-approval.`
        });
      }
    }

    // ── Lakukan UPDATE ──────────────────────────────────────────────────────
    const updated = await pool.query(
      `UPDATE t_penjadwalan
       SET id_daerah         = COALESCE($1, id_daerah),
           id_tim            = COALESCE($2, id_tim),
           tgl_mulai         = COALESCE($3, tgl_mulai),
           tgl_selesai       = COALESCE($4, tgl_selesai),
           catatan_personel  = COALESCE($5, catatan_personel),
           status_approval   = $6
       WHERE id_jadwal = $7
       RETURNING *`,
      [id_daerah, id_tim, tgl_mulai, tgl_selesai, catatan_personel, newStatus, req.params.id]
    );

    await auditLog.log({
      id_user: req.user.id_user,
      aksi: 'UPDATE',
      tabel_target: 't_penjadwalan',
      id_record: req.params.id,
      data_lama: old,
      data_baru: updated.rows[0]
    });

    return res.json({
      success: true,
      message: 'Jadwal berhasil diperbarui',
      warnings,
      data: updated.rows[0]
    });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── DELETE /api/jadwal/:id ───────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const old = await pool.query(
      'SELECT * FROM t_penjadwalan WHERE id_jadwal = $1', [req.params.id]
    );
    if (!old.rows.length)
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    if (old.rows[0].is_locked)
      return res.status(403).json({ success: false, message: 'Jadwal terkunci, tidak bisa dihapus' });

    await pool.query('DELETE FROM t_penjadwalan WHERE id_jadwal = $1', [req.params.id]);
    await auditLog.log({
      id_user: req.user.id_user, aksi: 'DELETE',
      tabel_target: 't_penjadwalan', id_record: req.params.id,
      data_lama: old.rows[0], data_baru: null
    });
    return res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/jadwal/:id/lock ────────────────────────────────────────────────
router.post('/:id/lock', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await pool.query(
      'UPDATE t_penjadwalan SET is_locked = true WHERE id_jadwal = $1', [req.params.id]
    );
    await auditLog.log({
      id_user: req.user.id_user, aksi: 'LOCK',
      tabel_target: 't_penjadwalan', id_record: req.params.id,
      data_lama: null, data_baru: { is_locked: true }
    });
    return res.json({ success: true, message: 'Jadwal berhasil dikunci' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/jadwal/:id/unlock ──────────────────────────────────────────────
router.post('/:id/unlock', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await pool.query(
      'UPDATE t_penjadwalan SET is_locked = false WHERE id_jadwal = $1', [req.params.id]
    );
    await auditLog.log({
      id_user: req.user.id_user, aksi: 'UNLOCK',
      tabel_target: 't_penjadwalan', id_record: req.params.id,
      data_lama: null, data_baru: { is_locked: false }
    });
    return res.json({ success: true, message: 'Jadwal berhasil dibuka' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/jadwal/:id/approve ─────────────────────────────────────────────
router.post('/:id/approve', authenticate, authorize(['manager']), async (req, res) => {
  try {
    const old = await pool.query(
      'SELECT * FROM t_penjadwalan WHERE id_jadwal = $1', [req.params.id]
    );
    if (!old.rows.length)
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    await pool.query(
      `UPDATE t_penjadwalan SET status_approval = 'approved' WHERE id_jadwal = $1`,
      [req.params.id]
    );

    const adminRes = await pool.query(`SELECT id_user FROM m_user WHERE role = 'admin'`);
    for (const a of adminRes.rows) {
      await notifService.create({
        id_user: a.id_user,
        pesan: `Jadwal ID ${req.params.id} diapprove oleh Manager.`
      });
    }

    await auditLog.log({
      id_user: req.user.id_user, aksi: 'APPROVE',
      tabel_target: 't_penjadwalan', id_record: req.params.id,
      data_lama: old.rows[0], data_baru: { status_approval: 'approved' }
    });
    return res.json({ success: true, message: 'Jadwal berhasil diapprove' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /api/jadwal/:id/reject ──────────────────────────────────────────────
router.post('/:id/reject', authenticate, authorize(['manager']), async (req, res) => {
  try {
    const { alasan } = req.body;
    await pool.query(
      `UPDATE t_penjadwalan SET status_approval = 'rejected' WHERE id_jadwal = $1`,
      [req.params.id]
    );

    const adminRes = await pool.query(`SELECT id_user FROM m_user WHERE role = 'admin'`);
    for (const a of adminRes.rows) {
      await notifService.create({
        id_user: a.id_user,
        pesan: `Jadwal ID ${req.params.id} direject Manager. Alasan: ${alasan || '-'}`
      });
    }

    await auditLog.log({
      id_user: req.user.id_user, aksi: 'REJECT',
      tabel_target: 't_penjadwalan', id_record: req.params.id,
      data_lama: null, data_baru: { status_approval: 'rejected', alasan }
    });
    return res.json({ success: true, message: 'Jadwal berhasil direject' });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
