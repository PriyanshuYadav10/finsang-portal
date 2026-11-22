/* Mentor / Trainer panel — reuses shared helpers from pages-admin.js */
FS.myProgs=()=>(FS.user().programs||[]).filter(id=>FS.program(id));
FS.myStudents=()=>FS.state.students.filter(s=>FS.myProgs().includes(s.program));
FS.route('/trainer/(\\w+)',([pg])=>{
 if(!FS.guard('trainer'))return;
 const pages={overview:tOver,students:tStudents,content:tContent,assignments:tAssign,assessments:tAssess,attendance:tAttend};
 const t={overview:'Trainer Overview',students:'My Students',content:'Study Materials & Video Lessons',assignments:'Assignments & Reviews',assessments:'Assessments',attendance:'Attendance Tracking'};
 if(!pages[pg]){FS.go('#/trainer/overview');return}
 FS.mountPortal('trainer',pg,t[pg],pages[pg]());
});
const tpid=()=>{const m=FS.myProgs();return m.includes(FS.ui.tpid)?FS.ui.tpid:m[0]};
const tPick=()=>`<div class="row" style="margin-bottom:16px"><label style="margin:0">Program</label><select style="max-width:320px" onchange="A.set('tpid',this.value)">${FS.myProgs().map(id=>`<option value="${id}" ${id===tpid()?'selected':''}>${E(FS.pname(id))}</option>`).join('')}</select></div>`;
const mySubs=()=>FS.state.submissions.filter(s=>FS.myProgs().includes(s.pid));

function tOver(){const st=FS.myStudents(),subs=mySubs(),pend=subs.filter(s=>s.status==='Submitted');
 const avg=st.length?Math.round(st.reduce((a,s)=>a+FS.progressOf(s),0)/st.length):0;
 return `<div class="card" style="background:linear-gradient(135deg,var(--navy),var(--navy2));margin-bottom:22px"><h2 style="color:#fff">Hello, ${E(FS.user().name.split(' ')[0])} 👋</h2><p style="color:#d8d4ca;margin-top:6px">Mentoring: ${FS.myProgs().map(id=>E(FS.pname(id))).join(' · ')}</p></div>
 <div class="grid g4" style="margin-bottom:22px">${stat('👥',st.length,'Assigned students')}${stat('📥',pend.length,'Submissions to review')}${stat('📈',avg+'%','Avg learning progress')}${stat('🗓️',FS.state.attendanceLog.length,'Attendance sessions logged')}</div>
 <div class="grid g2"><div class="card"><div class="ch-h"><h3>Needs review</h3><a class="btn btn-o btn-sm" href="#/trainer/assignments">Open</a></div>${pend.map(s=>`<div class="li"><div style="flex:1"><b>${E(s.name)}</b><br><span class="hint">${E(s.title)} · ${FS.fmt(s.date)}</span></div><button class="btn btn-p btn-sm" onclick="FS.evalModal('${s.id}')">Review</button></div>`).join('')||'<div class="empty">All reviewed 🎉</div>'}</div>
 <div class="card"><h3 style="margin-bottom:10px">Students falling behind</h3>${st.filter(s=>FS.progressOf(s)<50||s.attendance<75).map(s=>`<div class="li"><span class="dot" style="background:var(--red)"></span><div style="flex:1"><b>${E(s.name)}</b><br><span class="hint">Progress ${FS.progressOf(s)}% · Attendance ${s.attendance}%</span></div></div>`).join('')||'<div class="empty">Everyone is on track</div>'}</div></div>`}

function tStudents(){return `<div class="card tw"><table class="tbl"><tr><th>Student</th><th>Program</th><th>Progress</th><th>Attendance</th><th>Avg score</th><th>Submissions</th></tr>${FS.myStudents().map(s=>`<tr><td><b>${E(s.name)}</b><br><span class="hint">${E(s.email)}</span></td><td>${E(FS.pname(s.program))}</td><td style="min-width:130px">${FS.progressOf(s)}%${FS.bar(FS.progressOf(s))}</td><td>${s.attendance}%</td><td>${FS.scoreOf(s)}%</td><td>${FS.state.submissions.filter(x=>x.email===s.email).length}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No students assigned</td></tr>'}</table></div>`}

function tContent(){return tPick()+FS.contentPanel(tpid())}

function tAssign(){const pid=tpid(),tab=FS.ui.ttab||'rev';
 const tabs=A.tabs('ttab',[['rev','Review Submissions'],['all','Published Assignments']],tab);
 if(tab==='all')return tPick()+tabs+`<div class="ch-h"><span></span><button class="btn btn-p btn-sm" onclick="A.cform('assign','${pid}')">+ Create assignment</button></div><div class="grid g2">${FS.assignments(pid).map(a=>`<div class="card"><h3>${E(a.title)}</h3><p style="margin:6px 0;font-size:.9rem">${E(a.desc)}</p><div class="meta"><span class="tag m">Due ${FS.fmt(a.due)}</span><span class="tag a">${a.marks} marks</span><span class="tag t">${FS.state.submissions.filter(s=>s.aid===a.id).length} submissions</span></div></div>`).join('')}</div>`;
 return tabs+FS.subTable(mySubs().slice().reverse())}

function tAssess(){const pid=tpid(),st=FS.myStudents().filter(s=>s.program===pid);
 return tPick()+`<div class="row" style="margin-bottom:16px"><button class="btn btn-p btn-sm" onclick="A.cform('quiz','${pid}')">+ Add MCQ</button><button class="btn btn-o btn-sm" onclick="A.cform('paper','${pid}')">+ Create paper</button><button class="btn btn-o btn-sm" onclick="A.conduct('${pid}')">📣 Conduct / schedule assessment</button></div>
 <div class="grid g2" style="margin-bottom:20px"><div class="card"><h3>Question bank</h3><p style="margin:6px 0">${FS.questions(pid).length} MCQs · ${FS.papers(pid).length} papers</p></div><div class="card"><h3>Quiz attempts</h3><p style="margin:6px 0">${FS.state.results.filter(r=>r.pid===pid).length} attempts recorded</p></div></div>
 <h3 style="margin-bottom:10px">Student performance</h3>${FS.perfTable(st)}`}
A.conduct=pid=>FS.modal(`<h3>Schedule assessment</h3><form onsubmit="return A.conductSave(event,'${pid}')"><div class="fg"><label>Title</label><input name="t" required value="Month assessment"></div><div class="frow"><div class="fg"><label>Date</label><input type="date" name="d" value="${FS.day(7)}"></div><div class="fg"><label>Time</label><input name="tm" value="10:00 AM"></div></div><p class="hint" style="margin-bottom:12px">Students are notified via Announcements.</p><div class="row"><button class="btn btn-p">Notify students</button><button type="button" class="btn btn-o" onclick="FS.closeModal()">Cancel</button></div></form>`);
A.conductSave=(e,pid)=>{e.preventDefault();const f=e.target;FS.state.announcements.unshift({id:FS.uid('N'),type:'Examination',title:f.t.value+' scheduled',body:`${FS.fmt(f.d.value)} at ${f.tm.value}. Practice with the mock test beforehand.`,date:FS.day(0),prog:pid});FS.save();FS.closeModal();FS.toast('Students notified');return false};

function tAttend(){const pid=tpid(),st=FS.myStudents().filter(s=>s.program===pid),d=FS.ui.adate||FS.day(0),log=FS.state.attendanceLog.filter(l=>l.pid===pid).slice(-5).reverse();
 return tPick()+`<div class="grid g2" style="align-items:start"><div class="card"><div class="ch-h"><h3>Mark attendance</h3><input type="date" value="${d}" style="max-width:170px" onchange="FS.ui.adate=this.value"></div>
 <form onsubmit="return A.attSave(event,'${pid}')">${st.map(s=>`<label class="opt" style="display:flex;align-items:center;justify-content:space-between"><span><input type="checkbox" name="p" value="${E(s.email)}" checked> ${E(s.name)}</span><span class="hint">${s.attendance}%</span></label>`).join('')||'<div class="empty">No students</div>'}<button class="btn btn-p" style="margin-top:10px" ${st.length?'':'disabled'}>Save attendance</button></form><p class="hint" style="margin-top:8px">Checked = present.</p></div>
 <div class="card"><h3 style="margin-bottom:8px">Recent sessions</h3>${log.map(l=>`<div class="li"><span class="dot"></span><div><b>${FS.fmt(l.date)}</b><br><span class="hint">${l.present.length} present · ${l.absent.length} absent</span></div></div>`).join('')||'<div class="empty">No sessions logged</div>'}</div></div>`}
A.attSave=(e,pid)=>{e.preventDefault();const st=FS.myStudents().filter(s=>s.program===pid),pr=[...e.target.querySelectorAll('input[name=p]:checked')].map(i=>i.value),d=FS.ui.adate||FS.day(0);
 FS.state.attendanceLog.push({pid,date:d,present:pr,absent:st.filter(s=>!pr.includes(s.email)).map(s=>s.email)});
 st.forEach(s=>{s.attendance=Math.max(0,Math.min(100,s.attendance+(pr.includes(s.email)?1:-3)))});FS.save();FS.toast('Attendance saved');FS.render(true);return false};
