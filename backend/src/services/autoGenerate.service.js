'use strict';

const pool = require('../config/database');
const availabilityService = require('./availability.service');
const notificationService = require('./notification.service');
const auditLogService = require('./auditLog.service');

const TIM_JATIM_LUAR_PULAU = ['Tim 1','Tim 2','Tim 3','Tim 4'];
const ZONA_JAWA_TIMUR      = ['jatim','jatim_bali'];
const ZONA_LUAR_PULAU      = ['kalimantan','sulawesi','ntt','bali'];
const TIM_KALIMANTAN       = 'Tim Kalimantan';

const KALIMANTAN_PROXIMITY = {
  banjarmasin: ['banjarmasin','palangkaraya','balikpapan','samarinda','pontianak'],
  balikpapan:  ['balikpapan','samarinda','banjarmasin','palangkaraya','pontianak'],
  samarinda:   ['samarinda','balikpapan','banjarmasin','palangkaraya','pontianak'],
};

async function getConfig() {
  const res = await pool.query('SELECT key,value FROM m_config');
  const cfg = {};
  res.rows.forEach(r => { cfg[r.key] = parseInt(r.value,10); });
  return cfg;
}

async function getMonthlyDistribution(year,month) {
  const res = await pool.query(
    `SELECT p.id_tim,t.nama_tim,d.zona FROM t_penjadwalan p
     JOIN m_daerah d ON p.id_daerah=d.id_daerah
     JOIN m_tim t ON p.id_tim=t.id_tim
     WHERE t.nama_tim=ANY($1)
       AND EXTRACT(YEAR FROM p.tgl_mulai)=$2
       AND EXTRACT(MONTH FROM p.tgl_mulai)=$3
       AND p.status_approval!='rejected'`,
    [TIM_JATIM_LUAR_PULAU,year,month]
  );
  const dist={};
  for(const row of res.rows){
    if(!dist[row.id_tim]) dist[row.id_tim]={nama_tim:row.nama_tim,punya_jatim:false,punya_luar_pulau:false};
    if(ZONA_JAWA_TIMUR.includes(row.zona)) dist[row.id_tim].punya_jatim=true;
    if(ZONA_LUAR_PULAU.includes(row.zona)) dist[row.id_tim].punya_luar_pulau=true;
  }
  return dist;
}

async function selectTeam(id_daerah,tgl_mulai){
  const daerahRes=await pool.query('SELECT zona FROM m_daerah WHERE id_daerah=$1',[id_daerah]);
  if(!daerahRes.rows.length) throw new Error(`Daerah ${id_daerah} tidak ditemukan`);
  const zona=daerahRes.rows[0].zona;
  if(zona==='kalimantan') return [];

  const timRes=await pool.query(
    `SELECT t.id_tim,t.nama_tim,t.accumulated_score FROM m_tim t
     JOIN m_tim_wilayah tw ON t.id_tim=tw.id_tim
     WHERE tw.zona=$1 OR tw.zona='all'
     ORDER BY t.accumulated_score ASC`,[zona]
  );
  const timList=timRes.rows;
  if(!timList.length) return [];

  const isJatim=ZONA_JAWA_TIMUR.includes(zona);
  const isLuarPulau=ZONA_LUAR_PULAU.includes(zona);
  if(!isJatim&&!isLuarPulau) return timList;

  const tgl=new Date(tgl_mulai);
  const dist=await getMonthlyDistribution(tgl.getFullYear(),tgl.getMonth()+1);
  const tim14=timList.filter(t=>TIM_JATIM_LUAR_PULAU.includes(t.nama_tim));
  const timLain=timList.filter(t=>!TIM_JATIM_LUAR_PULAU.includes(t.nama_tim));
  const butuhJatim=[],butuhLuarPulau=[],sudahLengkap=[];

  for(const tim of tim14){
    const d=dist[tim.id_tim]||{punya_jatim:false,punya_luar_pulau:false};
    if(!d.punya_jatim&&!d.punya_luar_pulau){butuhJatim.push(tim);butuhLuarPulau.push(tim);}
    else if(!d.punya_jatim) butuhJatim.push(tim);
    else if(!d.punya_luar_pulau) butuhLuarPulau.push(tim);
    else sudahLengkap.push(tim);
  }
  const sort=arr=>arr.sort((a,b)=>a.accumulated_score-b.accumulated_score);
  if(isJatim)     return [...sort(butuhJatim),...sort(sudahLengkap),...timLain];
  if(isLuarPulau) return [...sort(butuhLuarPulau),...sort(sudahLengkap),...timLain];
  return timList;
}

async function getKalimantanAuditors(){
  const res=await pool.query(
    `SELECT a.id_auditor,a.nama,a.domisili_zona,t.id_tim FROM m_auditor a
     JOIN m_tim t ON a.id_tim=t.id_tim
     WHERE t.nama_tim=$1 AND a.status_aktif=true ORDER BY a.id_auditor`,
    [TIM_KALIMANTAN]
  );
  return res.rows;
}

async function checkKalimantanAuditorAvailability(id_auditor,tgl_mulai,tgl_selesai,jedaHari=3){
  const batasMulai=new Date(tgl_mulai); batasMulai.setDate(batasMulai.getDate()-jedaHari);
  const batasAkhir=new Date(tgl_selesai); batasAkhir.setDate(batasAkhir.getDate()+jedaHari);

  const cuti=await pool.query(
    `SELECT COUNT(*) AS total FROM t_cuti_auditor
     WHERE id_auditor=$1 AND status='approved'
       AND tgl_mulai<=$3 AND tgl_selesai>=$2`,
    [id_auditor,tgl_mulai,tgl_selesai]
  );
  if(parseInt(cuti.rows[0].total)>0) return false;

  const jadwal=await pool.query(
    `SELECT COUNT(*) AS total FROM t_penjadwalan
     WHERE id_auditor_pic=$1 AND status_approval!='rejected'
       AND (tgl_mulai BETWEEN $2 AND $3 OR tgl_selesai BETWEEN $2 AND $3
            OR (tgl_mulai<=$2 AND tgl_selesai>=$3))`,
    [id_auditor,
     batasMulai.toISOString().split('T')[0],
     batasAkhir.toISOString().split('T')[0]]
  );
  return parseInt(jadwal.rows[0].total)===0;
}

async function selectKalimantanAuditor(zona_daerah,tgl_mulai,tgl_selesai,jedaHari){
  const auditors=await getKalimantanAuditors();
  const scored=auditors.map(a=>{
    const proximity=KALIMANTAN_PROXIMITY[a.domisili_zona]||[];
    return {...a,proximity_score:proximity.indexOf(zona_daerah)===-1?99:proximity.indexOf(zona_daerah)};
  }).sort((a,b)=>a.proximity_score-b.proximity_score);

  for(const auditor of scored){
    const tersedia=await checkKalimantanAuditorAvailability(
      auditor.id_auditor,tgl_mulai,tgl_selesai,jedaHari
    );
    if(tersedia) return auditor;
  }
  return null;
}

async function checkKalimantanJoinFlag(zona_daerah,tgl_mulai,tgl_selesai){
  const res=await pool.query(
    `SELECT p.id_jadwal,t.nama_tim,d.nama_daerah FROM t_penjadwalan p
     JOIN m_tim t ON p.id_tim=t.id_tim JOIN m_daerah d ON p.id_daerah=d.id_daerah
     WHERE t.nama_tim=ANY($1) AND d.zona=$2 AND p.status_approval!='rejected'
       AND (p.tgl_mulai BETWEEN $3 AND $4 OR p.tgl_selesai BETWEEN $3 AND $4)`,
    [TIM_JATIM_LUAR_PULAU,zona_daerah,tgl_mulai,tgl_selesai]
  );
  return res.rows;
}

async function getDaerahOrdered(){
  const res=await pool.query(
    `SELECT d.id_daerah,d.nama_daerah,d.zona,d.base_point,d.durasi_hari,
            d.tipe_kunjungan,d.priority_label,d.priority_score,
            COALESCE(ha.is_fraud,false) AS fraud_aktif
     FROM m_daerah d
     LEFT JOIN (
       SELECT DISTINCT ON(p.id_daerah) ha.is_fraud,p.id_daerah
       FROM t_hasil_audit ha JOIN t_penjadwalan p ON ha.id_jadwal=p.id_jadwal
       WHERE ha.is_fraud=true AND ha.fraud_cleared_at IS NULL
       ORDER BY p.id_daerah,ha.tgl_input DESC
     ) ha ON d.id_daerah=ha.id_daerah
     WHERE d.status_operasi='aktif' AND d.tipe_kunjungan IN('mandiri','PP')
     ORDER BY CASE WHEN ha.is_fraud=true THEN 0 ELSE 1 END ASC,
              d.priority_score DESC NULLS LAST,d.base_point DESC`
  );
  return res.rows;
}

async function saveJadwal(client,{id_daerah,id_tim,id_auditor_pic,tgl_mulai,tgl_selesai,created_by}){
  const res=await client.query(
    `INSERT INTO t_penjadwalan
       (id_daerah,id_tim,id_auditor_pic,tgl_mulai,tgl_selesai,status_approval,is_locked,created_by,created_at)
     VALUES($1,$2,$3,$4,$5,'pending',false,$6,NOW()) RETURNING id_jadwal`,
    [id_daerah,id_tim,id_auditor_pic||null,tgl_mulai,tgl_selesai,created_by]
  );
  return res.rows[0].id_jadwal;
}

async function autoGenerate({tgl_mulai,tgl_selesai,created_by}){
  const config=await getConfig();
  const jedaHari=config.jeda_minimal_hari||3;
  const daerahList=await getDaerahOrdered();
  const results={berhasil:[],warnings:[],join_flags:[]};

  const timKalRes=await pool.query('SELECT id_tim FROM m_tim WHERE nama_tim=$1',[TIM_KALIMANTAN]);
  const idTimKalimantan=timKalRes.rows[0]?.id_tim;

  const client=await pool.connect();
  try{
    await client.query('BEGIN');

    for(const daerah of daerahList){
      const tglMulai=new Date(tgl_mulai);
      const tglSelesai=new Date(tglMulai);
      tglSelesai.setDate(tglSelesai.getDate()+(daerah.durasi_hari||3)-1);
      const tmStr=tglMulai.toISOString().split('T')[0];
      const tsStr=tglSelesai.toISOString().split('T')[0];

      // ── KALIMANTAN ──
      if(daerah.zona==='kalimantan'&&idTimKalimantan){
        const joinFlags=await checkKalimantanJoinFlag(daerah.zona,tmStr,tsStr);
        if(joinFlags.length>0){
          results.join_flags.push({
            daerah:daerah.nama_daerah,zona:daerah.zona,
            tim_bertugas:joinFlags.map(j=>j.nama_tim).join(', '),
            pesan:`Tim Jatim aktif di zona ini — pertimbangkan bantu vs jadwal mandiri`
          });
          await notificationService.create({
            id_user:created_by,
            pesan:`🔔 ${daerah.nama_daerah}: ${joinFlags[0].nama_tim} aktif di zona ini. Auditor Kalimantan bisa bantu — cek manual.`
          });
        }

        const auditor=await selectKalimantanAuditor(daerah.zona,tmStr,tsStr,jedaHari);
        if(!auditor){
          results.warnings.push({id_daerah:daerah.id_daerah,nama_daerah:daerah.nama_daerah,
            pesan:'Semua auditor Tim Kalimantan tidak tersedia'});
          await notificationService.create({id_user:created_by,
            pesan:`Warning: Semua auditor Kalimantan tidak tersedia untuk ${daerah.nama_daerah}`});
          continue;
        }

        const id_jadwal=await saveJadwal(client,{
          id_daerah:daerah.id_daerah,id_tim:idTimKalimantan,
          id_auditor_pic:auditor.id_auditor,tgl_mulai:tmStr,tgl_selesai:tsStr,created_by
        });
        results.berhasil.push({id_jadwal,id_daerah:daerah.id_daerah,
          nama_daerah:daerah.nama_daerah,id_tim:idTimKalimantan,
          nama_tim:TIM_KALIMANTAN,auditor_pic:auditor.nama,
          domisili:auditor.domisili_zona,tgl_mulai:tmStr,tgl_selesai:tsStr});
        continue;
      }

      // ── NON-KALIMANTAN ──
      const timList=await selectTeam(daerah.id_daerah,tmStr);
      if(!timList.length){
        results.warnings.push({id_daerah:daerah.id_daerah,nama_daerah:daerah.nama_daerah,
          pesan:'Tidak ada tim dengan cakupan wilayah ini'});
        await notificationService.create({id_user:created_by,
          pesan:`Warning: Tidak ada tim untuk ${daerah.nama_daerah}`});
        continue;
      }

      let terpilih=null;
      for(const tim of timList){
        const tersedia=await availabilityService.check(tim.id_tim,tmStr,tsStr,{jedaHari});
        if(tersedia){terpilih=tim;break;}
      }

      if(!terpilih){
        results.warnings.push({id_daerah:daerah.id_daerah,nama_daerah:daerah.nama_daerah,
          pesan:'Semua tim tidak tersedia untuk periode ini'});
        await notificationService.create({id_user:created_by,
          pesan:`Warning: Semua tim tidak tersedia untuk ${daerah.nama_daerah}`});
        continue;
      }

      const id_jadwal=await saveJadwal(client,{
        id_daerah:daerah.id_daerah,id_tim:terpilih.id_tim,
        id_auditor_pic:null,tgl_mulai:tmStr,tgl_selesai:tsStr,created_by
      });
      results.berhasil.push({id_jadwal,id_daerah:daerah.id_daerah,
        nama_daerah:daerah.nama_daerah,id_tim:terpilih.id_tim,
        nama_tim:terpilih.nama_tim,tgl_mulai:tmStr,tgl_selesai:tsStr});
    }

    await client.query('COMMIT');

    if(results.join_flags.length>0){
      const mgrRes=await pool.query(`SELECT id_user FROM m_user WHERE role='manager'`);
      for(const m of mgrRes.rows){
        await notificationService.create({id_user:m.id_user,
          pesan:`Generate selesai: ${results.join_flags.length} daerah Kalimantan berpotensi Join Tim Jatim.`});
      }
    }

    await auditLogService.log({id_user:created_by,aksi:'GENERATE',
      tabel_target:'t_penjadwalan',id_record:null,data_lama:null,
      data_baru:{tgl_mulai,tgl_selesai,total:results.berhasil.length,
        warnings:results.warnings.length,join_flags:results.join_flags.length}});

    return results;
  }catch(err){
    await client.query('ROLLBACK');
    throw err;
  }finally{
    client.release();
  }
}

async function reGenerate({tgl_mulai,tgl_selesai,created_by}){
  await pool.query(
    `DELETE FROM t_penjadwalan WHERE is_locked=false AND tgl_mulai>=$1 AND tgl_selesai<=$2`,
    [tgl_mulai,tgl_selesai]
  );
  const result=await autoGenerate({tgl_mulai,tgl_selesai,created_by});
  const lockedRes=await pool.query(
    `SELECT p.id_jadwal,p.id_tim,p.id_auditor_pic,p.tgl_mulai,p.tgl_selesai,d.nama_daerah
     FROM t_penjadwalan p JOIN m_daerah d ON p.id_daerah=d.id_daerah
     WHERE p.is_locked=true AND p.tgl_mulai>=$1 AND p.tgl_selesai<=$2`,
    [tgl_mulai,tgl_selesai]
  );
  const conflicts=[];
  for(const locked of lockedRes.rows){
    const konflik=result.berhasil.find(r=>{
      const same=r.id_tim===locked.id_tim||
        (locked.id_auditor_pic&&r.id_auditor_pic===locked.id_auditor_pic);
      return same&&new Date(r.tgl_mulai)<=new Date(locked.tgl_selesai)
                 &&new Date(r.tgl_selesai)>=new Date(locked.tgl_mulai);
    });
    if(konflik){
      conflicts.push({jadwal_terkunci:locked,jadwal_baru:konflik});
      await pool.query('DELETE FROM t_penjadwalan WHERE id_jadwal=$1',[konflik.id_jadwal]);
    }
  }
  if(conflicts.length>0){
    result.conflicts=conflicts;
    await notificationService.create({id_user:created_by,
      pesan:`Re-generate: ${conflicts.length} konflik dengan jadwal terkunci.`});
  }
  return result;
}

module.exports={
  autoGenerate,reGenerate,
  selectTeam,selectKalimantanAuditor,
  getMonthlyDistribution,getKalimantanAuditors
};
