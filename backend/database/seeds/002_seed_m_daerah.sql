-- ================================================================
-- SEED DATA m_daerah — 127 Daerah Audit Lengkap (v5 Final)
-- v5: tambah frekuensi_audit_per_tahun (default 1)
-- Tipe: mandiri=89 | PP=11 | SO_cabang=27 | non-aktif=2
-- ================================================================

INSERT INTO m_daerah (
  nama_daerah, bus_area, regional, zona, base_point,
  tipe_kunjungan, durasi_hari, is_join_ia,
  status_operasi, frekuensi_audit_per_tahun,
  priority_label, priority_score
) VALUES
  ('DISTRIK WONOCOLO','AB02','JATIM','jatim',1,'PP',1,false,'aktif',1,'NEW',0),
  ('SO SIDOARJO','AB02','JATIM','jatim',1,'PP',1,false,'aktif',1,'NEW',0),
  ('DISTRIK DRIYOREJO','AB03','JATIM','jatim',1,'PP',1,false,'aktif',1,'NEW',0),
  ('DISTRIK KALISOSOK','AB04','JATIM','jatim',1,'PP',1,false,'aktif',1,'NEW',0),
  ('DISTRIK MANYAR','AB05','JATIM','jatim',1,'PP',1,false,'aktif',1,'NEW',0),
  ('DISTRIK MERR','AB07','JATIM','jatim',1,'PP',1,false,'aktif',1,'NEW',0),
  ('PT. IJ - MOJOKERTO','D010','JATIM - BALI','jatim',2,'PP',1,false,'aktif',1,'NEW',0),
  ('PT. IJ - JOMBANG','D011','JATIM - BALI','jatim',2,'PP',1,false,'aktif',1,'NEW',0),
  ('PT. SAM - KEDIRI','D020','JATIM - BALI','jatim',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT.SAM - NGANJUK','D021','JATIM - BALI','jatim',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. SAM - SO PARE','D022','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. WW - TULUNGAGUNG','D030','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. WW - BLITAR','D031','JATIM - BALI','jatim',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. WW - SO TRENGGALEK','D032','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. INP - BOJONEGORO','D040','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. INP - LAMONGAN','D041','JATIM - BALI','jatim',2,'PP',1,false,'aktif',1,'NEW',0),
  ('PT. INP - TUBAN','D042','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KNC - BANYUWANGI','D050','JATIM - BALI','jatim',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. KNC - SO GENTENG','D051','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. CGL - MADIUN RINGROAD','D430','JATIM - BALI','jatim',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. CGL - PACITAN','D431','JATIM - BALI','jatim',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. CGL - SO PONOROGO','D432','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. CGL - NGAWI','D433','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. CGL - MADIUN JIWAN','D434','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. CGL - MAGETAN','D435','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. DDS - KARANGLO','D440','JATIM - BALI','bali',3,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. DDS - PASURUAN','D441','JATIM - BALI','jatim',2,'PP',1,false,'aktif',1,'NEW',0),
  ('PT. DDS - PROBOLINGGO','D442','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. DDS - TENAGA BARU','D443','JATIM - BALI','jatim',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. DDS - SO BATU','D444','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. DDS - KEPANJEN','D445','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. DDS - SO KRAKSAAN','D446','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. TKP - JEMBER','D450','JATIM - BALI','jatim',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. TKP - LUMAJANG','D451','JATIM - BALI','jatim',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. TKP - SITUBONDO','D452','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. TKP - BONDOWOSO','D453','JATIM - BALI','jatim',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. TKP - SO KENCONG','D454','JATIM - BALI','jatim',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. KGM - PAMEKASAN','N040','JATIM - BALI','jatim',3,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KGM - BANGKALAN','N050','JATIM - BALI','jatim',3,'PP',1,false,'aktif',1,'NEW',0),
  ('PT. KGM - SUMENEP','N060','JATIM - BALI','jatim',3,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. AAA - DENPASAR','D380','JATIM - BALI','bali',3,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. AAA - KLUNGKUNG','D381','JATIM - BALI','bali',3,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. AAA - SINGARAJA','D382','JATIM - BALI','bali',3,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. AAA - NEGARA','D383','JATIM - BALI','bali',3,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. AAA - NUSA DUA','D384','JATIM - BALI','bali',3,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. AAA - SO SANUR','D385','JATIM - BALI','bali',3,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. AAA - SO KARANG ASEM','D386','JATIM - BALI','bali',3,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. AAA - BIMA','D387','JATIM - BALI','bali',3,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. CNKL - BLORA','D070','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. CNKL - PURWODADI','D071','JATENG','jawa_tengah',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. CNKL - SO CEPU','D072','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. CNKL - SO GUBUG','D072','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. CNKL - BANGKLE','D074','JATENG','jawa_tengah',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. IDRM - MANGKANG','D080','JATENG','jawa_tengah',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. IDRM - TERBOYO','D081','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. IDRM - REMBANG','D082','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. IDRM - SO PATI','D083','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. IDRM - SO UNGARAN','D084','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. FMA - PURWOKERTO','D090','JATENG','jawa_tengah',2,'mandiri',6,false,'aktif',1,'NEW',0),
  ('PT. FMA - MAJENANG','D091','JATENG','jawa_tengah',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. FMA - BANJARNEGARA','D092','JATENG','jawa_tengah',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. FMA - SO GOMBONG','D093','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. FMA - SO WONOSOBO','D094','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. FMA - SO KESUGIHAN','D095','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. FMA - WANGON','D096','JATENG','jawa_tengah',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. ITS - TEGAL MARIBAYA','D100','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. ITS - BUMIAYU','D101','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. ITS - PEKALONGAN','D102','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. ITS - TEGAL PADAHARJA','D103','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. ITS - SO BOJONG','D104','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. ITS - SO BREBES','D105','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. CKAA - YOGYA','D110','JATENG','jawa_tengah',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. CKAA - SO BANTUL','D111','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. CKAA - SO KULONPROGO','D112','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. BSA - SOLO','D120','JATENG','jawa_tengah',2,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. BSA - SALATIGA','D121','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. BSA - SRAGEN','D122','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. PAA - MAGELANG SECANG','D370','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. PAA - MAGELANG BERINGIN','D371','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. DIC - KUDUS LINGKAR','D560','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. DIC - KUDUS RAYA','D561','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. DIC - SO JEPARA','D562','JATENG','jawa_tengah',2,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. NBIA - KLATEN & WONOSARI','N010','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. NBIA - WONOGIRI','N020','JATENG','jawa_tengah',2,'mandiri',3,false,'aktif',1,'NEW',0),
  ('PT. NBIA - PURWOREJO & KEBUMEN','N030','JATENG','jawa_tengah',2,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KK - BANJARMASIN','D150','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KK - BARABAI','D151','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KK - BATULICIN','D152','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KK - MUARA TEWEH','D154','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KK  - BANJARBARU','D155','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. SKK - SAMPIT','D160','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. SKK - P.BUN','D161','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. SKK - P.RAYA','D162','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KNT - BALIKPAPAN','D170','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KNT - SO GROGOT (SUDAH TIDAK BEROPERASI)','D171','KALIMANTAN','kalimantan',5,'SO_cabang',NULL,false,'non_aktif',1,'NEW',0),
  ('PT. SHK - SAMARINDA','D180','KALIMANTAN','kalimantan',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. SHK - BONTANG','D181','KALIMANTAN','kalimantan',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. SHK - BERAU','D182','KALIMANTAN','kalimantan',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KPR - UJUNGPANDANG','D190','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KPR - BANTAENG','D198','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KPR - POLMAN','D19A','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. KPR - GOWA','D19B','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. KPR - PANGKEP','D19C','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. SSS - PALU','D200','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. SSS - TOLIS','D201','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. SSS - POSO','D202','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. TD - MANADO','D210','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. TD - TOMOHON','D211','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. TD - KOTAMOBAGO','D214','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. ASS - GORONTALO','D220','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. ASS - MARISA','D221','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. KAC - KENDARI','D230','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. KAC - KOLAKA','D231','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. BACB - MAKASSAR','N070','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. BACB - PARE-PARE','N071','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. BACB - BONE','N072','SULAWESI','sulawesi',5,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. BACB - LUWU','N073','SULAWESI','sulawesi',5,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. BACB - SORONG','N074','SULAWESI','sulawesi',8,'SO_cabang',NULL,false,'aktif',1,'NEW',0),
  ('PT. IHS - RUTENG','D240','NTT','ntt',7,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. IHS - LABUAN BAJO','D241','NTT','ntt',7,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. IHS - MAUMERE','D242','NTT','ntt',7,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. IHS - ENDE','D243','NTT','ntt',7,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. IHS - BAJAWA (SUDAH TIDAK BEROPERASI)','D244','NTT','ntt',7,'SO_cabang',NULL,false,'non_aktif',1,'NEW',0),
  ('PT. CL - KUPANG','D250','NTT','ntt',7,'mandiri',4,false,'aktif',1,'NEW',0),
  ('PT. CL - SOE','D251','NTT','ntt',7,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. CL - ATAMBUA','D252','NTT','ntt',7,'mandiri',5,false,'aktif',1,'NEW',0),
  ('PT. CL - KEFA','D253','NTT','ntt',7,'SO_cabang',NULL,false,'aktif',1,'NEW',0);

-- ----------------------------------------------------------------
-- STEP 2: Set parent_daerah_id untuk SO Cabang
-- ----------------------------------------------------------------
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D020' LIMIT 1) WHERE bus_area = 'D022' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D030' LIMIT 1) WHERE bus_area = 'D032' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D050' LIMIT 1) WHERE bus_area = 'D051' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D430' LIMIT 1) WHERE bus_area = 'D432' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D434' LIMIT 1) WHERE bus_area = 'D435' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D440' LIMIT 1) WHERE bus_area = 'D444' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D442' LIMIT 1) WHERE bus_area = 'D446' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D450' LIMIT 1) WHERE bus_area = 'D454' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D382' LIMIT 1) WHERE bus_area = 'D384' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D380' LIMIT 1) WHERE bus_area = 'D385' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D381' LIMIT 1) WHERE bus_area = 'D386' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D070' LIMIT 1) WHERE bus_area = 'D072' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D082' LIMIT 1) WHERE bus_area = 'D083' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D081' LIMIT 1) WHERE bus_area = 'D084' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D090' LIMIT 1) WHERE bus_area = 'D093' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D092' LIMIT 1) WHERE bus_area = 'D094' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D090' LIMIT 1) WHERE bus_area = 'D095' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D100' LIMIT 1) WHERE bus_area = 'D104' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D100' LIMIT 1) WHERE bus_area = 'D105' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D110' LIMIT 1) WHERE bus_area = 'D111' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D110' LIMIT 1) WHERE bus_area = 'D112' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D560' LIMIT 1) WHERE bus_area = 'D562' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D170' LIMIT 1) WHERE bus_area = 'D171' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'N070' LIMIT 1) WHERE bus_area = 'N074' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D240' LIMIT 1) WHERE bus_area = 'D244' AND tipe_kunjungan = 'SO_cabang';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area = 'D251' LIMIT 1) WHERE bus_area = 'D253' AND tipe_kunjungan = 'SO_cabang';
-- SO GUBUG: bus_area sama D072, bedakan via nama
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area='D071' LIMIT 1) WHERE bus_area='D072' AND nama_daerah ILIKE '%GUBUG%';
UPDATE m_daerah SET parent_daerah_id = (SELECT id_daerah FROM m_daerah WHERE bus_area='D070' LIMIT 1) WHERE bus_area='D072' AND nama_daerah ILIKE '%CEPU%';

-- ----------------------------------------------------------------
-- STEP 3: Verifikasi
-- ----------------------------------------------------------------
SELECT
  COUNT(*) AS total_daerah,
  COUNT(*) FILTER (WHERE frekuensi_audit_per_tahun = 1) AS frekuensi_1,
  COUNT(*) FILTER (WHERE tipe_kunjungan = 'mandiri')    AS mandiri,
  COUNT(*) FILTER (WHERE tipe_kunjungan = 'PP')         AS pp,
  COUNT(*) FILTER (WHERE tipe_kunjungan = 'SO_cabang')  AS so_cabang,
  COUNT(*) FILTER (WHERE status_operasi = 'non_aktif')  AS non_aktif
FROM m_daerah;
-- Harusnya: total=127 | frekuensi_1=127 | mandiri=89 | pp=11 | so_cabang=27 | non_aktif=2