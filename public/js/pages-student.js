/* Student learning portal */
FS.aSub=(email,aid)=>FS.state.submissions.find(s=>s.email===email&&s.aid===aid);
FS.aStatus=(email,a)=>{const s=FS.aSub(email,a.id);return s?s.status:(a.due<FS.day(0)?'Overdue':'Pending')};
const stTag=s=>`<span class="tag ${s==='Evaluated'?'g':s==='Submitted'?'t':s==='Overdue'?'r':'a'}">${s}</span>`;
const embedUrl=u=>{if(!u)return'';let m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);if(m)return 'https://www.youtube.com/embed/'+m[1];m=u.match(/vimeo\.com\/(?:video\/)?(\d+)/);return m?'https://player.vimeo.com/video/'+m[1]:''};

FS.route('/student/(\\w+)',([pg],q)=>{
 if(!FS.guard('student'))return;
 const me=FS.studentRec(FS.user().email);
 if(!me){FS.mountPortal('student',pg,'Student Portal',`<div class="empty card">No enrollment found for this account.</div>`);return}
 const pages={dashboard:sDash,programs:sPrograms,materials:sMaterials,videos:sVideos,assessments:sAssess,assignments:sAssign,announcements:sAnn,certificates:sCert,placement:sPlace};
 const titles={dashboard:'Dashboard',programs:'My Programs',materials:'Learning Materials',videos:'Video Learning',assessments:'Sample Papers & Assessments',assignments:'Assignments & Projects',announcements:'Announcements & Notifications',certificates:'Certificates',placement:'Placement & Career Opportunities'};
 if(!pages[pg]){FS.go('#/student/dashboard');return}
 FS.mountPortal('student',pg,titles[pg],pages[pg](me,q));
});

function sDash(me){
 const p=FS.program(me.program),prog=FS.progressOf(me),sc=FS.scoreOf(me),el=FS.eligible(me),cert=FS.certOf(me.email),C=FS.state.criteria;
 const as=FS.assignments(me.program),pend=as.filter(a=>['Pending','Overdue'].includes(FS.aStatus(me.email,a)));
 const vids=FS.videos(me.program),w=FS.state.watched[me.email]||{},done=vids.filter(v=>w[v.id]).length,next=vids.find(v=>!w[v.id]);
 const mods=FS.modules(me.program).map(m=>({t:m.title,n:m.vids.length,d:m.vids.filter(v=>w[v.id]).length,cur:!!(next&&m.vids.some(v=>v.id===next.id))}));
 const curMod=mods.find(m=>m.cur);
 const end=new Date(me.joined);end.setDate(end.getDate()+p.months*30);const left=Math.max(0,Math.ceil((end-new Date())/864e5));
 const sess=FS.state.announcements.filter(a=>['Class Schedule','Examination'].includes(a.type)&&(a.prog==='all'||a.prog===me.program)).slice(0,3);
 const ann=FS.state.announcements.filter(a=>a.prog==='all'||a.prog===me.program).slice(0,4);
 const res=FS.state.results.filter(r=>r.email===me.email).slice(-5).reverse();
 const crit=[['Progress',el.p,C.progress,el.progress],['Score',el.sc,C.score,el.score],['Attendance',me.attendance,C.attendance,el.attendance]];
 const ready=crit.filter(c=>c[3]).length;
 return `<div class="dhero sdh"><div class="mesh2"><i></i><i></i></div>
  <div class="dh-l"><span class="dh-date">${FS.todayStr()}</span><h2>${FS.greet()}, ${E(me.name.split(' ')[0])} 👋</h2><p>${E(p.name)} · ${p.months} months · ${E(p.mode)} · <b>${left}</b> days left</p>
   <div class="sd-prog"><div class="sd-pl"><span>Overall progress</span><b>${prog}%</b></div>${FS.bar(prog)}<small>${done} of ${vids.length} lessons completed</small></div></div>
  <div class="dh-r">${next?`<div class="sd-next"><span class="sd-k">Up next${curMod?' · '+E(curMod.t):''}</span><div class="sd-n"><div class="play">▶</div><div><b>${E(next.title)}</b><small>${next.dur||8} min lesson</small></div></div><a class="btn btn-a btn-block" href="#/student/videos?v=${next.id}">Continue learning <span class="ar">→</span></a></div>`
   :`<div class="sd-next"><span class="sd-k">All caught up</span><div class="sd-n"><div class="play">✓</div><div><b>Every lesson is complete</b><small>Review materials or take the mock test</small></div></div><a class="btn btn-a btn-block" href="#/student/assessments">Open assessments <span class="ar">→</span></a></div>`}</div></div>
  ${me.feeStatus==='Paid'?'':`<div class="alert w">One-time fee of ${FS.feeText} is pending. Please complete the payment as instructed by the admissions team. Contact: ${E(FS.state.site.email)}.</div>`}
  <div class="grid g4 kpis">${FS.kpi('🎬',done+'/'+vids.length,'Lessons completed',vids.length?Math.round(done/vids.length*100)+'% of curriculum':'','#/student/videos')}${FS.kpi('🗓️',me.attendance+'%','Attendance',me.attendance>=C.attendance?'On track':'Below '+C.attendance+'% target')}${FS.kpi('🎯',sc+'%','Avg assessment score',res.length+' quiz'+(res.length===1?'':'zes')+' taken','#/student/assessments')}${FS.kpi('💼',FS.readiness(me)+'%','Placement readiness','Progress, score, attendance','#/student/placement')}</div>
  <div class="sd-grid"><div class="sd-main">
   <div class="card"><div class="ch-h"><h3>Your course journey</h3><a class="btn btn-o btn-sm" href="#/student/videos">All lessons</a></div>
    <div class="jr">${mods.map((m,i)=>{const pc=m.n?Math.round(m.d/m.n*100):0,st=pc===100?'done':m.cur?'cur':'';return `<div class="jr-i ${st}"><div class="jr-n">${pc===100?'✓':i+1}</div><div class="jr-b"><div class="jr-t"><b>${E(m.t)}</b><span>${m.d}/${m.n} lessons${m.cur?' · in progress':''}</span></div>${FS.bar(pc)}</div></div>`}).join('')||'<div class="empty">No modules yet</div>'}</div></div>
   <div class="card"><div class="ch-h"><h3>Assignments to do</h3><a href="#/student/assignments" class="btn btn-o btn-sm">View all</a></div>${pend.map(a=>{const od=a.due<FS.day(0);return `<a class="as-i" href="#/student/assignments"><div class="as-d ${od?'od':''}"><b>${E(new Date(a.due+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric'}))}</b><span>${E(new Date(a.due+'T00:00:00').toLocaleDateString('en-IN',{month:'short'}))}</span></div><div style="flex:1;min-width:0"><b>${E(a.title)}</b><small>${a.marks} marks · ${od?'Overdue':'Due '+FS.fmt(a.due)}</small></div>${stTag(FS.aStatus(me.email,a))}</a>`}).join('')||'<div class="empty">🎉 Nothing pending. Great work!</div>'}</div>
   <div class="card"><div class="ch-h"><h3>Recent assessment scores</h3><a href="#/student/assessments" class="btn btn-o btn-sm">Practice</a></div>${res.length?`<div class="hbars">${res.map(r=>{const v=Math.round(r.score/r.total*100);return `<div class="hb"><div class="hb-t"><span>${E(r.title.replace(/^(Topic Quiz: |Practice: )/,''))}</span><b>${r.score}/${r.total} · ${v}%</b></div><div class="hb-b"><i style="width:${v}%"></i></div></div>`}).join('')}</div>`:'<div class="empty">Take a quiz to see your scores here</div>'}</div></div>
  <aside class="sd-side">
   <div class="card"><div class="ch-h"><h3>Certificate progress</h3></div>${cert?`<div class="alert s" style="margin:0">🏅 Certificate issued: <b>${E(cert.id)}</b></div>`:`<p class="hint" style="margin:-4px 0 14px">${el.ok?'You are eligible. Request your certificate.':ready+' of 3 requirements met'}</p>`}
    <div class="cr">${crit.map(c=>`<div class="cr-i"><div class="donut" style="--p:${Math.min(100,Math.round(c[1]/c[2]*100))};width:78px;height:78px"><div><b style="font-size:1rem">${c[1]}%</b></div></div><b>${c[0]}</b><small>need ${c[2]}% ${c[3]?'✓':''}</small></div>`).join('')}</div>
    <a href="#/student/certificates" class="btn btn-o btn-sm btn-block" style="margin-top:14px">Certificate details</a></div>
   <div class="card"><div class="ch-h"><h3>Upcoming sessions</h3></div>${sess.map(a=>`<div class="li"><span class="dot"></span><div style="flex:1"><b>${E(a.title)}</b><br><span class="hint">${E(a.body)}</span></div></div>`).join('')||'<div class="empty">No sessions scheduled</div>'}</div>
   <div class="card"><div class="ch-h"><h3>Announcements</h3><a href="#/student/announcements" class="btn btn-o btn-sm">All</a></div>${FS.feed(ann.map(a=>['🔔',E(a.title),E(a.type),FS.ago(a.date)]))}</div></aside></div>`;
}

function sPrograms(me){
 const p=FS.program(me.program),mods=FS.modules(me.program),w=FS.state.watched[me.email]||{};
 const end=new Date(me.joined);end.setDate(end.getDate()+p.months*30);
 return `<div class="card"><div class="row sp-b" style="align-items:flex-start"><div class="row" style="align-items:flex-start;gap:16px"><div class="pi" style="width:64px;height:64px;font-size:2rem;background:${p.color};border-radius:16px;display:grid;place-items:center">${p.icon}</div><div><h2>${E(p.name)}</h2><p style="margin:4px 0 10px">${E(p.short)}</p><div class="meta"><span class="tag">⏱ ${p.months} months</span><span class="tag g">${p.mode}</span><span class="tag m">${FS.ORGS[p.partner].short} partner</span></div></div></div><div class="ring" style="--p:${FS.progressOf(me)}"><span>${FS.progressOf(me)}%</span></div></div>
 <div class="grid g4" style="margin-top:18px">${[['Start date',FS.fmt(me.joined)],['End date',FS.fmt(end.toISOString().slice(0,10))],['Mode',p.mode]].map(x=>`<div><span class="hint">${x[0]}</span><br><b>${E(x[1])}</b></div>`).join('')}</div></div>
 <h3 style="margin:26px 0 12px">All Five Tracks <span class="tag g">Unlocked with your one-time fee</span></h3><div class="grid g3">${FS.programs().map(x=>`<div class="card ${x.id===me.program?'':'flat'}" style="${x.id===me.program?'border-color:var(--gold)':''}"><b>${x.icon} ${E(x.name)}</b><p style="font-size:.85rem;margin:4px 0 10px">${x.months} months · ${x.mode}</p>${x.id===me.program?'<span class="tag t">Viewing now</span>':`<button class="btn btn-o btn-sm" onclick="A.switchProg('${x.id}')">Open track</button>`}</div>`).join('')}</div> <h3 style="margin:26px 0 12px">Learning Modules</h3>${mods.map((m,i)=>{const d=m.vids.filter(v=>w[v.id]).length;const pc=FS.pct(d,m.vids.length);return `<div class="mod"><div class="mh"><span>Module ${i+1}: ${E(m.title)}</span><span class="tag ${pc===100?'g':'a'}">${pc}% complete</span></div><div class="mb"><div style="margin:8px 0">${FS.bar(pc)}</div><p style="font-size:.85rem">${m.vids.length} video lessons · ${m.docs.length} documents</p><ul class="chk" style="font-size:.88rem;margin:8px 0">${m.vids.map(v=>`<li style="${w[v.id]?'':'opacity:.55'}">${E(v.title)}</li>`).join('')}</ul><div class="row" style="padding-bottom:12px"><a class="btn btn-p btn-sm" href="#/student/videos?v=${(m.vids[0]||{}).id||''}">Watch</a><a class="btn btn-o btn-sm" href="#/student/materials">Materials</a></div></div></div>`}).join('')}
 <h3 style="margin:26px 0 12px">Full Curriculum Topics</h3><div class="card"><ul class="chk" style="columns:2">${p.topics.map(t=>`<li>${E(t)}</li>`).join('')}</ul></div>`;
}

/* ---- Materials ---- */
A.openDoc=(i,j,dl)=>{const me=FS.studentRec(FS.user().email),d=FS.modules(me.program)[i].docs[j];
 if(d.fileId)window.open(FS.fileUrl(d.fileId,dl),'_blank','noopener');else if(d.url)window.open(d.url,'_blank','noopener');else FS.toast('This file has not been uploaded yet.')};
function sMaterials(me,q){
 const mods=FS.modules(me.program),p=FS.program(me.program),f=(FS.ui.mq||'').toLowerCase();
 return `<div class="row sp-b" style="margin-bottom:18px"><input style="max-width:340px" placeholder="🔍 Search topic or file…" value="${E(FS.ui.mq||'')}" oninput="FS.ui.mq=this.value;FS.render(true);var i=document.querySelector('.pbody input');i.focus();i.setSelectionRange(99,99)"><span class="tag t">${E(p.name)}</span></div>
 ${mods.map((m,i)=>{const docs=m.docs.map((d,j)=>[d,j]).filter(x=>!f||(x[0].title+m.title).toLowerCase().includes(f));if(!docs.length&&f)return'';
 return `<div class="mod"><div class="mh">Module ${i+1}: ${E(m.title)}<span class="tag m">${m.docs.length} files</span></div><div class="mb">${docs.map(([d,j])=>`<div class="file"><div class="fi ${d.type}">${d.type}</div><div style="flex:1"><b>${E(d.title)}</b><br><span class="hint">${d.type==='PDF'?'PDF notes':d.type==='PPT'?'Presentation':d.type==='ZIP'?'Study pack':'Document'} · Topic: ${E(m.title)}</span></div>${d.fileId||d.url?`<button class="btn btn-o btn-sm" onclick="A.openDoc(${i},${j})">View</button><button class="btn btn-p btn-sm" onclick="A.openDoc(${i},${j},1)">Download</button>`:'<span class="hint">Not uploaded yet</span>'}</div>`).join('')||'<div class="empty">No files</div>'}</div></div>`}).join('')}
 <div class="card" style="margin-top:20px"><h3 style="margin-bottom:10px">External Learning Resources</h3>${(p.links||[]).map(l=>`<div class="file"><div class="fi LINK">URL</div><div style="flex:1"><b>${E(l[0])}</b><br><span class="hint">${E(l[1])}</span></div><a class="btn btn-o btn-sm" href="${E(l[1])}" target="_blank" rel="noopener">Open ↗</a></div>`).join('')}</div>`;
}

/* ---- Videos ---- */
function sVideos(me,q){
 const vids=FS.videos(me.program),mods=FS.modules(me.program),w=FS.state.watched[me.email]||{};
 const tab='lessons';
 let cur=vids.find(v=>v.id===(q.get('v')||FS.ui.vid))||vids.find(v=>!w[v.id])||vids[0];
 if(!cur)return '<div class="empty card">No video lessons yet.</div>';
 FS.ui.vid=cur.id;const i=vids.indexOf(cur),prev=vids[i-1],nxt=vids[i+1],emb=embedUrl(cur.url);
 const docs=mods[cur.mi].docs;
 return `<div class="vl"><div>
 ${emb?`<div class="vp"><iframe src="${emb}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen title="${E(cur.title)}"></iframe></div>`:/\.(mp4|webm)(\?|$)/i.test(cur.url||'')?`<video controls style="width:100%;border-radius:14px;background:#000" src="${E(cur.url)}"></video>`:`<div class="vp"><div class="ttl">${E(cur.title)} · ${cur.dur} min<br><span style="font-size:.8rem;opacity:.8">${cur.url?'':'Video will be available soon'}</span></div></div>`}
 <div class="row sp-b" style="margin:14px 0"><div><span class="tag t">${E(mods[cur.mi].title)}</span><h2 style="margin-top:8px;font-size:1.4rem">${E(cur.title)}</h2></div>
 <button class="btn ${w[cur.id]?'btn-g':'btn-o'}" id="mk" onclick="A.mark('${cur.id}')">${w[cur.id]?'✓ Completed':'Mark as complete'}</button></div>
 ${cur.url&&!emb?`<p><a href="${E(cur.url)}" target="_blank" rel="noopener">Open video link ↗</a></p>`:''}
 <p style="color:var(--ink)">${E(cur.desc)}</p>
 <div class="row" style="margin:18px 0"><button class="btn btn-o" ${prev?`onclick="A.vid('${prev.id}')"`:'disabled'}>← Previous</button><button class="btn btn-p" ${nxt?`onclick="A.vid('${nxt.id}')"`:'disabled'}>Next lesson →</button></div>
 <div class="card"><h3 style="margin-bottom:8px">Related documents</h3>${docs.map((d,j)=>`<div class="file"><div class="fi ${d.type}">${d.type}</div><div style="flex:1"><b>${E(d.title)}</b></div>${d.fileId||d.url?`<button class="btn btn-o btn-sm" onclick="A.openDoc(${cur.mi},${j})">Open</button>`:''}</div>`).join('')||'<p class="hint">No related documents.</p>'}</div></div>
 <div class="card" style="padding:14px;max-height:80vh;overflow:auto"><div class="ch-h"><h3>Lessons</h3><span class="tag g">${vids.filter(v=>w[v.id]).length}/${vids.length}</span></div>${mods.map(m=>`<div class="lbl" style="font-size:.72rem;font-weight:700;color:var(--mut);text-transform:uppercase;margin:10px 4px 4px">${E(m.title)}</div>${m.vids.map(v=>`<div class="vi ${v.id===cur.id?'on':''}" onclick="A.vid('${v.id}')"><span class="chkc ${w[v.id]?'d':''}">${w[v.id]?'✓':''}</span><span style="flex:1">${E(v.title)}</span><span class="hint">${v.dur}m</span></div>`).join('')}`).join('')}</div></div>`;
}
let timer;
A.vid=id=>{clearInterval(timer);FS.ui.vid=id;FS.render(true)};
A.mark=(id,done)=>{clearInterval(timer);const w=FS.state.watched[FS.user().email]=FS.state.watched[FS.user().email]||{};
 if(done)w[id]=true;else w[id]=!w[id];FS.save();FS.toast(w[id]?'Lesson marked complete ✓':'Marked incomplete');FS.render(true)};

/* ---- Assessments ---- */
function sAssess(me){
 const tab=FS.ui.atab||'practice',pid=me.program,qs=FS.questions(pid),mods=FS.modules(pid);
 if(FS.ui.quiz)return quizView();
 const tabs=A.tabs('atab',[['practice','Practice & Quizzes'],['papers','Sample Papers'],['mock','Mock Tests'],['results','Results & History']],tab);
 if(tab==='practice'){const topics=[...new Set(qs.map(q=>q.topic))];const tp=FS.ui.topic||'';
  return tabs+`<div class="card" style="margin-bottom:18px"><h3>Full Practice Quiz</h3><p style="margin:6px 0 14px">${qs.length} MCQs across all topics. Instant feedback after submission.</p><button class="btn btn-p" onclick="A.quiz('Practice Quiz — ${E(FS.pname(pid))}','Practice','')">Start practice quiz</button></div>
  <h3 style="margin-bottom:12px">Topic-wise Questions</h3><div class="grid g3">${topics.map(t=>`<div class="card"><b>${E(t)}</b><p style="font-size:.88rem;margin:6px 0 12px">${qs.filter(q=>q.topic===t).length} questions</p><button class="btn btn-o btn-sm" onclick="A.quiz('Topic Quiz: ${E(t).replace(/'/g,'')}','Practice','${E(t).replace(/'/g,'')}')">Start topic quiz</button></div>`).join('')}</div>`}
 if(tab==='papers'){return tabs+`<div class="card tw"><table class="tbl"><tr><th>Paper</th><th>Type</th><th>Questions</th><th>Duration</th><th></th></tr>${FS.papers(pid).filter(p=>p.type!=='Mock Test').map(p=>`<tr><td><b>${E(p.title)}</b></td><td><span class="tag ${p.type==='Sample Paper'?'t':'a'}">${p.type}</span></td><td>${p.q}</td><td>${p.mins} min</td><td>${p.fileId?`<a class="btn btn-p btn-sm" href="${FS.fileUrl(p.fileId,1)}">Download</a>`:'<span class="hint">Not uploaded</span>'}</td></tr>`).join('')}</table></div>`}
 if(tab==='mock'){return tabs+`<div class="grid g2">${FS.papers(pid).filter(p=>p.type==='Mock Test').concat([{title:'Quick Mock Test',q:qs.length,mins:10}]).map(p=>`<div class="card"><h3>${E(p.title)}</h3><p style="margin:8px 0 14px">Timed mock exam · ${p.mins} minutes, drawn from the question bank (${qs.length} questions).</p><div class="row"><button class="btn btn-p" onclick="A.quiz('${E(p.title).replace(/'/g,'')}','Mock','',${p.mins})">Start mock test</button>${p.fileId?`<a class="btn btn-o" href="${FS.fileUrl(p.fileId,1)}">PDF</a>`:''}</div></div>`).join('')}</div>`}
 const rs=FS.state.results.filter(r=>r.email===me.email).slice().reverse();
 return tabs+`<div class="grid g3" style="margin-bottom:18px"><div class="card stat"><div class="ic">📝</div><div><b>${rs.length}</b><span>Tests taken</span></div></div><div class="card stat"><div class="ic">🎯</div><div><b>${rs.length?Math.round(rs.reduce((a,r)=>a+r.score/r.total*100,0)/rs.length):0}%</b><span>Average</span></div></div><div class="card stat"><div class="ic">🏆</div><div><b>${rs.length?Math.max(...rs.map(r=>Math.round(r.score/r.total*100))):0}%</b><span>Best score</span></div></div></div>
 <div class="card tw"><h3 style="margin-bottom:10px">Performance History</h3>${rs.length?`<table class="tbl"><tr><th>Date</th><th>Assessment</th><th>Mode</th><th>Score</th><th>Result</th></tr>${rs.map(r=>{const v=Math.round(r.score/r.total*100);return `<tr><td>${FS.fmt(r.date)}</td><td><b>${E(r.title)}</b></td><td>${r.mode}</td><td>${r.score}/${r.total} (${v}%)</td><td><span class="tag ${v>=60?'g':'r'}">${v>=60?'Pass':'Needs work'}</span></td></tr>`}).join('')}</table>`:'<div class="empty">No results yet. Take a quiz!</div>'}</div>`;
}
A.quiz=(title,mode,topic,mins)=>{let qs=FS.questions(FS.studentRec(FS.user().email).program);if(topic)qs=qs.filter(q=>q.topic===topic);
 if(!qs.length){FS.toast('No questions available');return}
 FS.ui.quiz={title,mode,qs,ans:{},done:false,end:mins?Date.now()+mins*60000:0};FS.render(true);window.scrollTo(0,0)};
function quizView(){const z=FS.ui.quiz;
 const body=z.qs.map((q,i)=>`<div class="card" style="margin-bottom:14px"><b>Q${i+1}. ${E(q.q)}</b><div style="margin-top:10px">${q.opts.map((o,j)=>{const sel=z.ans[i]===j;const cls=z.done?(j===q.a?'ok':sel?'no':''):'';return `<label class="opt ${cls}"><input type="radio" name="q${i}" ${sel?'checked':''} ${z.done?'disabled':''} onchange="FS.ui.quiz.ans[${i}]=${j}">${E(o)}</label>`}).join('')}</div></div>`).join('');
 if(z.done){const sc=z.qs.filter((q,i)=>z.ans[i]===q.a).length,v=Math.round(sc/z.qs.length*100);
  return `<div class="card" style="text-align:center;margin-bottom:18px"><div class="ring" style="--p:${v};margin:0 auto 12px;width:120px;height:120px"><span style="width:94px;height:94px;font-size:1.5rem">${v}%</span></div><h2>${sc} / ${z.qs.length} correct</h2><p>${v>=60?'Great work! You passed.':'Keep practising — review the answers below.'}</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn btn-p" onclick="FS.ui.quiz=null;FS.render(true)">Back to assessments</button></div></div>${body}`}
 return `<div class="row sp-b" style="margin-bottom:16px"><h2>${E(z.title)}</h2>${z.end?`<span class="tag a" id="qt">⏱ --:--</span>`:`<span class="tag t">Practice</span>`}</div>${body}<div class="row"><button class="btn btn-p" onclick="A.submitQuiz()">Submit</button><button class="btn btn-o" onclick="if(confirm('Leave this test?')){FS.ui.quiz=null;FS.render(true)}">Cancel</button></div>`}
A.submitQuiz=()=>{const z=FS.ui.quiz;if(Object.keys(z.ans).length<z.qs.length&&!confirm('Some questions are unanswered. Submit anyway?'))return;
 const sc=z.qs.filter((q,i)=>z.ans[i]===q.a).length;z.done=true;
 FS.state.results.push({id:FS.uid('R'),email:FS.user().email,pid:FS.studentRec(FS.user().email).program,title:z.title,score:sc,total:z.qs.length,date:FS.day(0),mode:z.mode});FS.save();FS.render(true);window.scrollTo(0,0)};
setInterval(()=>{const z=FS.ui.quiz,t=document.getElementById('qt');if(z&&z.end&&t&&!z.done){const s=Math.max(0,Math.round((z.end-Date.now())/1000));t.textContent='⏱ '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(!s)A.submitQuiz()}},1000);

/* ---- Assignments ---- */
function sAssign(me){
 const as=FS.assignments(me.program),f=FS.ui.af||'All';
 const rows=as.map(a=>({a,st:FS.aStatus(me.email,a),s:FS.aSub(me.email,a.id)})).filter(r=>f==='All'||r.st===f);
 return `<div class="pill-row" style="margin-bottom:18px">${['All','Pending','Submitted','Evaluated','Overdue'].map(x=>`<button class="${f===x?'on':''}" onclick="A.set('af','${x}')">${x}</button>`).join('')}</div>
 <div class="grid g2">${rows.map(({a,st,s})=>`<div class="card"><div class="row sp-b"><h3>${E(a.title)}</h3>${stTag(st)}</div><p style="margin:8px 0;font-size:.9rem">${E(a.desc)}</p><div class="meta"><span class="tag m">📅 Due ${FS.fmt(a.due)}</span><span class="tag a">${a.marks} marks</span>${s&&s.status==='Evaluated'?`<span class="tag g">Scored ${s.marks}/${a.marks}</span>`:''}</div>
 ${s&&s.feedback?`<div class="alert" style="margin:8px 0"><b>Mentor feedback:</b> ${E(s.feedback)}</div>`:''}<button class="btn btn-p btn-sm" onclick="A.assign('${a.id}')">${st==='Evaluated'?'View evaluation':s?'View / Resubmit':'Open & Submit'}</button></div>`).join('')||'<div class="empty card" style="grid-column:1/-1">No assignments in this view.</div>'}</div>`;
}
A.assign=id=>{const me=FS.studentRec(FS.user().email),a=FS.assignments(me.program).find(x=>x.id===id),s=FS.aSub(me.email,id),ev=s&&s.status==='Evaluated';
 FS.modal(`<h3>${E(a.title)}</h3><div class="meta"><span class="tag m">Due ${FS.fmt(a.due)}</span><span class="tag a">${a.marks} marks</span>${stTag(FS.aStatus(me.email,a))}</div>
 <h4 style="margin:10px 0 4px">Instructions</h4><p style="color:var(--ink)">${E(a.desc)} Submit a repository / document link or upload your file. Original work only.</p>
 ${a.fileId?`<a class="btn btn-o btn-sm" style="margin:10px 0" href="${FS.fileUrl(a.fileId,1)}">⬇ Download reference file</a>`:''}
 ${s?`<div class="card flat" style="margin:10px 0"><b>Your submission</b><br><span class="hint">${FS.fmt(s.date)}</span><br>${s.link?`Link: ${E(s.link)}<br>`:''}${s.file?`File: ${s.fileId?`<a href="${FS.fileUrl(s.fileId,1)}">${E(s.file)}</a>`:E(s.file)}<br>`:''}${E(s.note)}${ev?`<hr style="margin:10px 0;border:0;border-top:1px solid var(--line)"><b>Marks: ${s.marks}/${a.marks}</b><br>Feedback: ${E(s.feedback)}`:''}</div>`:''}
 ${ev?'':`<form onsubmit="return A.submitAssign(event,'${id}')"><div class="fg"><label>Project / document link</label><input name="link" type="url" placeholder="https://github.com/…" value="${s?E(s.link):''}"></div><div class="fg"><label>Upload file</label><input name="file" type="file"><span class="hint">PDF, Word, ZIP, images or Office files up to 25 MB.</span></div><div class="fg"><label>Notes for mentor</label><textarea name="note"></textarea></div><div class="row"><button class="btn btn-p">${s?'Resubmit':'Submit assignment'}</button><button type="button" class="btn btn-o" onclick="FS.closeModal()">Close</button></div></form>`}`)};
A.submitAssign=async(e,id)=>{e.preventDefault();const f=e.target,me=FS.studentRec(FS.user().email),file=f.file.files[0],btn=f.querySelector('.btn-p');
 if(!f.link.value&&!file){FS.toast('Add a link or upload a file');return false}
 if(file&&file.size>25*1024*1024){FS.toast('File must be under 25 MB');return false}
 btn.disabled=true;
 try{
  const a=FS.assignments(me.program).find(x=>x.id===id);let old=FS.aSub(me.email,id);
  const up=file?await FS.upload(file,'submission'):null;
  const rec={id:old?old.id:FS.uid('SUB'),email:me.email,name:me.name,pid:me.program,aid:id,title:a.title,link:f.link.value,file:up?up.name:(old?old.file:''),fileId:up?up.id:(old?old.fileId||'':''),note:f.note.value||'—',date:FS.day(0),status:'Submitted',marks:null,feedback:''};
  if(old)Object.assign(old,rec);else FS.state.submissions.push(rec);
  await FS.save();FS.closeModal();FS.toast('Assignment submitted ✓');FS.render(true);
 }catch(x){FS.err(x);btn.disabled=false}
 return false};

/* ---- Announcements ---- */
function sAnn(me){const f=FS.ui.nf||'All',types=['All','Program Update','Class Schedule','Deadline','Examination','Placement'];
 const list=FS.state.announcements.filter(a=>(a.prog==='all'||a.prog===me.program)&&(f==='All'||a.type===f));
 return `<div class="pill-row" style="margin-bottom:18px">${types.map(x=>`<button class="${f===x?'on':''}" onclick="A.set('nf','${x}')">${x}</button>`).join('')}</div><div class="card">${list.map(a=>`<div class="li"><span class="dot"></span><div style="flex:1"><span class="tag ${a.type==='Deadline'?'r':a.type==='Placement'?'g':a.type==='Examination'?'a':'t'}">${a.type}</span> <b>${E(a.title)}</b><p style="font-size:.9rem;margin-top:4px">${E(a.body)}</p><span class="hint">${FS.fmt(a.date)}</span></div></div>`).join('')||'<div class="empty">No announcements.</div>'}</div>`}

/* ---- Certificates ---- */
function sCert(me){const el=FS.eligible(me),c=FS.certOf(me.email),cr=FS.state.criteria;
 const req=(FS.state.certReq||[]).includes(me.email);
 const row=(l,v,t,ok)=>`<div class="li"><span style="font-size:1.2rem">${ok?'✅':'⏳'}</span><div style="flex:1"><b>${l}</b><br><span class="hint">Required ${t}% · Yours ${v}%</span></div></div>`;
 return `<div class="grid g2" style="align-items:start"><div class="card"><h3 style="margin-bottom:10px">Eligibility for ${E(FS.pname(me.program))} certificate</h3>${row('Program completion',el.p,cr.progress,el.progress)}${row('Assessment score',el.sc,cr.score,el.score)}${row('Attendance',me.attendance,cr.attendance,el.attendance)}
 ${c?'<div class="alert s">Your certificate has been issued.</div>':el.ok?`<div class="alert s">You meet all criteria.</div><button class="btn btn-p" ${req?'disabled':''} onclick="A.certReq()">${req?'Request sent':'Request certificate'}</button>`:`<div class="alert">Complete the remaining criteria to become eligible.</div>`}
 <hr style="margin:16px 0;border:0;border-top:1px solid var(--line)"><h4>Verify a certificate</h4><form class="row" style="margin-top:8px" onsubmit="FS.go('#/verify?id='+encodeURIComponent(this.id.value));return false"><input name="id" placeholder="Certificate ID" style="flex:1" required><button class="btn btn-o">Verify</button></form></div>
 <div>${c?`${FS.certHtml(c)}<div class="row" style="margin-top:14px"><button class="btn btn-p" onclick='FS.printCert(${JSON.stringify(c).replace(/'/g,"&#39;")})'>Download PDF</button><span class="tag m">ID: ${c.id}</span></div>`:`<div class="card empty"><div style="font-size:2.4rem">🏅</div><h3>Certificate not issued yet</h3><p style="margin:8px 0 14px">See what it will look like:</p><button class="btn btn-o" onclick='FS.printCert({id:"FSC-SAMPLE-0000",name:${JSON.stringify(me.name).replace(/'/g,"&#39;")},pid:"${me.program}",date:"${FS.day(0)}",score:85,demo:true})'>Preview sample certificate</button></div>`}</div></div>`}
A.certReq=()=>{FS.state.certReq=(FS.state.certReq||[]).concat(FS.user().email);FS.save();FS.toast('Certificate request sent to admin');FS.render(true)};

/* ---- Placement ---- */
function sPlace(me){const tab=FS.ui.ptab||'open',cr=FS.state.criteria,el=FS.eligible(me);
 const apps=FS.state.jobApps.filter(a=>a.email===me.email),ints=FS.state.interviews.filter(i=>i.email===me.email);
 const banner=`<div class="alert w"><b>Placement assistance is not a job guarantee.</b> Finsang and partners support your preparation and share openings; hiring decisions are made by employers.</div>`;
 const tabs=A.tabs('ptab',[['open','Openings'],['apps','My Applications ('+apps.length+')'],['int','Interviews ('+ints.length+')'],['resume','Resume']],tab);
 if(tab==='apps')return banner+tabs+`<div class="card tw">${apps.length?`<table class="tbl"><tr><th>Role</th><th>Company</th><th>Applied</th><th>Status</th></tr>${apps.map(a=>{const j=FS.state.jobs.find(x=>x.id===a.jobId)||{};return `<tr><td><b>${E(j.title)}</b></td><td>${E(j.company)}</td><td>${FS.fmt(a.date)}</td><td><span class="tag ${a.status==='Selected'?'g':a.status==='Rejected'?'r':'a'}">${a.status}</span></td></tr>`}).join('')}</table>`:'<div class="empty">No applications yet.</div>'}</div>`;
 if(tab==='int')return banner+tabs+`<div class="card">${ints.map(i=>{const j=FS.state.jobs.find(x=>x.id===i.jobId)||{};return `<div class="li"><span class="dot"></span><div><b>${E(j.title)}</b> — ${E(j.company)}<br><span class="hint">${FS.fmt(i.date)} · ${i.time} · ${E(i.mode)}</span></div></div>`}).join('')||'<div class="empty">No interviews scheduled.</div>'}</div>`;
 if(tab==='resume')return banner+tabs+`<div class="card" style="max-width:520px"><h3>Resume submission</h3><p style="margin:8px 0 14px">Current resume: <b>${me.resumeId?`<a href="${FS.fileUrl(me.resumeId,1)}">${E(me.resume)}</a>`:E(me.resume||'Not uploaded')}</b></p><form onsubmit="return A.resume(event)"><div class="fg"><input type="file" name="r" accept=".pdf,.doc,.docx" required></div><button class="btn btn-p">Upload resume</button></form><p class="hint" style="margin-top:10px">Tip: Month 4 / final-phase resume workshops are available in your learning modules.</p></div>`;
 const list=FS.state.jobs.filter(j=>j.prog==='any'||j.prog===me.program);
 return banner+`<div class="card" style="margin-bottom:18px"><div class="row sp-b"><div><b>Your placement readiness</b><br><span class="hint">Based on progress, assessments and attendance</span></div><div style="min-width:200px"><b>${FS.readiness(me)}%</b>${FS.bar(FS.readiness(me))}</div></div></div>`+tabs+`<div class="grid g2">${list.map(j=>{
  const applied=apps.find(a=>a.jobId===j.id),needP=j.type==='Job'?cr.progress:40,ok=el.sc>=j.min&&el.p>=needP;
  return `<div class="card"><div class="row sp-b"><h3>${E(j.title)}</h3><span class="tag ${j.type==='Job'?'g':'a'}">${j.type}</span></div><p style="margin:4px 0 8px;font-size:.88rem">${FS.logoOrg(j.org)} · ${E(j.loc)}</p><p style="font-size:.9rem;color:var(--ink)">${E(j.desc)}</p><ul class="chk" style="font-size:.85rem;margin:8px 0">${j.elig.map(e=>`<li>${E(e)}</li>`).join('')}</ul>
  ${applied?`<span class="tag t">Applied · ${applied.status}</span>`:ok?`<button class="btn btn-p btn-sm" onclick="A.jobApply('${j.id}')">Apply</button>`:`<button class="btn btn-o btn-sm" disabled>Not yet eligible</button><p class="hint" style="margin-top:6px">Needs ${needP}% progress and ${j.min}% avg score.</p>`}</div>`}).join('')||'<div class="empty card">No openings for your program yet.</div>'}</div>`}
A.jobApply=id=>{const me=FS.studentRec(FS.user().email);FS.state.jobApps.push({id:FS.uid('JA'),email:me.email,name:me.name,jobId:id,date:FS.day(0),status:'Applied'});FS.save();FS.toast('Application submitted ✓');FS.render(true)};
A.resume=async e=>{e.preventDefault();const me=FS.studentRec(FS.user().email),file=e.target.r.files[0];
 if(file.size>5*1024*1024){FS.toast('Resume must be under 5 MB');return false}
 try{const up=await FS.upload(file,'resume');me.resume=up.name;me.resumeId=up.id;await FS.save();FS.toast('Resume uploaded');FS.render(true)}catch(x){FS.err(x)}return false};
