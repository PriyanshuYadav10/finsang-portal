/* Router, layouts and shared actions */
window.A=window.A||{};
FS.ui={};FS.routes=[];
FS.route=(re,fn)=>FS.routes.push({re:new RegExp('^'+re+'$'),fn});
const $app=()=>document.getElementById('app');
const PUB=[['#/','Home'],['#/programs','Programs'],['#/about','About'],['#/partners','Partners'],['#/contact','Contact'],['#/faq','FAQ']];
FS.NAV={
 student:[['dashboard','🏠','Dashboard'],['programs','🎓','My Programs'],['materials','📚','Learning Materials'],['videos','▶️','Video Learning'],['assessments','📝','Papers & Assessments'],['assignments','📤','Assignments'],['announcements','🔔','Announcements'],['certificates','🏅','Certificates'],['placement','💼','Placement']],
 admin:[['overview','📊','Overview'],['students','👥','Students & Applications'],['programs','🎓','Programs'],['content','🗂️','Learning Content'],['assessments','📝','Assessments'],['certificates','🏅','Certificates'],['placement','💼','Placement'],['announcements','📣','Announcements'],['staff','🏫','Trainers & Staff'],['inbox','✉️','Messages'],['website','🌐','Website Content'],['reports','📈','Reports & Analytics'],['settings','⚙️','Settings']],
 trainer:[['overview','🏠','Overview'],['students','👥','My Students'],['content','🗂️','Study Materials & Videos'],['assignments','📤','Assignments & Reviews'],['assessments','📝','Assessments'],['attendance','🗓️','Attendance']]
};
FS.logo=()=>`<a href="#/" class="logo"><img src="img/logo.png" alt="Finsang"></a>`;

FS.mountPublic=(html,active)=>{
  const u=FS.user();
  $app().innerHTML=`<div id="sprog"></div><header class="nav"><div class="wrap">${FS.logo()}<button class="burger" onclick="A.menu()" aria-label="Menu">☰</button>
  <nav class="nav-links" id="navl">${PUB.map(l=>l[0]==='#/programs'?`<div class="dd"><a href="#/programs" class="${active==='#/programs'?'on':''}">Programs <small>▾</small></a><div class="ddm">${FS.programs().map(p=>`<a href="#/programs/${p.id}"><i style="background:${p.color}">${p.icon}</i><span><b>${E(p.name)}</b><small>${p.months} months · ${E(p.mode)}</small></span></a>`).join('')}<a href="#/programs" class="all">View all programs →</a></div></div>`:`<a href="${l[0]}" class="${active===l[0]?'on':''}">${l[1]}</a>`).join('')}
  <a href="${u?FS.homeFor(u.role):'#/login'}">${u?'My Dashboard':'Login / Register'}</a>${u?'':`<a href="#/track" class="${active==='#/track'?'on':''}">Track Application</a>`}
  <a href="#" onclick="A.enroll();return false" class="btn btn-p btn-sm" style="margin-left:6px">Enroll ${FS.feeText}</a></nav></div></header>
  <main class="view">${html}</main>${footer()}`;
  if(FS.chrome)FS.chrome();
  FS.polishPub();
};
function footer(){const S=FS.state.site||{};return `<footer><div class="wrap"><div class="cols">
 <div><div class="logo" style="margin-bottom:12px"><img src="img/logo.png" alt="Finsang"></div>
 <p style="color:#bdbbb3;font-size:.88rem">${E(FS.ORGS.finsang.name)}. ${E(FS.C().footer.about)}</p>
 <div class="ct">${S.email?`<div>✉ <a href="mailto:${E(S.email)}"><b>${E(S.email)}</b></a></div>`:''}${S.phone?`<div>📞 <a href="tel:${E(String(S.phone).replace(/[^\d+]/g,''))}"><b>${E(S.phone)}</b></a></div>`:''}${S.address?`<div>📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.address)}" target="_blank" rel="noopener">${E(S.address)}</a> <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.address)}" target="_blank" rel="noopener" class="mapl">View on map ↗</a></div>`:''}</div>
 <a href="#" onclick="A.enroll();return false" class="apply">Apply now →</a></div>
 <div><h4>Career Tracks</h4>${FS.programs().map(p=>`<a href="#/programs/${p.id}">${E(p.name)}</a>`).join('')}</div>
 <div><h4>Quick Links</h4><a href="#/about">About Us</a><a href="#/partners">Our Partners</a><a href="#/founder">Founder Sprint</a><a href="#/track">Track Application</a><a href="#/verify">Verify Certificate</a><a href="#/login">Student / Staff Login</a><a href="#/contact">Contact Us</a><a href="#/faq">FAQs</a><a href="#/privacy">Privacy Policy</a><a href="#/terms">Terms &amp; Conditions</a></div>
 <div><h4>Program Partners</h4>${Object.keys(FS.ORGS).filter(k=>k!=='finsang').map(k=>`<a href="#/partners"><b style="color:#fff">${E(FS.ORGS[k].name)}</b><br>${E(FS.ORGS[k].role)}</a>`).join('')}</div></div>
 <div class="bot"><span>© ${new Date().getFullYear()} ${E(FS.ORGS.finsang.name)}. All rights reserved.</span><span>Placement assistance is not a guarantee of employment.</span></div></div></footer>${FS.fab?FS.fab():''}`}

/* ---------- Portal shell (student / trainer / admin) ---------- */
FS.NAVG={student:[['Learn',['dashboard','programs','materials','videos']],['Practice',['assessments','assignments']],['Stay updated',['announcements','certificates','placement']]],
 admin:[['Overview',['overview']],['People',['students','staff','inbox']],['Learning',['programs','content','assessments']],['Outcomes',['certificates','placement','announcements']],['Website',['website']],['Insights',['reports','settings']]],
 trainer:[['Teach',['overview','students','content']],['Evaluate',['assignments','assessments','attendance']]]};
FS.ROLE={student:'Student Portal',trainer:'Mentor Panel',admin:'Admin Console'};
FS.counts=role=>{const S=FS.state,u=FS.user(),o={};
 if(role==='admin'){o.students=S.applications.filter(a=>['Pending','Under Review'].includes(a.status)).length;o.inbox=S.messages.filter(m=>!m.read).length;o.assessments=S.submissions.filter(s=>s.status==='Submitted').length;o.certificates=S.certReq.length}
 else if(role==='trainer'){o.assignments=S.submissions.filter(s=>s.status==='Submitted'&&(u.programs||[]).includes(s.pid)).length}
 else{const me=FS.studentRec(u.email);if(me&&FS.assignments)o.assignments=FS.assignments(me.program).filter(a=>['Pending','Overdue'].includes(FS.aStatus(me.email,a))).length}
 return o};
FS.notes=role=>{const S=FS.state,u=FS.user(),n=[];
 if(role==='admin'){S.applications.filter(a=>['Pending','Under Review'].includes(a.status)).slice(0,4).forEach(a=>n.push(['📥','New application: '+a.name,FS.pname(a.program),'#/admin/students',a.date]));
  S.messages.filter(m=>!m.read).slice(0,3).forEach(m=>n.push(['✉️','Message from '+m.name,String(m.message).slice(0,70),'#/admin/inbox',m.date]));
  const sb=S.submissions.filter(s=>s.status==='Submitted').length;if(sb)n.push(['📝',sb+' submission'+(sb>1?'s':'')+' to evaluate','','#/admin/assessments']);
  if(S.certReq.length)n.push(['🏅',S.certReq.length+' certificate request'+(S.certReq.length>1?'s':''),'','#/admin/certificates'])}
 else if(role==='trainer'){S.submissions.filter(s=>s.status==='Submitted'&&(u.programs||[]).includes(s.pid)).slice(0,5).forEach(s=>n.push(['📝',s.name+' submitted work',s.title,'#/trainer/assignments',s.date]));
  S.students.filter(s=>FS.progressOf(s)<50||s.attendance<75).slice(0,3).forEach(s=>n.push(['⚠️',s.name+' needs attention','Progress '+FS.progressOf(s)+'% · Attendance '+s.attendance+'%','#/trainer/students']))}
 else{const me=FS.studentRec(u.email);if(me){FS.assignments(me.program).filter(a=>['Pending','Overdue'].includes(FS.aStatus(me.email,a))).slice(0,3).forEach(a=>n.push([a.due<FS.day(0)?'⏰':'📤',a.title,(a.due<FS.day(0)?'Overdue · was due ':'Due ')+FS.fmt(a.due),'#/student/assignments']));
  S.announcements.filter(a=>a.prog==='all'||a.prog===me.program).slice(0,3).forEach(a=>n.push(['🔔',a.title,a.type,'#/student/announcements',a.date]));
  if(FS.certOf&&FS.certOf(me.email))n.push(['🏅','Your certificate is ready','Download from Certificates','#/student/certificates'])}}
 return n};
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
FS.mountPortal=(role,page,title,html)=>{
  const u=FS.user(),nav=FS.NAV[role],cnt=FS.counts(role),notes=FS.notes(role),byId=Object.fromEntries(nav.map(n=>[n[0],n]));
  let col='';try{col=localStorage.getItem('fs_col')==='1'?' col':''}catch(e){}
  const link=id=>{const n=byId[id];if(!n)return'';return `<a href="#/${role}/${n[0]}" class="${page===n[0]?'on':''}" onclick="A.sb(0)" title="${n[2]}"><span>${n[1]}</span><em>${n[2]}</em>${cnt[id]?`<b class="nb">${cnt[id]}</b>`:''}</a>`};
  const unreadN=notes.length;
  $app().innerHTML=`<div id="sprog"></div><div class="portal${col}" id="portal"><aside class="sb" id="sb"><a href="#/" class="logo"><img src="img/logo.png" alt="Finsang"></a>
  <span class="role-pill">${FS.ROLE[role]}</span>
  <nav>${FS.NAVG[role].map(g=>`<div class="sg">${g[0]}</div>${g[1].map(link).join('')}`).join('')}</nav>
  <div class="sbf"><a href="#/"><span>🌐</span><em>Public website</em></a><button class="colbtn" onclick="A.col()" title="Collapse sidebar"><span>‹</span><em>Collapse</em></button>
  <div class="uc"><div class="av">${E(initials(u.name))}</div><div><b>${E(u.name)}</b><small>${E(u.email)}</small></div></div></div></aside>
  <div class="pmain"><div class="ptop"><button class="msb" onclick="A.sb()" aria-label="Menu">☰</button>
   <div class="ttl"><div class="crumb2">${FS.ROLE[role]} <i>/</i> ${E(title)}</div><h2>${E(title)}</h2></div>
   <div class="sp">${role==='student'?`<select class="sw" onchange="A.switchProg(this.value)" title="Focus track">${FS.programs().map(p=>`<option value="${p.id}" ${FS.studentRec(u.email)&&FS.studentRec(u.email).program===p.id?'selected':''}>${FS.esc(p.name)}</option>`).join('')}</select>`:''}
   <button class="tb-search" onclick="A.pal()"><span>🔍</span><em>Search</em><kbd>⌘K</kbd></button>
   <div class="tb-wrap"><button class="tb-btn" onclick="A.drop('np',event)" aria-label="Notifications">🔔${unreadN?`<b class="bdg">${unreadN}</b>`:''}</button>
    <div class="drop" id="np"><div class="dh"><b>Notifications</b><span class="hint">${unreadN} item${unreadN===1?'':'s'}</span></div>${notes.map(n=>`<a class="di" href="${n[3]}"><i>${n[0]}</i><div><b>${E(n[1])}</b>${n[2]?`<small>${E(n[2])}</small>`:''}</div>${n[4]?`<time>${FS.fmt(n[4])}</time>`:''}</a>`).join('')||'<div class="empty" style="padding:26px">You are all caught up ✨</div>'}</div></div>
   <div class="tb-wrap"><button class="avatar" onclick="A.drop('um',event)" aria-label="Account">${E(initials(u.name))}</button>
    <div class="drop sm" id="um"><div class="dh"><div><b>${E(u.name)}</b><small>${E(u.email)}</small></div></div><a class="di" href="#/"><i>🌐</i><div><b>Public website</b></div></a><a class="di" href="#" onclick="A.pwForm();return false"><i>🔑</i><div><b>Change password</b></div></a><a class="di" href="#" onclick="A.logout();return false"><i>🚪</i><div><b>Log out</b></div></a></div></div></div></div>
  <div class="pbody view">${html}</div></div></div>`;
  FS.polish();
};
A.col=()=>{const p=document.getElementById('portal');if(!p)return;p.classList.toggle('col');try{localStorage.setItem('fs_col',p.classList.contains('col')?'1':'0')}catch(e){}};
A.drop=(id,e)=>{e.stopPropagation();document.querySelectorAll('.drop.show').forEach(d=>{if(d.id!==id)d.classList.remove('show')});const d=document.getElementById(id);if(d)d.classList.toggle('show')};
document.addEventListener('click',e=>{if(!e.target.closest('.drop'))document.querySelectorAll('.drop.show').forEach(d=>d.classList.remove('show'));
 document.querySelectorAll('body>.amm.ported').forEach(m=>{if(!m.contains(e.target)||e.target.closest('button'))setTimeout(()=>m.remove(),0)})});
/* command palette */
FS.palItems=()=>{const u=FS.user(),role=u&&u.role;if(!role||!FS.NAV[role])return[];const S=FS.state,o=[];
 FS.NAV[role].forEach(n=>o.push([n[1],n[2],'Go to page','#/'+role+'/'+n[0]]));
 if(role==='admin'){S.students.forEach(s=>o.push(['👤',s.name,'Student · '+s.email,'#/admin/students']));S.applications.forEach(a=>o.push(['📥',a.name,'Application · '+a.id,'#/admin/students']));S.programs.forEach(p=>o.push([p.icon,p.name,'Program','#/admin/programs']))}
 if(role==='trainer')FS.myStudents().forEach(s=>o.push(['👤',s.name,'Student · '+s.email,'#/trainer/students']));
 if(role==='student'){const me=FS.studentRec(u.email);if(me)FS.videos(me.program).forEach(v=>o.push(['▶️',v.title,'Video lesson','#/student/videos?v='+v.id]));FS.programs().forEach(p=>o.push([p.icon,p.name,'Program','#/student/programs']))}
 return o};
A.pal=()=>{FS.modal(`<div class="pal"><div class="pal-i"><span>🔍</span><input id="palq" placeholder="Search pages, students, programs…" autocomplete="off" oninput="A.palQ(this.value)" onkeydown="A.palK(event)"></div><div id="palr" class="pal-r"></div><div class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>`);
 const m=document.querySelector('#modal .md');if(m)m.classList.add('palm');A.palQ('');setTimeout(()=>{const i=document.getElementById('palq');if(i)i.focus()},30)};
A.palQ=v=>{const q=String(v||'').toLowerCase().trim(),all=FS.palItems();const r=(q?all.filter(i=>(i[1]+' '+i[2]).toLowerCase().includes(q)):all.slice(0,9)).slice(0,9);FS.ui.palI=0;
 document.getElementById('palr').innerHTML=r.map((i,k)=>`<a class="pr ${k?'':'on'}" href="${i[3]}" onclick="FS.closeModal()"><i>${E(i[0])}</i><div><b>${E(i[1])}</b><small>${E(i[2])}</small></div><em>↵</em></a>`).join('')||'<div class="empty" style="padding:24px">No results</div>';FS.fixLinks(document.getElementById('palr'))};
A.palK=e=>{const rs=[...document.querySelectorAll('#palr .pr')];if(!rs.length)return;let i=FS.ui.palI||0;
 if(e.key==='ArrowDown'){i=(i+1)%rs.length}else if(e.key==='ArrowUp'){i=(i-1+rs.length)%rs.length}else if(e.key==='Enter'){e.preventDefault();rs[i].click();return}else return;
 e.preventDefault();rs.forEach((r,k)=>r.classList.toggle('on',k===i));FS.ui.palI=i;rs[i].scrollIntoView({block:'nearest'})};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&document.getElementById('portal')){e.preventDefault();A.pal()}});

/* ---------- animations shared by every page ---------- */
const countUp=el=>{const m=/^(\D*)(\d[\d,]*)(\D*)$/.exec(el.textContent.trim());if(!m)return;const to=+m[2].replace(/,/g,'');if(!(to>0)||to>1e7)return;const t0=performance.now();
 const step=t=>{const k=Math.min(1,(t-t0)/950);el.textContent=m[1]+Math.round(to*(1-Math.pow(1-k,3))).toLocaleString('en-IN')+m[3];if(k<1)requestAnimationFrame(step)};el.textContent=m[1]+'0'+m[3];requestAnimationFrame(step)};
FS.polish=()=>{const q=FS.quiet,idx=(sel,skipGrid)=>document.querySelectorAll(sel).forEach(p=>[...p.children].forEach((c,i)=>{c.style.setProperty('--i',Math.min(i,14));if(!q&&!(skipGrid&&c.classList.contains('grid')))c.classList.add('fx')}));
 idx('.pbody',true);idx('.pbody .grid');idx('.chart');idx('.tbl tbody');idx('.feed');idx('.hbars');
 if(!q)document.querySelectorAll('.pbody .stat b,.pbody .kpi b').forEach(countUp)};
FS.polishPub=()=>{if(document.querySelector('.hx2'))return;
 document.querySelectorAll('.view .sec>.wrap,.view .ph>.wrap').forEach(w=>{w.classList.add('rv');if(FS.quiet)w.classList.add('in')});
 document.querySelectorAll('.view .grid').forEach(g=>{g.classList.add('stg')});if(FS.reveal)FS.reveal()};

FS.guard=role=>{const u=FS.user();if(!u){FS.ui.after=null;FS.go('#/login?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));return false}if(u.role!==role){FS.go(FS.homeFor(u.role));return false}return true};

/* ---- Multi-page URL scheme ----
   Code builds links as '#/path?query'; FS.toUrl turns them into real files:
   /programs/x -> program.html?id=x ; /student/videos -> student-videos.html ; /about -> about.html */
FS.toUrl=h=>{const raw=String(h).replace(/^#/,'')||'/';const i=raw.indexOf('?');const path=i<0?raw:raw.slice(0,i),q=i<0?'':raw.slice(i+1);let m,f;
 if(m=path.match(/^\/programs\/([\w-]+)$/)){f='program.html';return f+'?id='+m[1]+(q?'&'+q:'')}
 if(m=path.match(/^\/(student|admin|trainer)\/(\w+)$/))f=m[1]+'-'+m[2]+'.html';
 else f=path==='/'?'index.html':path.slice(1)+'.html';
 return f+(q?'?'+q:'')};
FS.go=h=>{location.href=FS.toUrl(h)};
FS.fixLinks=(root)=>(root||document).querySelectorAll('a[href^="#/"]').forEach(a=>a.setAttribute('href',FS.toUrl(a.getAttribute('href'))));
FS.here=()=>{const name=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');const q=new URLSearchParams(location.search);
 if(name==='index')return['/',q];if(name==='program')return['/programs/'+(q.get('id')||''),q];
 const m=name.match(/^(student|admin|trainer)-(\w+)$/);return m?['/'+m[1]+'/'+m[2],q]:['/'+name,q]};
FS.labelTables=()=>document.querySelectorAll('.tbl').forEach(t=>{const h=[...t.querySelectorAll('tr:first-child th')].map(x=>x.textContent.trim());t.querySelectorAll('tr').forEach(r=>[...r.children].forEach((c,i)=>{if(c.tagName==='TD'&&!c.hasAttribute('colspan'))c.setAttribute('data-label',h[i]||'')}))});
FS.render=(keepScroll)=>{FS.quiet=!!keepScroll;
  const [path,query]=FS.here();
  FS.closeModal();
  for(const r of FS.routes){const m=path.match(r.re);if(m){r.fn(m.slice(1),query);FS.fixLinks();FS.labelTables();if(!keepScroll)window.scrollTo(0,0);return}}
  FS.mountPublic(`<div class="sec"><div class="wrap empty"><h2>Page not found</h2><p style="margin:10px 0 20px">The page you requested does not exist.</p><a class="btn btn-p" href="#/">Go Home</a></div></div>`);FS.fixLinks();
};

/* shared actions */
A.menu=()=>document.getElementById('navl').classList.toggle('open');
A.sb=v=>document.getElementById('sb').classList.toggle('open',v===0?false:undefined);
A.logout=async()=>{await FS.logout();FS.go('#/')};
A.set=(k,v)=>{FS.ui[k]=v;FS.render(true)};
A.go=id=>{const e=document.getElementById(id);if(e)e.scrollIntoView({behavior:'smooth',block:'start'});return false};
A.tabs=(key,items,cur)=>`<div class="tabs">${items.map(i=>`<button class="${(cur||items[0][0])===i[0]?'on':''}" onclick="A.set('${key}','${i[0]}')">${i[1]}</button>`).join('')}</div>`;
document.addEventListener('keydown',e=>{if(e.key==='Escape')FS.closeModal()});
window.addEventListener('DOMContentLoaded',()=>FS.boot().then(()=>FS.render()).catch(e=>{document.getElementById('app').innerHTML='<div style="padding:60px 20px;text-align:center;font-family:system-ui"><h2>Service unavailable</h2><p style="margin-top:10px">'+FS.esc(e.message)+'</p></div>'}));
A.enter=()=>FS.go('#/login');
A.enroll=(pid)=>{
  if(!FS.state.site.applicationsOpen){FS.modal(`<h3>Applications closed</h3><p>New applications are not being accepted right now. Please check back soon or <a href="#/contact">contact us</a>.</p><div class="row" style="margin-top:14px"><button class="btn btn-o" onclick="FS.closeModal()">Close</button></div>`);return}
  FS.modal(`<h3>Apply for the 360° Career Program</h3><div class="price" style="grid-template-columns:1fr;padding:18px;margin-bottom:14px"><div class="amt">${FS.feeText}</div><p>One-time fee · all ${FS.programs().length} career tracks within 3 months · payable after your application is approved</p></div>${FS.applyForm(pid||'')}`,true)};
A.pwForm=()=>FS.modal(`<h3>Change password</h3><form onsubmit="return A.pwSave(event)"><div class="fg"><label>Current password</label><input name="c" type="password" required autocomplete="current-password"></div><div class="fg"><label>New password (min 8 characters)</label><input name="n" type="password" minlength="8" required autocomplete="new-password"></div><div class="row"><button class="btn btn-p">Update password</button><button type="button" class="btn btn-o" onclick="FS.closeModal()">Cancel</button></div></form>`);
A.pwSave=async e=>{e.preventDefault();try{await FS.api('POST','/api/password',{current:e.target.c.value,password:e.target.n.value});FS.closeModal();FS.toast('Password updated')}catch(x){FS.err(x)}return false};
A.switchProg=pid=>{const r=FS.studentRec(FS.user().email);if(r){r.program=pid;FS.save();FS.toast('Focus track changed to '+FS.pname(pid));FS.render(true)}};

/* ---------- show / hide password toggle for every password field ---------- */
FS.eyes=(root)=>(root||document).querySelectorAll('input[type=password]:not([data-eye])').forEach(i=>{i.setAttribute('data-eye','1');
 const w=document.createElement('span');w.className='pw';i.parentNode.insertBefore(w,i);w.appendChild(i);
 const b=document.createElement('button');b.type='button';b.className='eye';b.setAttribute('aria-label','Show password');b.title='Show password';
 const ico=on=>on?'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.1 4M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19c1.6 0 3-.4 4.200-1M9.900 9.900a3 3 0 0 0 4.200 4.200"/></svg>':'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.500 12S6 5 12 5s9.500 7 9.500 7-3.500 7-9.500 7S2.500 12 2.500 12z"/><circle cx="12" cy="12" r="3"/></svg>';
 b.innerHTML=ico(false);
 b.onclick=()=>{const show=i.type==='password';i.type=show?'text':'password';b.innerHTML=ico(show);b.setAttribute('aria-label',show?'Hide password':'Show password');b.title=show?'Hide password':'Show password'};
 w.appendChild(b)});
new MutationObserver(()=>FS.eyes()).observe(document.documentElement,{childList:true,subtree:true});
