'use strict';
const express = require('express');
const router = express.Router();
const { autoGenerate, reGenerate } = require('../services/autoGenerate.service');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const cronJobs = require('../jobs');

// POST /api/generate
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tgl_mulai, tgl_selesai } = req.body;
    if (!tgl_mulai || !tgl_selesai)
      return res.status(400).json({ success: false, message: 'tgl_mulai dan tgl_selesai wajib diisi' });
    if (new Date(tgl_mulai) >= new Date(tgl_selesai))
      return res.status(400).json({ success: false, message: 'tgl_mulai harus sebelum tgl_selesai' });

    const result = await autoGenerate({ tgl_mulai, tgl_selesai, created_by: req.user.id_user });
    return res.json({
      success: true,
      message: `Generate selesai: ${result.berhasil.length} jadwal dibuat`,
      data: result
    });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/generate/regenerate
router.post('/regenerate', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { tgl_mulai, tgl_selesai } = req.body;
    if (!tgl_mulai || !tgl_selesai)
      return res.status(400).json({ success: false, message: 'tgl_mulai dan tgl_selesai wajib diisi' });

    const result = await reGenerate({ tgl_mulai, tgl_selesai, created_by: req.user.id_user });
    const hasConflicts = result.conflicts?.length > 0;
    return res.status(hasConflicts ? 409 : 200).json({
      success: !hasConflicts,
      message: hasConflicts
        ? `Re-generate selesai dengan ${result.conflicts.length} konflik`
        : `Re-generate selesai: ${result.berhasil.length} jadwal`,
      data: result
    });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/generate/reset-score
router.post('/reset-score', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const total = await cronJobs.manualResetScore(req.user.id_user);
    return res.json({ success: true, message: `${total} tim direset ke 0` });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/generate/sync-holiday
router.post('/sync-holiday', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const count = await cronJobs.manualSyncHoliday();
    return res.json({ success: true, message: `${count} hari libur disinkronisasi` });
  } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
