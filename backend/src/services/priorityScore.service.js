'use strict';
const pool = require('../config/database');

async function getThresholds() {
  const res = await pool.query(
    `SELECT key, value FROM m_config
     WHERE key IN ('threshold_low_max','threshold_high_max','threshold_repetition_min')`
  );
  const cfg = {};
  res.rows.forEach(r => { cfg[r.key] = parseInt(r.value, 10); });
  return {
    lowMax: cfg.threshold_low_max || 30,
    highMax: cfg.threshold_high_max || 49,
    repetitionMin: cfg.threshold_repetition_min || 50
  };
}

function determinePriorityLabel(totalPoin, isFraud, thresholds) {
  if (isFraud) return 'FRAUD';
  if (totalPoin >= thresholds.repetitionMin) return 'REPETITION';
  if (totalPoin > thresholds.lowMax) return 'HIGH';
  return 'LOW';
}

async function calculatePriorityScore(id_daerah) {
  const res = await pool.query(
    `SELECT ha.total_poin_exit, ha.is_fraud, ha.tgl_input
     FROM t_hasil_audit ha
     JOIN t_penjadwalan p ON ha.id_jadwal = p.id_jadwal
     WHERE p.id_daerah = $1
     ORDER BY ha.tgl_input DESC LIMIT 3`,
    [id_daerah]
  );

  if (!res.rows.length) {
    await pool.query(
      `UPDATE m_daerah SET priority_label='NEW', priority_score=0 WHERE id_daerah=$1`,
      [id_daerah]
    );
    return { priority_label: 'NEW', priority_score: 0 };
  }

  const thresholds = await getThresholds();
  const latest = res.rows[0];
  const isFraud = res.rows.some(a => a.is_fraud);
  const latestScore = latest.total_poin_exit || 0;
  const avgScore = res.rows.reduce((s, a) => s + (a.total_poin_exit || 0), 0) / res.rows.length;
  const priorityScore = Math.round(latestScore * 0.7 + avgScore * 0.3);
  const priorityLabel = determinePriorityLabel(latestScore, isFraud, thresholds);

  await pool.query(
    `UPDATE m_daerah SET priority_label=$1, priority_score=$2, last_audit_date=$3 WHERE id_daerah=$4`,
    [priorityLabel, priorityScore, latest.tgl_input, id_daerah]
  );

  if (['REPETITION', 'FRAUD'].includes(priorityLabel)) {
    const exists = await pool.query(
      `SELECT 1 FROM t_rekomendasi_audit WHERE id_daerah=$1 AND status='pending'`, [id_daerah]
    );
    if (!exists.rows.length) {
      const hasilRes = await pool.query(
        `SELECT ha.id_hasil FROM t_hasil_audit ha
         JOIN t_penjadwalan p ON ha.id_jadwal=p.id_jadwal
         WHERE p.id_daerah=$1 ORDER BY ha.tgl_input DESC LIMIT 1`, [id_daerah]
      );
      if (hasilRes.rows.length) {
        await pool.query(
          `INSERT INTO t_rekomendasi_audit (id_daerah, id_hasil, alasan, status, created_at, updated_at)
           VALUES ($1,$2,$3,'pending',NOW(),NOW())`,
          [id_daerah, hasilRes.rows[0].id_hasil, priorityLabel]
        );
      }
    }
  }
  return { priority_label: priorityLabel, priority_score: priorityScore };
}

function calculateExitMeetingTotal(items) {
  const POIN = { LOW: 1, HIGH: 3, REPETITION: 5 };
  return items.reduce((s, i) => s + (POIN[i.label] || 1), 0);
}

module.exports = { calculatePriorityScore, calculateExitMeetingTotal, determinePriorityLabel, getThresholds };
