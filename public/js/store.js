/* Data layer.
   FS.state is a local copy of the records the logged-in user may see (loaded from /api/bootstrap).
   Pages mutate FS.state and call FS.save(); save() diffs against the last synced snapshot and sends only the
   changes to /api/sync, where the server re-validates every change against the user's role. */
(function(){
const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
FS.day=day;
FS.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
FS.fmt=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
FS.uid=p=>p+Math.random().toString(36).slice(2,8).toUpperCase();

/* ---- API ---- */
FS.api=async(method,url,body)=>{
  const o={method,headers:{},credentials:'same-origin'};
  if(body!==undefined){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
  let r;try{r=await fetch(url,o)}catch(e){throw Object.assign(new Error('Cannot reach the server. Check your connection.'),{status:0})}
  let d={};try{d=await r.json()}catch(e){}
  if(!r.ok)throw Object.assign(new Error(d.error||'Request failed ('+r.status+')'),{status:r.status,data:d});
  return d;
};
FS.err=e=>FS.toast((e&&e.message)||'Something went wrong');
FS.upload=async(file,kind)=>{
  const r=await fetch('/api/upload?kind='+kind+'&name='+encodeURIComponent(file.name),{method:'POST',body:file,credentials:'same-origin',headers:{'Content-Type':'application/octet-stream'}});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Upload failed');return d;
};
FS.fileUrl=(id,dl)=>'/api/files/'+id+(dl?'?dl=1':'');

/* ---- state ---- */
const ARR=['programs','students','applications','submissions','results','certs','jobApps','interviews','attendanceLog','jobs','announcements','employers','messages','documents'];
const empty=()=>{const s={watched:{},certReq:[],users:[],criteria:{progress:80,score:60,attendance:75},site:{fee:0,email:'',phone:'',address:'',applicationsOpen:true},content:{}};ARR.forEach(k=>s[k]=[]);return s};
FS.state=empty();FS.me=null;
let snap={};
const sj=JSON.stringify;
function takeSnap(){
  snap={};ARR.forEach(k=>{snap[k]=new Map(FS.state[k].map(d=>[d.id,sj(d)]))});
  snap.criteria=sj(FS.state.criteria);snap.site=sj(FS.state.site);snap.content=sj(FS.state.content||{});
  snap.watched=FS.me?sj(FS.state.watched[FS.me.email]||{}):'';
  snap.certReq=FS.me?FS.state.certReq.includes(FS.me.email):false;
}
function applySite(){
  const f=FS.state.site.fee||0;FS.FEE=f;FS.feeText='₹'+f.toLocaleString('en-IN');
  if(FS.applyContent)FS.applyContent();
}
FS.boot=async()=>{
  const r=await FS.api('GET','/api/bootstrap');
  FS.me=r.me;FS.state=Object.assign(empty(),r.state);takeSnap();applySite();
};
FS.reload=async(keepScroll)=>{await FS.boot();FS.render(keepScroll)};

function diff(){
  const ch={},next={};
  ARR.forEach(k=>{
    const cur=new Map();let up=[],del=[];
    FS.state[k].forEach(d=>{if(!d.id)d.id=FS.uid(k.slice(0,2).toUpperCase());const s=sj(d);cur.set(d.id,s);if(snap[k].get(d.id)!==s)up.push(d)});
    snap[k].forEach((_,id)=>{if(!cur.has(id))del.push(id)});
    if(up.length||del.length)ch[k]={upsert:up,del};next[k]=cur;
  });
  const out={};if(Object.keys(ch).length)out.changes=ch;
  const crit=sj(FS.state.criteria),site=sj(FS.state.site),cont=sj(FS.state.content||{});
  if(crit!==snap.criteria)out.criteria=FS.state.criteria;
  if(site!==snap.site)out.site=FS.state.site;
  if(cont!==snap.content)out.content=FS.state.content||{};
  if(FS.me&&FS.me.role==='student'){
    const w=sj(FS.state.watched[FS.me.email]||{});if(w!==snap.watched)out.watched=FS.state.watched[FS.me.email]||{};
    const rq=FS.state.certReq.includes(FS.me.email);if(rq&&!snap.certReq)out.certReq={add:true};
  }
  return {out,commit(){Object.assign(snap,next);snap.criteria=crit;snap.site=site;snap.content=cont;if(out.watched)snap.watched=sj(out.watched);if(out.certReq)snap.certReq=true}};
}
let chain=Promise.resolve();
FS.save=()=>{
  chain=chain.then(async()=>{
    if(!FS.me)return;
    const d=diff();if(!Object.keys(d.out).length)return;
    try{await FS.api('POST','/api/sync',d.out);d.commit();if(d.out.site||d.out.content)applySite()}
    catch(e){FS.err(e);if(e.status===401){FS.go('#/login');return}try{await FS.boot();FS.render(true)}catch(_){}}
  });
  return chain;
};
FS.saved=()=>chain;

/* ---- selectors ---- */
FS.programs=()=>FS.state.programs;
FS.program=id=>FS.state.programs.find(p=>p.id===id);
FS.modules=pid=>{
  const p=FS.program(pid);if(!p)return[];
  return (p.modules||[]).map((m,mi)=>({idx:mi,id:m.id,title:m.title,docs:m.docs||[],
    vids:(m.videos||[]).map(v=>({id:v.id,title:v.title,url:v.url,mi,dur:v.dur||10,
      desc:v.desc||`In this lesson you will cover "${v.title}": key concepts, a guided walkthrough and a short practice task.`}))}));
};
FS.videos=pid=>FS.modules(pid).flatMap(m=>m.vids);
FS.assignments=pid=>{const p=FS.program(pid);return p?(p.assignments||[]).map(a=>({...a,pid})):[]};
FS.questions=pid=>{const p=FS.program(pid);if(!p)return[];const mods=p.modules||[];
  return (p.quiz||[]).map(q=>{const m=mods.find(x=>x.id===q.mid)||mods[0]||{title:'General'};return {...q,topic:m.title}})};
FS.papers=pid=>{const p=FS.program(pid);return p?p.papers||[]:[]};
FS.user=()=>FS.me;
FS.studentRec=email=>FS.state.students.find(s=>s.email===email);
FS.pname=id=>(FS.program(id)||{name:id}).name;
FS.mentorOf=pid=>(FS.program(pid)||{}).mentor||'To be assigned';

FS.progressOf=s=>{
  if(!s.dyn)return s.progress;
  const vids=FS.videos(s.program),as=FS.assignments(s.program);const tot=vids.length+as.length;if(!tot)return 0;
  const w=vids.filter(v=>(FS.state.watched[s.email]||{})[v.id]).length;
  const sb=FS.state.submissions.filter(x=>x.email===s.email&&x.pid===s.program).length;
  return Math.min(100,Math.round((w+sb)/tot*100));
};
FS.scoreOf=s=>{
  if(!s.dyn)return s.score;
  const pcts=FS.state.results.filter(r=>r.email===s.email).map(r=>r.score/r.total*100)
    .concat(FS.state.submissions.filter(x=>x.email===s.email&&x.status==='Evaluated').map(x=>x.marks/(((FS.assignments(x.pid).find(a=>a.id===x.aid))||{marks:100}).marks)*100));
  return pcts.length?Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length):0;
};
FS.eligible=s=>{const c=FS.state.criteria,p=FS.progressOf(s),sc=FS.scoreOf(s);
  return {progress:p>=c.progress,score:sc>=c.score,ok:p>=c.progress&&sc>=c.score,p,sc}};
FS.readiness=s=>Math.round(FS.progressOf(s)*.5+FS.scoreOf(s)*.5);
/* sequential course: a module opens only once every earlier module is complete */
FS.modState=(pid,w)=>{let open=true;return FS.modules(pid).map(m=>{const n=m.vids.length,d=m.vids.filter(v=>w[v.id]).length,done=d===n,st={n,d,done,locked:!open};if(!done)open=false;return st})};
FS.lockedVid=(pid,w,vid)=>{const ms=FS.modules(pid),st=FS.modState(pid,w);const i=ms.findIndex(m=>m.vids.some(v=>v.id===vid));return i>=0&&st[i].locked};
FS.certOf=email=>FS.state.certs.find(c=>c.email===email);

/* ---- auth ---- */
FS.login=async(email,pass)=>{
  try{const r=await FS.api('POST','/api/login',{email,password:pass});FS.me=r.me;return{user:r.me}}
  catch(e){return{error:e.message,appId:e.data&&e.data.appId,email:e.data&&e.data.email}}
};
FS.logout=async()=>{try{await FS.api('POST','/api/logout',{})}catch(e){}FS.me=null};
FS.homeFor=r=>r==='admin'?'#/admin/overview':r==='trainer'?'#/trainer/overview':'#/student/dashboard';

/* ---- UI helpers ---- */
FS.toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)};
FS.modal=(html,lg)=>{FS.closeModal();const o=document.createElement('div');o.className='ov';o.id='modal';o.innerHTML=`<div class="md ${lg?'lg':''}"><button type="button" class="mclose" onclick="FS.closeModal()" aria-label="Close">×</button>${html}</div>`;o.addEventListener('mousedown',e=>{if(e.target===o)FS.closeModal()});document.body.appendChild(o);if(FS.fixLinks)FS.fixLinks(o)};
FS.closeModal=()=>{const m=document.getElementById('modal');if(m)m.remove()};
FS.download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
FS.pct=(a,b)=>b?Math.round(a/b*100):0;
FS.bar=p=>`<div class="bar"><i style="width:${p}%"></i></div>`;
FS.logoOrg=(k,lg)=>{const o=FS.ORGS[k]||FS.ORGS.finsang,e=FS.esc,lbl=e(o.short||o.name);
 const mark=o.logo?`<img class="${o.wide?'wide':''}" src="${e(o.logo)}" alt="${lbl} logo" loading="lazy">`:`<i style="background:${e(o.color)}">${e(o.mono||(o.short||o.name||'?')[0])}</i>`;
 return `<span class="plogo ${lg?'lg':''}">${mark}<span>${lbl}</span></span>`};
FS.orgMark=(k,cls)=>{const o=FS.ORGS[k]||FS.ORGS.finsang,e=FS.esc,lbl=e(o.short||o.name);
 return o.logo?`<img class="${cls||''} ${o.wide?'wide':''}" src="${e(o.logo)}" alt="${lbl} logo" loading="lazy">`:`<i class="${cls||''}" style="background:${e(o.color)}">${e(o.mono||(o.short||o.name||'?')[0])}</i>`};
/* logo + short name + full company name + role */
FS.orgCard=k=>{const o=FS.ORGS[k]||FS.ORGS.finsang,e=FS.esc,full=String(o.name||'').replace(/\.+$/,'');
 return `<div class="oc">${FS.orgMark(k,'oc-m')}<div class="oc-t"><b>${e(o.short||o.name)}</b>${full&&full!==(o.short||'')?`<span>${e(full)}</span>`:''}${o.role?`<em>${e(o.role)}</em>`:''}</div></div>`};
FS.certHtml=c=>`<div class="cert"><span class="wm">${c.demo?'SAMPLE / DEMO':'CERTIFICATE'}</span>
<div style="font:700 .9rem system-ui;letter-spacing:.2em;color:#7a5a12">FINSANG INDIA DIGITAL SOLUTION PVT. LTD.</div>
<h1>Certificate of Completion</h1><p>This is to certify that</p><div class="nm">${FS.esc(c.name)}</div>
<p>has successfully completed the <b>${FS.esc(FS.pname(c.pid))}</b> track of the<br>Finsang 360° Career Program<br>with an overall assessment score of <b>${c.score}%</b>.</p>
<p style="margin-top:14px;font:.85rem system-ui">In collaboration with GrainZap IT Solutions Pvt. Ltd. &amp; Growtech E-commerce Service</p>
<div class="ids"><span>Certificate ID: <b>${c.id}</b></span><span>Issued: ${FS.fmt(c.date)}</span><span>Verify at: ${location.origin}/verify.html</span></div></div>`;
FS.printCert=c=>{FS.modal(`<h3>Certificate ${c.id}</h3>${FS.certHtml(c)}<div class="row" style="margin-top:16px"><button class="btn btn-p" onclick="window.print()">Download / Print as PDF</button><button class="btn btn-o" onclick="FS.closeModal()">Close</button></div><p class="hint" style="margin-top:8px">Choose "Save as PDF" in the print dialog.</p>`,true)};
})();
