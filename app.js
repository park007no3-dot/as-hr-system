const firebaseConfig = {
  apiKey: "AIzaSyD3Tg9WXET5QhCOsdpYyx6A6CVpMRm1iyA",
  authDomain: "jhpark002-a3d53.firebaseapp.com",
  projectId: "jhpark002-a3d53",
  storageBucket: "jhpark002-a3d53.firebasestorage.app",
  messagingSenderId: "102006847920",
  appId: "1:102006847920:web:b7a5bab288cdb0dbfb7e75"
};
const IS_CFG=!FIREBASE_CONFIG.apiKey.includes('여기에');
let db=null,useFirebase=false;
function _initFirebase(){
  if(!IS_CFG){
    document.getElementById('setupBanner').classList.add('show');
    const ob=document.getElementById('onlineBadge');ob.textContent='● 로컬 저장';ob.className='online-badge ob-local';
    setSyncStatus('offline','미연결');
    loadTo();lsLoad();
    return;
  }
  // Firebase SDK 동적 로드 (CDN)
  const fbScript1=document.createElement('script');
  fbScript1.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
  fbScript1.onload=function(){
    const fbScript2=document.createElement('script');
    fbScript2.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';
    fbScript2.onload=function(){
      try{
        if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
        db=firebase.firestore();
        useFirebase=true;
        document.getElementById('setupBanner').style.display='none';
        loadTo();startFB();
      }catch(e){
        console.warn('Firebase 실패:',e);
        document.getElementById('setupBanner').classList.add('show');
        loadTo();lsLoad();
      }
    };
    fbScript2.onerror=function(){loadTo();lsLoad();};
    document.head.appendChild(fbScript2);
  };
  fbScript1.onerror=function(){loadTo();lsLoad();};
  document.head.appendChild(fbScript1);
}

const CENTERS=['동부센터','서부센터','중부센터','남부센터'];
const TYPES=['정규직','무기계약직','프로젝트직','계약직'];
const ROLES=['센터장','단지관리자','일반기능공','기동반','관리'];
const C_BADGE={동부센터:'b-east',서부센터:'b-west',중부센터:'b-mid',남부센터:'b-south'};
const T_BADGE={정규직:'b-full',무기계약직:'b-mugi',프로젝트직:'b-proj',계약직:'b-cont'};
const C_COLOR={동부센터:'#1a4a7c',서부센터:'#1b4a22',중부센터:'#7c5a00',남부센터:'#7c1a1a'};
const C_CLS={동부센터:'cc-east',서부센터:'cc-west',중부센터:'cc-mid',남부센터:'cc-south'};
const LS_EMP='as_hr_v7',LS_TO='as_hr_to_v7';
let employees=[],editId=null;

// T/O 데이터
const TO_COLS=12; // 12개 월 컬럼
let toData={};
function loadTo(){try{const r=localStorage.getItem(LS_TO);if(r)toData=JSON.parse(r);}catch(_e){}if(!toData.year)toData.year='2026';if(!toData.writeDate)toData.writeDate=new Date().toISOString().slice(0,10).replace(/-/g,'.');}
function saveTo(){try{localStorage.setItem(LS_TO,JSON.stringify(toData));}catch(_e){}}
window._toChange=function(k,v){toData[k]=v;saveTo();};

function setSyncStatus(s,t){document.getElementById('syncDot').className='dot dot-'+s;document.getElementById('syncText').textContent=t;}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}
function calcAge(b){if(!b)return'−';const bd=new Date(b),n=new Date();let a=n.getFullYear()-bd.getFullYear();if(n<new Date(n.getFullYear(),bd.getMonth(),bd.getDate()))a--;return a+'세';}
function daysUntil(d){if(!d)return null;const t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(d)-t)/86400000);}
function fmt(d){return d?d.replace(/-/g,'.'):'−';}
function elapsedYM(s){
  if(!s)return'−';
  const sd=new Date(s),n=new Date();if(isNaN(sd))return'−';
  let y=n.getFullYear()-sd.getFullYear(),m=n.getMonth()-sd.getMonth();
  if(m<0){y--;m+=12;}return y+'년 '+m+'개월';
}

function lsLoad(){try{const r=localStorage.getItem(LS_EMP);employees=r?JSON.parse(r).employees||[]:sampleData();}catch(_e){employees=sampleData();}render();renderLeft();}
function lsSave(){try{localStorage.setItem(LS_EMP,JSON.stringify({employees}));}catch(_e){}}

function startFB(){
  setSyncStatus('syncing','동기화중...');
  db.collection('employees').onSnapshot(snap=>{
    employees=snap.docs.map(d=>({...d.data(),id:d.id}));
    setSyncStatus('online','실시간');
    document.getElementById('lastUpdated').textContent='업데이트: '+new Date().toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    render();renderLeft();
  },e=>setSyncStatus('offline','연결끊김'));
}
async function fbSave(e){try{setSyncStatus('syncing','저장중...');await db.collection('employees').doc(String(e.id)).set(e);}catch(_e){showToast('저장실패');}}
async function fbDel(id){try{await db.collection('employees').doc(String(id)).delete();}catch(_e){showToast('삭제실패');}}
async function fbClear(){const snap=await db.collection('employees').get();const b=db.batch();snap.docs.forEach(d=>b.delete(d.ref));await b.commit();}
async function fbImport(list){
  const snap=await db.collection('employees').get();const b=db.batch();snap.docs.forEach(d=>b.delete(d.ref));
  list.forEach((e,i)=>{e.id=e.id||('emp_'+Date.now()+'_'+i);b.set(db.collection('employees').doc(String(e.id)),e);});
  await b.commit();
}

window.onStatusChange=function(){document.getElementById('grp_leftdate').style.display=document.getElementById('f_status').value==='퇴사'?'flex':'none';};

function renderStatsGroups(){
  const ac=employees.filter(e=>e.status!=='퇴사');
  document.getElementById('statsGroups').innerHTML=`
    <div class="stats-group"><div class="stats-group-title">계약방식별 인원</div><div class="stats-group-cards">
      <div class="scard"><div class="scard-lbl">전체</div><div class="scard-val total">${ac.length}</div></div><div class="divider-v"></div>
      ${TYPES.map((t,i)=>`<div class="scard"><div class="scard-lbl">${t}</div><div class="scard-val t-${t}">${ac.filter(e=>e.type===t).length}</div></div>`).join('')}
    </div></div>
    <div class="stats-group"><div class="stats-group-title">센터별 인원</div><div class="stats-group-cards">
      ${CENTERS.map((c,i)=>`<div class="scard"><div class="scard-lbl">${c}</div><div class="scard-val c-${'east west mid south'.split(' ')[i]}">${ac.filter(e=>e.center===c).length}</div></div>`).join('')}
    </div></div>`;
}

function renderExitPanel(){
  const ac=employees.filter(e=>e.status!=='퇴사');
  const d60=ac.filter(e=>{if(!e.exitDate)return false;const d=daysUntil(e.exitDate);return d!==null&&d>30&&d<=60;});
  const d30=ac.filter(e=>{if(!e.exitDate)return false;const d=daysUntil(e.exitDate);return d!==null&&d>=0&&d<=30;});
  const wrap=document.getElementById('exitPanel');
  if(!d60.length&&!d30.length){wrap.innerHTML='';return;}
  const th=`<thead><tr><th>센터</th><th>근무현장</th><th>성명</th><th>담당업무</th><th>퇴사예정일</th><th>D-Day</th><th>수정</th></tr></thead>`;
  const mkR=list=>list.sort((a,b)=>daysUntil(a.exitDate)-daysUntil(b.exitDate)).map(e=>{const d=daysUntil(e.exitDate);return`<tr><td><span class="badge ${C_BADGE[e.center]||''}">${e.center||'−'}</span></td><td class="td-left">${e.site||'−'}</td><td style="font-weight:700">${e.name}</td><td>${e.role||'−'}</td><td>${fmt(e.exitDate)}</td><td style="font-weight:700;color:${d<=30?'#991b1b':'#b45309'}">D-${d}</td><td><button class="btn" style="padding:2px 7px;font-size:10px" onclick="window._editEmp('${e.id}')">수정</button></td></tr>`;}).join('');
  let h='<div class="exit-panel">';
  if(d60.length)h+=`<div class="exit-panel-sec s60"><div class="exit-ph h60" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'"><div class="exit-ph-left">🔶 퇴사예정 60일 이내<span class="exit-cnt">${d60.length}명</span></div><span>▲</span></div><div class="exit-pb"><table>${th}<tbody>${mkR(d60)}</tbody></table></div></div>`;
  if(d30.length)h+=`<div class="exit-panel-sec s30" style="margin-top:8px"><div class="exit-ph h30" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'"><div class="exit-ph-left">🔴 퇴사예정 30일 이내<span class="exit-cnt">${d30.length}명</span></div><span>▲</span></div><div class="exit-pb"><table>${th}<tbody>${mkR(d30)}</tbody></table></div></div>`;
  wrap.innerHTML=h+'</div>';
}

window.clearFilters=function(){['fType','fCenter','fRole','fSite'].forEach(id=>document.getElementById(id).value='');document.getElementById('fSearch').value='';render();};

function updateSiteFilter(){const sel=document.getElementById('fSite'),cur=sel.value;const ac=employees.filter(e=>e.status!=='퇴사');const sites=[...new Set(ac.map(e=>e.site))].filter(Boolean).sort();sel.innerHTML='<option value="">전체 근무현장</option>'+sites.map(s=>`<option${s===cur?' selected':''}>${s}</option>`).join('');}

function render(){
  updateSiteFilter();renderStatsGroups();renderExitPanel();
  let list=employees.filter(e=>e.status!=='퇴사');
  const ft=document.getElementById('fType').value,fc=document.getElementById('fCenter').value,fr=document.getElementById('fRole').value,fs=document.getElementById('fSite').value,fn=document.getElementById('fSearch').value.trim();
  if(ft)list=list.filter(e=>e.type===ft);
  if(fc)list=list.filter(e=>e.center===fc);
  if(fr)list=list.filter(e=>e.role===fr);
  if(fs)list=list.filter(e=>e.site===fs);
  if(fn)list=list.filter(e=>(e.name||'').includes(fn)||(e.skill||'').includes(fn));
  const tb=document.getElementById('tbody');
  if(!list.length){tb.innerHTML='<tr><td colspan="18" style="text-align:center;padding:2rem;color:#aaa">데이터가 없습니다</td></tr>';return;}
  tb.innerHTML=list.map(e=>{
    const d=e.exitDate?daysUntil(e.exitDate):null;
    let ec='<span class="tag-none">−</span>',rc='';
    if(e.exitDate){if(d!==null&&d<0)ec=`<span class="tag-urgent">${fmt(e.exitDate)} 만료</span>`;else if(d!==null&&d<=7){ec=`<span class="tag-urgent">${fmt(e.exitDate)} D-${d}</span>`;rc='row-d30';}else if(d!==null&&d<=30){ec=`<span class="tag-d30">${fmt(e.exitDate)} D-${d}</span>`;rc='row-d30';}else if(d!==null&&d<=60){ec=`<span class="tag-d60">${fmt(e.exitDate)} D-${d}</span>`;rc='row-d60';}else ec=`<span class="tag-ok">${fmt(e.exitDate)}</span>`;}
    return`<tr class="${rc}"><td><span class="badge ${C_BADGE[e.center]||''}">${e.center||'−'}</span></td><td class="td-left">${e.site||'−'}</td><td class="td-left" style="color:#666">${e.corp||'−'}</td><td style="font-size:10px">${fmt(e.compDate)}</td><td style="font-size:10px;color:#666;white-space:nowrap">${elapsedYM(e.compDate)}</td><td style="font-weight:700">${e.name}</td><td><span class="badge ${T_BADGE[e.type]||''}">${e.type}</span></td><td>${e.role||'−'}</td><td><span class="st-working">근무중</span></td><td>${e.gender||'−'}</td><td>${calcAge(e.birth)}</td><td>${fmt(e.birth)}</td><td>${fmt(e.join)}</td><td>${ec}</td><td>${e.skill||'−'}</td><td>${e.edu||'−'}</td><td class="td-left" style="color:#666;max-width:90px;overflow:hidden;text-overflow:ellipsis">${e.memo||'−'}</td><td><button class="btn" style="padding:2px 8px;font-size:11px" onclick="window._editEmp('${e.id}')">수정</button></td></tr>`;
  }).join('');
  if(document.getElementById('tab-org').classList.contains('active'))renderOrg();
}

function renderLeft(){
  const la=employees.filter(e=>e.status==='퇴사');
  document.getElementById('leftSummary').innerHTML=`<div class="left-card"><div class="lbl">전체</div><div class="val">${la.length}명</div></div>`+CENTERS.map(c=>`<div class="left-card"><div class="lbl">${c}</div><div class="val">${la.filter(e=>e.center===c).length}명</div></div>`).join('');
  let list=la;const lc=document.getElementById('lfCenter').value,ls=document.getElementById('lfSearch').value.trim();
  if(lc)list=list.filter(e=>e.center===lc);if(ls)list=list.filter(e=>(e.name||'').includes(ls));
  const tb=document.getElementById('leftTbody');
  if(!list.length){tb.innerHTML='<tr><td colspan="16" style="text-align:center;padding:2rem;color:#aaa">퇴사자가 없습니다</td></tr>';return;}
  tb.innerHTML=list.map(e=>`<tr><td><span class="badge ${C_BADGE[e.center]||''}">${e.center||'−'}</span></td><td class="td-left">${e.site||'−'}</td><td class="td-left" style="color:#666">${e.corp||'−'}</td><td style="font-size:10px">${fmt(e.compDate)}</td><td style="font-weight:700">${e.name}</td><td><span class="badge ${T_BADGE[e.type]||''}">${e.type}</span></td><td>${e.role||'−'}</td><td>${e.gender||'−'}</td><td>${calcAge(e.birth)}</td><td>${fmt(e.join)}</td><td>${fmt(e.exitDate)||'−'}</td><td style="font-weight:700;color:#555">${fmt(e.leftDate)||'−'}</td><td>${e.skill||'−'}</td><td>${e.edu||'−'}</td><td class="td-left" style="color:#666">${e.memo||'−'}</td><td style="display:flex;gap:4px"><button class="btn" style="padding:2px 7px;font-size:10px" onclick="window._editEmp('${e.id}')">수정</button><button class="btn btn-success" style="padding:2px 7px;font-size:10px" onclick="window._reactivate('${e.id}')">복직</button></td></tr>`).join('');
}

// ── T/O 입력셀 헬퍼 ──
function toCell(key,dark){return`<input class="to-input${dark?' dark':''}" value="${toData[key]||''}" onchange="window._toChange('${key}',this.value)">`;}
function toNoteCell(key,dark,w){return`<input class="to-input${dark?' dark':''}" style="width:${w||50}px" value="${toData[key]||''}" onchange="window._toChange('${key}',this.value)">`;}

function renderStatsTab(){
  const ac=employees.filter(e=>e.status!=='퇴사');
  const total=ac.length;
  function barChart(items,colors){const max=Math.max(...items.map(i=>i.v),1);return items.map((item,i)=>`<div class="bar-row"><div class="bar-lbl">${item.l}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(item.v/max*100)}%;background:${colors[i%colors.length]}">${item.v>0?item.v:''}</div></div><div class="bar-num">${item.v}명</div></div>`).join('');}
  const typeData=TYPES.map(t=>({l:t,v:ac.filter(e=>e.type===t).length}));
  const centerData=CENTERS.map(c=>({l:c,v:ac.filter(e=>e.center===c).length}));
  const roleData=ROLES.map(r=>({l:r,v:ac.filter(e=>e.role===r).length}));
  const mCnt=ac.filter(e=>e.gender==='남').length,fCnt=ac.filter(e=>e.gender==='여').length;
  let totals=TYPES.map(()=>0),grand=0;
  const crows=CENTERS.map(c=>{const counts=TYPES.map(t=>ac.filter(e=>e.center===c&&e.type===t).length);const rt=counts.reduce((a,b)=>a+b,0);counts.forEach((v,i)=>totals[i]+=v);grand+=rt;return{c,counts,rt};});
  const yr=toData.year||'2026';
  // 월 헤더: 각 열의 월 표기도 수기 수정 가능
  const months=Array.from({length:12},(_,i)=>toData['month_'+i]||(i===0?'3월':i===1?'3월':i===2?'3월':(i+1)+'월'));
  const mkRow=(label,keyPfx,dark)=>`<tr class="${dark?'total-bg':''}"><td class="${dark?'rh':'rh'}" style="${dark?'color:#fff;background:#1F4E79':''}">${label}</td>${months.map((_,i)=>`<td>${toCell(keyPfx+'_'+i,dark)}</td>`).join('')}<td>${toNoteCell(keyPfx+'_note',dark,50)}</td></tr>`;

  document.getElementById('statsWrap').innerHTML=`
    <!-- T/O 표 -->
    <div class="stats-card" style="padding:12px 14px">
      <div style="text-align:center;font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:7px;padding-bottom:6px;border-bottom:2px solid #1F4E79">AS 기동반, 일반기능공 T/O</div>
      <div style="display:flex;justify-content:flex-end;font-size:10px;color:#555;margin-bottom:6px;gap:5px;align-items:center">
        작성일&nbsp;<input style="border:none;border-bottom:1px solid #aaa;font-size:10px;width:72px;text-align:center;font-family:inherit;background:transparent" value="${toData.writeDate||''}" onchange="window._toChange('writeDate',this.value)">
      </div>
      <div class="to-table-wrap">
        <table class="to-table">
          <thead>
            <tr>
              <th rowspan="2" style="min-width:42px">구분</th>
              <th colspan="12" style="background:#2E75B6"><input style="width:36px;border:none;border-bottom:1px solid #8ab;font-size:10px;text-align:center;font-family:inherit;background:transparent;color:#fff" value="${yr}" onchange="window._toChange('year',this.value)">년</th>
              <th rowspan="2" style="min-width:46px">비고</th>
            </tr>
            <tr>${months.map((m,i)=>`<th style="min-width:32px"><input class="to-mth" value="${m}" onchange="window._toChange('month_'+${i},this.value)"></th>`).join('')}</tr>
          </thead>
          <tbody>
            <tr><td class="rh" rowspan="3">현장수</td>${months.map((_,i)=>`<td>${toCell('현장수_상주_'+i)}</td>`).join('')}<td rowspan="3">${toNoteCell('현장수_note',false,50)}</td></tr>
            <tr>${months.map((_,i)=>`<td>${toCell('현장수_비상주_'+i)}</td>`).join('')}</tr>
            <tr>${months.map((_,i)=>`<td>${toCell('현장수_소계_'+i)}</td>`).join('')}</tr>
            <tr><td class="sh" colspan="14" style="padding:2px 5px;background:#f0f4fa;color:#777;font-size:9px">상주관리 / 비상주관리 / 소계</td></tr>
            <tr><td class="rh" rowspan="3">기동반</td>${months.map((_,i)=>`<td>${toCell('기동반_TO_'+i)}</td>`).join('')}<td rowspan="3">${toNoteCell('기동반_note',false,50)}</td></tr>
            <tr>${months.map((_,i)=>`<td>${toCell('기동반_배치_'+i)}</td>`).join('')}</tr>
            <tr>${months.map((_,i)=>`<td>${toCell('기동반_추가_'+i)}</td>`).join('')}</tr>
            <tr><td class="sh" colspan="14" style="padding:2px 5px;background:#f0f4fa;color:#777;font-size:9px">T/O / 배치 / 추가충원</td></tr>
            <tr><td class="rh" rowspan="3">기능공</td>${months.map((_,i)=>`<td>${toCell('기능공_TO_'+i)}</td>`).join('')}<td rowspan="3">${toNoteCell('기능공_note',false,50)}</td></tr>
            <tr>${months.map((_,i)=>`<td>${toCell('기능공_배치_'+i)}</td>`).join('')}</tr>
            <tr>${months.map((_,i)=>`<td>${toCell('기능공_추가_'+i)}</td>`).join('')}</tr>
            <tr><td class="sh" colspan="14" style="padding:2px 5px;background:#f0f4fa;color:#777;font-size:9px">T/O / 배치 / 추가충원</td></tr>
            <tr class="total-bg"><td class="rh" style="color:#fff" rowspan="3">합계</td>${months.map((_,i)=>`<td>${toCell('합계_TO_'+i,true)}</td>`).join('')}<td rowspan="3">${toNoteCell('합계_note',true,50)}</td></tr>
            <tr class="total-bg">${months.map((_,i)=>`<td>${toCell('합계_배치_'+i,true)}</td>`).join('')}</tr>
            <tr class="total-bg">${months.map((_,i)=>`<td>${toCell('합계_추가_'+i,true)}</td>`).join('')}</tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 전체 현황 요약 -->
    <div class="stats-card">
      <h4>📊 전체 현황 요약 <span class="cnt">재직 ${total}명</span></h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div><div style="font-size:11px;color:#888;margin-bottom:10px;font-weight:600">▎ 계약방식별 재직 인원</div>${barChart(typeData,['#2E75B6','#1D9E75','#f97316','#D4537E'])}</div>
        <div><div style="font-size:11px;color:#888;margin-bottom:10px;font-weight:600">▎ 센터별 재직 인원</div>${barChart(centerData,['#1a4a7c','#1b4a22','#7c5a00','#7c1a1a'])}</div>
      </div>
    </div>

    <!-- 센터별 계약방식 크로스 -->
    <div class="stats-card">
      <h4>🏢 센터별 계약방식 현황</h4>
      <div class="cross-wrap">
        <table class="cross-table">
          <thead><tr><th>센터</th>${TYPES.map(t=>`<th>${t}</th>`).join('')}<th>총원</th></tr></thead>
          <tbody>
            ${crows.map(r=>`<tr><td style="font-weight:700;color:${C_COLOR[r.c]}">${r.c}</td>${r.counts.map(v=>`<td>${v||'−'}</td>`).join('')}<td>${r.rt}</td></tr>`).join('')}
            <tr><td>합계</td>${totals.map(v=>`<td>${v}</td>`).join('')}<td>${grand}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 담당업무 & 성별 -->
    <div class="stats-card">
      <h4>👷 담당업무 &amp; 성별 현황</h4>
      <div style="display:grid;grid-template-columns:1fr 280px;gap:28px;align-items:start">
        <div><div style="font-size:11px;color:#888;margin-bottom:10px;font-weight:600">▎ 담당업무별 인원</div>${barChart(roleData,['#2E75B6','#1D9E75','#f97316','#D4537E','#8B5CF6'])}</div>
        <div>
          <div style="font-size:11px;color:#888;margin-bottom:10px;font-weight:600">▎ 성별 인원</div>
          <div style="display:flex;align-items:center;gap:18px">
            <svg width="90" height="90" viewBox="0 0 90 90">${(()=>{const tot=mCnt+fCnt||1,ang=mCnt/tot*360,r=40,cx=45,cy=45,p=a=>[cx+r*Math.cos((a-90)*Math.PI/180),cy+r*Math.sin((a-90)*Math.PI/180)],[x1,y1]=p(0),[x2,y2]=p(ang),lg=ang>180?1:0;if(!mCnt)return`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#D4537E"/>`;if(!fCnt)return`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2E75B6"/>`;return`<path d="M${cx},${cy} L${x1},${y1} A${r},${r},0,${lg},1,${x2},${y2} Z" fill="#2E75B6"/><path d="M${cx},${cy} L${x2},${y2} A${r},${r},0,${1-lg},1,${x1},${y1} Z" fill="#D4537E"/>`;})()}</svg>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${[{l:'남',v:mCnt,c:'#2E75B6'},{l:'여',v:fCnt,c:'#D4537E'}].map(g=>`<div style="display:flex;align-items:center;gap:7px;font-size:12px"><span style="width:10px;height:10px;border-radius:50%;background:${g.c};display:inline-block"></span>${g.l}성 <b style="margin-left:4px">${g.v}명</b></div>`).join('')}
              <div style="font-size:11px;color:#aaa">합계 ${mCnt+fCnt}명</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── 조직도 렌더 ──
function renderOrg(){
  const ac=employees.filter(e=>e.status!=='퇴사');
  // 담당업무 정렬 우선순위 (현장 내): 단지관리자 → 기동반 → 일반기능공 → 관리 → 기타
  const roleOrder=['단지관리자','기동반','일반기능공','관리','센터장'];
  function roleSort(a,b){const ai=roleOrder.indexOf(a.role),bi=roleOrder.indexOf(b.role);return(ai<0?99:ai)-(bi<0?99:bi);}

  document.getElementById('orgGrid').innerHTML=CENTERS.map(center=>{
    const cls=C_CLS[center];
    // 센터장
    const mgrs=ac.filter(e=>e.center===center&&e.role==='센터장');
    // 센터 직속 인원 (현장 없는 인원 또는 센터직속으로 볼 역할: 기동반, 관리 등 site가 없거나 role이 특정 역할)
    // → 현장(site)이 있는 비-센터장 인원을 현장 그룹으로, 없는 인원을 센터 직속으로 처리
    const centerStaff=ac.filter(e=>e.center===center&&e.role!=='센터장'&&!e.site);
    const sitePersons=ac.filter(e=>e.center===center&&e.role!=='센터장'&&e.site);

    // 현장별 그룹핑
    const siteMap={};
    sitePersons.forEach(e=>{
      const s=e.site;
      if(!siteMap[s])siteMap[s]={compDate:e.compDate,people:[]};
      siteMap[s].people.push(e);
    });
    // 현장 내 인원 정렬: 단지관리자 → 기동반 → 일반기능공 → 관리
    Object.values(siteMap).forEach(d=>d.people.sort(roleSort));

    const mgrHTML=mgrs.length
      ?mgrs.map(m=>`<div class="org-mgr">👤 센터장 : ${m.name}</div>`).join('')
      :`<div class="org-mgr" style="opacity:.5;font-weight:400;font-size:10px">센터장 미배정</div>`;

    // 센터 직속 인원 박스
    const centerStaffHTML=centerStaff.length?`<div class="org-center-staff">
      <div class="org-center-staff-title">▎ 센터 직속</div>
      ${centerStaff.sort(roleSort).map(p=>`<div class="org-center-person"><span class="org-pname">${p.name}</span><span class="org-prole">· ${p.role}</span></div>`).join('')}
    </div>`:'';

    const sitesHTML=Object.entries(siteMap).map(([site,data])=>`
      <div class="org-site">
        <div class="org-site-name">📍 ${site}</div>
        <div class="org-site-meta">준공: ${data.compDate?fmt(data.compDate):'미기재'} | ${elapsedYM(data.compDate)}</div>
        ${data.people.map(p=>`<div class="org-person"><span class="org-pname">${p.name}</span><span class="org-prole">· ${p.role}</span></div>`).join('')}
      </div>`).join('');

    return`<div class="org-center-col ${cls}">
      <div class="org-ch">${center}</div>
      <div class="org-cb">
        ${mgrHTML}
        ${centerStaffHTML}
        ${sitesHTML||'<div class="org-empty">소속 현장 없음</div>'}
      </div>
    </div>`;
  }).join('');
}

// ── 탭 전환 ──
window.switchTab=function(tab){
  ['hr','left','stats','org'].forEach((t,i)=>{document.querySelectorAll('.tab')[i].classList.toggle('active',t===tab);document.getElementById('tab-'+t).classList.toggle('active',t===tab);});
  if(tab==='stats')renderStatsTab();
  if(tab==='left')renderLeft();
  if(tab==='org')renderOrg();
};

// ── 인쇄 ──
window.printStats=function(){
  // 통계 탭만 보이게 하여 세로 인쇄
  const style=document.createElement('style');style.id='pst';
  style.textContent=`@page{size:A4 portrait;margin:12mm}@media print{#tab-stats{display:block!important}#tab-hr,#tab-left,#tab-org{display:none!important}}`;
  document.head.appendChild(style);
  window.print();
  document.getElementById('pst').remove();
};
window.printOrg=function(){
  renderOrg();
  const style=document.createElement('style');style.id='por';
  style.textContent=`@page{size:A4 landscape;margin:8mm}@media print{#tab-org{display:block!important}#tab-hr,#tab-left,#tab-stats{display:none!important}.org-print-header{display:block!important}}`;
  document.head.appendChild(style);
  window.print();
  document.getElementById('por').remove();
};

// ── 모달 ──
function resetForm(){['name','site','corp','skill','memo'].forEach(k=>document.getElementById('f_'+k).value='');['type','gender','edu','center','role'].forEach(k=>document.getElementById('f_'+k).value='');['birth','join','exit','leftdate','compdate'].forEach(k=>document.getElementById('f_'+k).value='');document.getElementById('f_status').value='근무중';document.getElementById('grp_leftdate').style.display='none';}
window.openModal=function(){editId=null;resetForm();document.getElementById('modalTitle').textContent='직원 추가';document.getElementById('delArea').innerHTML='';document.getElementById('modalBg').classList.add('open');};
window._editEmp=function(id){
  const e=employees.find(x=>String(x.id)===String(id));if(!e)return;
  editId=id;resetForm();
  document.getElementById('modalTitle').textContent='직원 수정';
  document.getElementById('delArea').innerHTML=`<button class="btn btn-danger" style="font-size:11px;padding:4px 9px" onclick="window._delEmp('${id}')">삭제</button>`;
  ['name','site','corp','skill','memo'].forEach(k=>document.getElementById('f_'+k).value=e[k]||'');
  ['type','gender','edu','center','role'].forEach(k=>document.getElementById('f_'+k).value=e[k]||'');
  document.getElementById('f_birth').value=e.birth||'';document.getElementById('f_join').value=e.join||'';
  document.getElementById('f_exit').value=e.exitDate||'';document.getElementById('f_compdate').value=e.compDate||'';
  document.getElementById('f_status').value=e.status||'근무중';
  if(e.status==='퇴사'){document.getElementById('grp_leftdate').style.display='flex';document.getElementById('f_leftdate').value=e.leftDate||'';}
  document.getElementById('modalBg').classList.add('open');
};
window.closeModal=function(){document.getElementById('modalBg').classList.remove('open');};
window.saveEmp=async function(){
  const name=document.getElementById('f_name').value.trim(),center=document.getElementById('f_center').value,type=document.getElementById('f_type').value,site=document.getElementById('f_site').value.trim(),role=document.getElementById('f_role').value;
  if(!name||!center||!type||!site||!role){alert('성명, 센터, 근무현장, 계약방식, 담당업무는 필수입니다.');return;}
  const status=document.getElementById('f_status').value;
  const emp={id:editId||('emp_'+Date.now()),name,center,type,site,role,corp:document.getElementById('f_corp').value.trim(),compDate:document.getElementById('f_compdate').value||null,gender:document.getElementById('f_gender').value,birth:document.getElementById('f_birth').value,join:document.getElementById('f_join').value,exitDate:document.getElementById('f_exit').value||null,status,leftDate:status==='퇴사'?document.getElementById('f_leftdate').value||null:null,skill:document.getElementById('f_skill').value.trim(),edu:document.getElementById('f_edu').value,memo:document.getElementById('f_memo').value.trim(),updatedAt:new Date().toISOString()};
  window.closeModal();
  if(useFirebase){await fbSave(emp);showToast(editId?'수정됐습니다':'추가됐습니다');}
  else{if(editId){const i=employees.findIndex(x=>String(x.id)===String(editId));if(i>=0)employees[i]=emp;}else employees.push(emp);lsSave();render();renderLeft();showToast(editId?'수정됐습니다':'추가됐습니다');}
};
window._delEmp=async function(id){if(!confirm('삭제하시겠습니까?'))return;window.closeModal();if(useFirebase){await fbDel(id);}else{employees=employees.filter(x=>String(x.id)!==String(id));lsSave();render();renderLeft();}showToast('삭제됐습니다');};
window._reactivate=function(id){if(!confirm('복직 처리하시겠습니까?'))return;const i=employees.findIndex(x=>String(x.id)===String(id));if(i<0)return;employees[i]={...employees[i],status:'근무중',leftDate:null};if(useFirebase)fbSave(employees[i]);else{lsSave();}render();renderLeft();showToast('복직 처리됐습니다');};

window.importData=async function(ev){const file=ev.target.files[0];if(!file)return;const r=new FileReader();r.onload=async function(e){try{const d=JSON.parse(e.target.result);if(!d.employees)throw 0;if(!confirm(`${d.employees.length}명을 가져옵니다.`))return;if(useFirebase)await fbImport(d.employees);else{employees=d.employees;lsSave();render();renderLeft();}showToast(`${d.employees.length}명 가져오기 완료`);}catch(_e){showToast('올바른 파일이 아닙니다');}};r.readAsText(file);ev.target.value='';};
window.clearAll=async function(){if(!confirm('⚠ 모든 데이터를 삭제합니다.\n되돌릴 수 없습니다. 계속하시겠습니까?'))return;if(useFirebase)await fbClear();else{employees=[];lsSave();render();renderLeft();}showToast('초기화 완료');};

window.exportExcel=function(){if(!window.XLSX){const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=()=>_buildXlsx();s.onerror=()=>showToast('라이브러리 로드 실패');document.head.appendChild(s);showToast('엑셀 생성 중...');}else _buildXlsx();};
function _buildXlsx(){
  const XL=window.XLSX,today=new Date().toISOString().slice(0,10);
  const ac=employees.filter(e=>e.status!=='퇴사'),la=employees.filter(e=>e.status==='퇴사');
  const wb=XL.utils.book_new();
  const hdA=['센터','근무현장','법인명','준공일자','경과','성명','계약방식','담당업무','상태','성별','나이','생년월일','입사일','퇴사예정일','주특기','최종학력','비고'];
  const hdL=['센터','근무현장','법인명','준공일자','성명','계약방식','담당업무','상태','성별','나이','생년월일','입사일','퇴사예정일','실제퇴사일','주특기','최종학력','비고'];
  const mkA=list=>list.map(e=>[e.center||'',e.site||'',e.corp||'',e.compDate?e.compDate.replace(/-/g,'.'):'',elapsedYM(e.compDate),e.name||'',e.type||'',e.role||'','근무중',e.gender||'',calcAge(e.birth).replace('세',''),e.birth?e.birth.replace(/-/g,'.'):'',e.join?e.join.replace(/-/g,'.'):'',e.exitDate?e.exitDate.replace(/-/g,'.'):'',e.skill||'',e.edu||'',e.memo||'']);
  const mkL=list=>list.map(e=>[e.center||'',e.site||'',e.corp||'',e.compDate?e.compDate.replace(/-/g,'.'):'',e.name||'',e.type||'',e.role||'','퇴사',e.gender||'',calcAge(e.birth).replace('세',''),e.birth?e.birth.replace(/-/g,'.'):'',e.join?e.join.replace(/-/g,'.'):'',e.exitDate?e.exitDate.replace(/-/g,'.'):'',e.leftDate?e.leftDate.replace(/-/g,'.'):'',e.skill||'',e.edu||'',e.memo||'']);
  const ws1=XL.utils.aoa_to_sheet([hdA,...mkA(ac)]);ws1['!cols']=hdA.map(()=>({wch:12}));XL.utils.book_append_sheet(wb,ws1,'재직인원현황');
  const ws2=XL.utils.aoa_to_sheet([hdL,...mkL(la)]);ws2['!cols']=hdL.map(()=>({wch:12}));XL.utils.book_append_sheet(wb,ws2,'퇴사자현황');
  const sh=['센터',...TYPES,'총원'],sr=CENTERS.map(c=>{const cts=TYPES.map(t=>ac.filter(e=>e.center===c&&e.type===t).length);return[c,...cts,cts.reduce((a,b)=>a+b,0)];});const tots=TYPES.map(t=>ac.filter(e=>e.type===t).length);sr.push(['합계',...tots,tots.reduce((a,b)=>a+b,0)]);
  const ws3=XL.utils.aoa_to_sheet([sh,...sr]);XL.utils.book_append_sheet(wb,ws3,'센터별통계');
  XL.writeFile(wb,'AS인력관리_'+today+'.xlsx');showToast('엑셀 다운로드 완료');
}

document.addEventListener("DOMContentLoaded", function(){
  // 탭 버튼
  document.querySelectorAll('.tab[data-tab]').forEach(function(el){
    el.addEventListener('click', function(){ window.switchTab(this.getAttribute('data-tab')); });
  });
  // 상단 버튼들
  var btnAdd=document.getElementById('btnAddEmp');
  if(btnAdd) btnAdd.addEventListener('click', function(){ window.openModal(); });
  var btnClear=document.getElementById('btnClearAll');
  if(btnClear) btnClear.addEventListener('click', function(){ window.clearAll(); });
  var btnExcel=document.getElementById('btnExcel');
  if(btnExcel) btnExcel.addEventListener('click', function(){ window.exportExcel(); });
  var btnImport=document.getElementById('btnImport');
  if(btnImport) btnImport.addEventListener('click', function(){ document.getElementById('importFile').click(); });
  var btnImportFile=document.getElementById('importFile');
  if(btnImportFile) btnImportFile.addEventListener('change', function(ev){ window.importData(ev); });
  var btnPrintStats=document.getElementById('btnPrintStats');
  if(btnPrintStats) btnPrintStats.addEventListener('click', function(){ window.printStats(); });
  var btnPrintOrg=document.getElementById('btnPrintOrg');
  if(btnPrintOrg) btnPrintOrg.addEventListener('click', function(){ window.printOrg(); });
  // 필터
  var btnClearFilter=document.getElementById('btnClearFilter');
  if(btnClearFilter) btnClearFilter.addEventListener('click', function(){ window.clearFilters(); });
  ['fType','fCenter','fRole','fSite'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('change', render);
  });
  var fSearch=document.getElementById('fSearch');
  if(fSearch) fSearch.addEventListener('input', render);
  var lfCenter=document.getElementById('lfCenter');
  if(lfCenter) lfCenter.addEventListener('change', renderLeft);
  var lfSearch=document.getElementById('lfSearch');
  if(lfSearch) lfSearch.addEventListener('input', renderLeft);
  // 모달 버튼
  var btnCancel=document.getElementById('btnModalCancel');
  if(btnCancel) btnCancel.addEventListener('click', function(){ window.closeModal(); });
  var btnSave=document.getElementById('btnModalSave');
  if(btnSave) btnSave.addEventListener('click', function(){ window.saveEmp(); });
  var modalBg=document.getElementById('modalBg');
  if(modalBg) modalBg.addEventListener('click', function(e){ if(e.target===this) window.closeModal(); });
  // 상태 변경
  var fStatus=document.getElementById('f_status');
  if(fStatus) fStatus.addEventListener('change', function(){ window.onStatusChange(); });
  // Firebase 초기화
  _initFirebase();
});

function sampleData(){return[
  {id:'emp_1',name:'김철수',center:'동부센터',type:'정규직',site:'서울 본사',corp:'(주)동부AS',compDate:'2020-03-15',role:'센터장',gender:'남',birth:'1985-03-12',join:'2015-06-01',exitDate:null,status:'근무중',leftDate:null,skill:'전기',edu:'대졸',memo:'팀장'},
  {id:'emp_2',name:'이영희',center:'서부센터',type:'무기계약직',site:'부산 지점',corp:'(주)서부AS',compDate:'2019-07-01',role:'단지관리자',gender:'여',birth:'1990-07-22',join:'2019-03-15',exitDate:null,status:'근무중',leftDate:null,skill:'용접',edu:'전문대졸',memo:''},
  {id:'emp_3',name:'박민준',center:'중부센터',type:'계약직',site:'인천 현장',corp:'(주)중부AS',compDate:'2022-11-20',role:'일반기능공',gender:'남',birth:'1995-11-05',join:'2024-05-01',exitDate:'2026-05-20',status:'근무중',leftDate:null,skill:'배관',edu:'고졸',memo:''},
  {id:'emp_4',name:'최수진',center:'남부센터',type:'프로젝트직',site:'대전 지점',corp:'(주)남부AS',compDate:'2021-06-30',role:'관리',gender:'여',birth:'1988-02-18',join:'2024-01-10',exitDate:'2026-05-10',status:'근무중',leftDate:null,skill:'도장',edu:'대졸',memo:'A프로젝트'},
  {id:'emp_5',name:'정대호',center:'동부센터',type:'계약직',site:'광주 현장',corp:'(주)동부AS',compDate:'2023-04-10',role:'기동반',gender:'남',birth:'1993-08-30',join:'2025-04-14',exitDate:null,status:'근무중',leftDate:null,skill:'전기',edu:'고졸',memo:'신규'},
  {id:'emp_6',name:'한미래',center:'서부센터',type:'계약직',site:'부산 지점',corp:'(주)서부AS',compDate:null,role:'일반기능공',gender:'여',birth:'1997-04-20',join:'2024-10-01',exitDate:null,status:'퇴사',leftDate:'2025-09-30',skill:'도장',edu:'고졸',memo:'계약만료'},
  {id:'emp_7',name:'오현준',center:'서부센터',type:'정규직',site:'부산 지점',corp:'(주)서부AS',compDate:'2019-07-01',role:'센터장',gender:'남',birth:'1980-05-10',join:'2010-03-01',exitDate:null,status:'근무중',leftDate:null,skill:'전기',edu:'대졸',memo:''},
  {id:'emp_8',name:'강지수',center:'중부센터',type:'정규직',site:'수원 현장',corp:'(주)중부AS',compDate:'2021-09-01',role:'센터장',gender:'여',birth:'1983-11-22',join:'2012-05-01',exitDate:null,status:'근무중',leftDate:null,skill:'설비',edu:'대졸',memo:''},
  {id:'emp_9',name:'윤성민',center:'남부센터',type:'정규직',site:'광주 현장',corp:'(주)남부AS',compDate:'2018-03-05',role:'센터장',gender:'남',birth:'1978-07-15',join:'2008-01-15',exitDate:null,status:'근무중',leftDate:null,skill:'전기',edu:'대졸',memo:''},
];}