-- ============================================================
-- SMART AUDIT SCHEDULING SYSTEM — Migration SQL v9
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS m_user (
  id_user SERIAL PRIMARY KEY, nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','area_manager')),
  status_aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(), last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS m_config (
  id_config SERIAL PRIMARY KEY, key VARCHAR(100) NOT NULL UNIQUE,
  value VARCHAR(255) NOT NULL, keterangan TEXT
);

CREATE TABLE IF NOT EXISTS m_tim (
  id_tim SERIAL PRIMARY KEY, nama_tim VARCHAR(100) NOT NULL,
  kategori VARCHAR(20) NOT NULL CHECK (kategori IN ('lapangan','pajak','analis')),
  id_area_manager INT REFERENCES m_user(id_user),
  accumulated_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  mode_transport VARCHAR(20) NOT NULL CHECK (mode_transport IN ('udara','darat','opsional','menyesuaikan'))
);

CREATE TABLE IF NOT EXISTS m_tim_wilayah (
  id SERIAL PRIMARY KEY, id_tim INT NOT NULL REFERENCES m_tim(id_tim) ON DELETE CASCADE,
  zona VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS m_auditor (
  id_auditor SERIAL PRIMARY KEY, id_tim INT NOT NULL REFERENCES m_tim(id_tim) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL, status_aktif BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS m_daerah (
  id_daerah SERIAL PRIMARY KEY, nama_daerah VARCHAR(200) NOT NULL,
  bus_area VARCHAR(20), regional VARCHAR(50), zona VARCHAR(50) NOT NULL,
  base_point INT NOT NULL CHECK (base_point BETWEEN 1 AND 8),
  tipe_kunjungan VARCHAR(20) NOT NULL DEFAULT 'mandiri'
    CHECK (tipe_kunjungan IN ('mandiri','PP','SO_cabang')),
  durasi_hari INT, parent_daerah_id INT REFERENCES m_daerah(id_daerah),
  is_join_ia BOOLEAN NOT NULL DEFAULT false,
  status_operasi VARCHAR(20) NOT NULL DEFAULT 'aktif'
    CHECK (status_operasi IN ('aktif','non_aktif')),
  priority_label VARCHAR(20) NOT NULL DEFAULT 'NEW'
    CHECK (priority_label IN ('FRAUD','REPETITION','HIGH','LOW','NEW')),
  priority_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_audit_date DATE, latitude NUMERIC(10,7), longitude NUMERIC(10,7)
);

CREATE TABLE IF NOT EXISTS m_hari_libur (
  id_libur SERIAL PRIMARY KEY, tanggal DATE NOT NULL UNIQUE,
  nama_libur VARCHAR(150) NOT NULL, tahun INT NOT NULL
);

CREATE TABLE IF NOT EXISTS m_exit_item (
  id_item SERIAL PRIMARY KEY, nama_item VARCHAR(200) NOT NULL,
  urutan INT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS t_penjadwalan (
  id_jadwal SERIAL PRIMARY KEY,
  id_daerah INT NOT NULL REFERENCES m_daerah(id_daerah),
  id_tim INT NOT NULL REFERENCES m_tim(id_tim),
  tgl_mulai DATE NOT NULL, tgl_selesai DATE NOT NULL,
  status_approval VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status_approval IN ('pending','approved','rejected')),
  is_locked BOOLEAN NOT NULL DEFAULT false, catatan_personel TEXT,
  created_by INT REFERENCES m_user(id_user),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_hasil_audit (
  id_hasil SERIAL PRIMARY KEY,
  id_jadwal INT NOT NULL REFERENCES t_penjadwalan(id_jadwal),
  skor_temuan INT CHECK (skor_temuan BETWEEN 0 AND 100),
  total_poin_exit INT CHECK (total_poin_exit BETWEEN 13 AND 65),
  priority_label VARCHAR(20) CHECK (priority_label IN ('LOW','HIGH','REPETITION','FRAUD')),
  is_fraud BOOLEAN NOT NULL DEFAULT false, tgl_input TIMESTAMP NOT NULL DEFAULT NOW(),
  fraud_cleared_by INT REFERENCES m_user(id_user),
  fraud_cleared_at TIMESTAMP, fraud_cleared_note TEXT
);

CREATE TABLE IF NOT EXISTS t_hasil_exit_item (
  id_hasil_item SERIAL PRIMARY KEY,
  id_hasil INT NOT NULL REFERENCES t_hasil_audit(id_hasil) ON DELETE CASCADE,
  id_item INT NOT NULL REFERENCES m_exit_item(id_item),
  label VARCHAR(20) NOT NULL CHECK (label IN ('LOW','HIGH','REPETITION')), keterangan TEXT
);

CREATE TABLE IF NOT EXISTS t_rekomendasi_audit (
  id_rekomendasi SERIAL PRIMARY KEY,
  id_daerah INT NOT NULL REFERENCES m_daerah(id_daerah),
  id_hasil INT REFERENCES t_hasil_audit(id_hasil),
  alasan VARCHAR(20) NOT NULL CHECK (alasan IN ('REPETITION','FRAUD')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  catatan_manager TEXT, created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_cuti_auditor (
  id_cuti SERIAL PRIMARY KEY,
  id_auditor INT NOT NULL REFERENCES m_auditor(id_auditor) ON DELETE CASCADE,
  tgl_mulai DATE NOT NULL, tgl_selesai DATE NOT NULL,
  jenis_cuti VARCHAR(20) NOT NULL CHECK (jenis_cuti IN ('tahunan','sakit','izin')),
  keterangan TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending','approved','rejected'))
);

CREATE TABLE IF NOT EXISTS t_notifikasi (
  id_notif SERIAL PRIMARY KEY,
  id_user INT NOT NULL REFERENCES m_user(id_user) ON DELETE CASCADE,
  pesan TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_audit_log (
  id_log SERIAL PRIMARY KEY, id_user INT REFERENCES m_user(id_user),
  aksi VARCHAR(30) NOT NULL, tabel_target VARCHAR(50), id_record INT,
  data_lama JSONB, data_baru JSONB, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penjadwalan_tim    ON t_penjadwalan(id_tim);
CREATE INDEX IF NOT EXISTS idx_penjadwalan_daerah ON t_penjadwalan(id_daerah);
CREATE INDEX IF NOT EXISTS idx_penjadwalan_tgl    ON t_penjadwalan(tgl_mulai, tgl_selesai);
CREATE INDEX IF NOT EXISTS idx_hasil_audit        ON t_hasil_audit(id_jadwal);
CREATE INDEX IF NOT EXISTS idx_notifikasi_user    ON t_notifikasi(id_user, is_read);
CREATE INDEX IF NOT EXISTS idx_daerah_priority    ON m_daerah(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_daerah_bus_area    ON m_daerah(bus_area);
