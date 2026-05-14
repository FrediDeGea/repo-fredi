-- ============================================================
-- SEED DATA — Tim, Auditor, Config, Exit Item
-- v9 FIXED (tanpa bandara_asal)
-- ============================================================

-- m_config
INSERT INTO m_config (key, value, keterangan) VALUES
('threshold_low_max',        '30', 'Batas atas poin untuk label LOW'),
('threshold_high_max',       '49', 'Batas atas poin untuk label HIGH'),
('threshold_repetition_min', '50', 'Batas bawah poin untuk label REPETITION'),
('jeda_minimal_hari',        '3',  'Jeda minimal hari antar penugasan')
ON CONFLICT (key) DO NOTHING;

-- m_user default (password hash = Admin@123)
INSERT INTO m_user (nama, email, password_hash, role, status_aktif) VALUES
('Administrator', 'admin@audit.com',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKcIzOHlS6mZ3Ka', 'admin',   true),
('Manager Audit', 'manager@audit.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKcIzOHlS6mZ3Ka', 'manager', true)
ON CONFLICT (email) DO NOTHING;

-- m_tim
INSERT INTO m_tim (nama_tim, kategori, accumulated_score, mode_transport) VALUES
('Tim 1',          'lapangan', 0, 'udara'),
('Tim 2',          'lapangan', 0, 'udara'),
('Tim 3',          'lapangan', 0, 'udara'),
('Tim 4',          'lapangan', 0, 'udara'),
('Tim 5',          'lapangan', 0, 'darat'),
('Tim 6',          'lapangan', 0, 'darat'),
('Tim 7',          'lapangan', 0, 'darat'),
('Tim 8',          'lapangan', 0, 'udara'),
('Tim Kalimantan', 'lapangan', 0, 'udara'),
('Tim NTT',        'lapangan', 0, 'darat'),
('Tim Madiun',     'lapangan', 0, 'darat'),
('Tim Perpajakan', 'pajak',    0, 'menyesuaikan'),
('Tim Analis',     'analis',   0, 'menyesuaikan');

-- m_tim_wilayah
INSERT INTO m_tim_wilayah (id_tim, zona)
SELECT t.id_tim, z.zona FROM m_tim t
CROSS JOIN (VALUES ('jawa_timur'),('bali'),('sulawesi'),('kalimantan'),('ntt')) AS z(zona)
WHERE t.nama_tim IN ('Tim 1','Tim 2','Tim 3','Tim 4');

INSERT INTO m_tim_wilayah (id_tim, zona)
SELECT id_tim, 'jawa_tengah' FROM m_tim WHERE nama_tim IN ('Tim 5','Tim 6','Tim 7');

INSERT INTO m_tim_wilayah (id_tim, zona)
SELECT t.id_tim, z.zona FROM m_tim t
CROSS JOIN (VALUES ('sulawesi'),('lombok')) AS z(zona)
WHERE t.nama_tim = 'Tim 8';

INSERT INTO m_tim_wilayah (id_tim, zona) SELECT id_tim, 'kalimantan' FROM m_tim WHERE nama_tim = 'Tim Kalimantan';
INSERT INTO m_tim_wilayah (id_tim, zona) SELECT id_tim, 'ntt'        FROM m_tim WHERE nama_tim = 'Tim NTT';
INSERT INTO m_tim_wilayah (id_tim, zona) SELECT id_tim, 'madiun'     FROM m_tim WHERE nama_tim = 'Tim Madiun';
INSERT INTO m_tim_wilayah (id_tim, zona) SELECT id_tim, 'all'        FROM m_tim WHERE nama_tim IN ('Tim Perpajakan','Tim Analis');

-- m_auditor
INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Rio Helmy S'),('Yogi P'),('David S'),('Shane'),('Aditya DP')) AS a(nama)
WHERE t.nama_tim = 'Tim 1';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Bobby Susanto'),('David Setyawan'),('Aditya Dwi Putra')) AS a(nama)
WHERE t.nama_tim = 'Tim 2';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Henry Wahono'),('Alan Teguh'),('Faisal Apriliawan')) AS a(nama)
WHERE t.nama_tim = 'Tim 3';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Yohanes Wiradharma'),('Benedictus Dika A'),('Allan Wibisono'),('Ciptawidya Adyatma')) AS a(nama)
WHERE t.nama_tim = 'Tim 4';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Handoko'),('Sebastian'),('Noor Jati')) AS a(nama)
WHERE t.nama_tim = 'Tim 5';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Yoga'),('Brian'),('Supriyanto')) AS a(nama)
WHERE t.nama_tim = 'Tim 6';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Adi'),('Rheza'),('Cornelius Yoga')) AS a(nama)
WHERE t.nama_tim = 'Tim 7';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Iqbal'),('Ami'),('Henri T')) AS a(nama)
WHERE t.nama_tim = 'Tim 8';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Achmad Syarif'),('Faoyim'),('Anzeli')) AS a(nama)
WHERE t.nama_tim = 'Tim Kalimantan';

INSERT INTO m_auditor (id_tim, nama, status_aktif) SELECT id_tim, 'Angela Merici', true FROM m_tim WHERE nama_tim = 'Tim NTT';
INSERT INTO m_auditor (id_tim, nama, status_aktif) SELECT id_tim, 'Periskila',     true FROM m_tim WHERE nama_tim = 'Tim Madiun';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Yopi K'),('Ronald K'),('Aditya Rizky')) AS a(nama)
WHERE t.nama_tim = 'Tim Perpajakan';

INSERT INTO m_auditor (id_tim, nama, status_aktif)
SELECT t.id_tim, a.nama, true FROM m_tim t
CROSS JOIN (VALUES ('Lydia Tjiputra'),('Yunika W'),('Jemima'),('Felicia F'),('Felicia A'),('Fredianto'),('Jessica'),('Naomi'),('Cassela'),('Yunar')) AS a(nama)
WHERE t.nama_tim = 'Tim Analis';

-- m_exit_item (13 item)
INSERT INTO m_exit_item (nama_item, urutan, is_active) VALUES
('Hasil Opname Kas Penerimaan dan Giro',             1,  true),
('Hasil Opname Kas Operasional',                      2,  true),
('TOD Bukti Kas Operasional dan Penerimaan',          3,  true),
('Bon Sementara dan Biaya yang Belum Dibukukan',      4,  true),
('Konfirmasi Penjualan Lain',                         5,  true),
('Saldo Bank Penerimaan dan Operasional',             6,  true),
('Rekon Setoran Penjualan Tunai dan Tagihan Tunai',   7,  true),
('Hasil Opname Invoice',                              8,  true),
('Konfirmasi Lapangan/By Phone',                      9,  true),
('Hasil Stock Gudang dan Dokumentasi Kondisi Gudang', 10, true),
('Hasil Stok Gudang Kanvas',                          11, true),
('Compliance Test',                                   12, true),
('Other',                                             13, true);

-- ============================================================
-- Verifikasi
SELECT nama_tim, kategori, mode_transport FROM m_tim ORDER BY id_tim;
SELECT COUNT(*) AS total_auditor FROM m_auditor;
SELECT COUNT(*) AS total_exit_item FROM m_exit_item;
-- ============================================================
