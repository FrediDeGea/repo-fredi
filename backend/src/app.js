'use strict';

const express = require('express');
const cors = require('cors');
const app = express();

const {
  auditorRouter, cutiRouter, fraudRouter, rekomendasiRouter,
  notifRouter, petaRouter, exportRouter, hariLiburRouter,
  configRouter, userRouter
} = require('./routes/allRoutes');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/generate',     require('./routes/generate.routes'));
app.use('/api/jadwal',       require('./routes/jadwal.routes'));
app.use('/api/exit-meeting', require('./routes/exitMeeting.routes'));
app.use('/api/daerah',       require('./routes/daerah.routes'));
app.use('/api/tim',          require('./routes/tim.routes'));
app.use('/api/auditor',      auditorRouter);
app.use('/api/cuti',         cutiRouter);
app.use('/api/fraud',        fraudRouter);
app.use('/api/rekomendasi',  rekomendasiRouter);
app.use('/api/notifikasi',   notifRouter);
app.use('/api/peta',         petaRouter);
app.use('/api/export',       exportRouter);
app.use('/api/hari-libur',   hariLiburRouter);
app.use('/api/config',       configRouter);
app.use('/api/users',        userRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
