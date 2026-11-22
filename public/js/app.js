/* Router, layouts and shared actions */
window.A=window.A||{};
FS.ui={};FS.routes=[];
FS.route=(re,fn)=>FS.routes.push({re:new RegExp('^'+re+'$'),fn});
const $app=()=>document.getElementById('app');
const PUB=[['#/','Home'],['#/programs','Programs'],['#/about','About'],['#/partners','Partners'],['#/contact','Contact'],['#/faq','FAQ']];
FS.NAV={
 student:[['dashboard','🏠','Dashboard'],['programs','🎓','My Programs'],['materials','📚','Learning Materials'],['videos','▶️','Video Learning'],['assessments','📝','Papers & Assessments'],['assignments','📤','Assignments'],['announcements','🔔','Announcements'],['certificates','🏅','Certificates'],['placement','💼','Placement']],
 admin:[['overview','📊','Overview'],['students','👥','Students & Applications'],['programs','🎓','Programs'],['content','🗂️','Learning Content'],['assessments','📝','Assessments'],['certificates','🏅','Certificates'],['placement','💼','Placement'],['announcements','📣','Announcements'],['staff','🧑‍🏫','Trainers & Staff'],['inbox','✉️','Messages'],['reports','📈','Reports & Analytics'],['settings','⚙️','Settings']],
 trainer:[['overview','🏠','Overview'],['students','👥','My Students'],['content','🗂️','Study Materials & Videos'],['assignments','📤','Assignments & Reviews'],['assessments','📝','Assessments'],['attendance','🗓️','Attendance']]
};
FS.logo=()=>`<a href="#/" class="logo"><img src="img/logo.png" alt="Finsang"></a>`;

FS.mountPublic=(html,active)=>{
  const u=FS.user();
  $app().innerHTML=`<header class="nav"><div class="wrap">${FS.logo()}<button class="burger" onclick="A.menu()" aria-label="Menu">☰</button>
  <nav class="nav-links" id="navl">${PUB.map(l=>`<a href="${l[0]}" class="${active===l[0]?'on':''}">${l[1]}</a>`).join('')}
  <a href="${u?FS.homeFor(u.role):'#/login'}">${u?'My Dashboard':'Login / Register'}</a>
  <a href="#" onclick="A.enroll();return false" class="btn btn-p btn-sm" style="margin-left:6px">Enroll ${FS.feeText}</a></nav></div></header>
  <main class="view">${html}</main>${footer()}`;
};
function footer(){return `<footer><div class="wrap"><div class="cols">
 <div><div class="logo" style="margin-bottom:12px"><img src="img/logo.png" alt="Finsang"></div>
 <p style="color:#bdbbb3;font-size:.88rem">${FS.ORGS.finsang.name}. Industry-oriented skill development with certification and placement assistance (not a guarantee of employment).</p></div>
 <div><h4>Explore</h4>${FS.programs().slice(0,5).map(p=>`<a href="#/programs/${p.id}">${p.name}</a>`).join('')}</div>
 <div><h4>Quick Links</h4><a href="#/about">About Us</a><a href="#/partners">Our Partners</a><a href="#/verify">Verify Certificate</a><a href="#/login">Student / Staff Login</a><a href="#/contact">Contact Us</a><a href="#/privacy">Privacy Policy</a><a href="#/terms">Terms &amp; Conditions</a></div>
 <div><h4>Program Partners</h4><a href="#/partners"><b style="color:#fff">${FS.ORGS.grainzap.name}</b><br>Technology &amp; project partner</a><a href="#/partners"><b style="color:#fff">Growth Digital</b><br>Marketing &amp; growth partner</a></div></div>
 <div class="bot"><span>© ${new Date().getFullYear()} ${FS.ORGS.finsang.name}</span><span>${E(FS.state.site.email||'')}</span></div></div></footer>`}

FS.mountPortal=(role,page,title,html)=>{
  const u=FS.user();const nav=FS.NAV[role];
  $app().innerHTML=`<div class="portal"><aside class="sb" id="sb"><a href="#/" class="logo"><img src="img/logo.png" alt="Finsang"></a>
  <span class="role-pill">${role==='student'?'Student Portal':role==='trainer'?'Mentor / Trainer Panel':'Admin Console'}</span>
  ${nav.map(n=>`<a href="#/${role}/${n[0]}" class="${page===n[0]?'on':''}" onclick="A.sb(0)"><span>${n[1]}</span>${n[2]}</a>`).join('')}
  <div class="sep"></div><a href="#/"><span>🌐</span>Public Website</a><a href="#" onclick="A.pwForm();return false"><span>🔑</span>Change password</a><a href="#" onclick="A.logout();return false"><span>🚪</span>Logout</a></aside>
  <div class="pmain"><div class="ptop"><button class="msb" onclick="A.sb()">☰</button><h2>${title}</h2>
  <div class="sp">${role==='student'?`<select class="sw" onchange="A.switchProg(this.value)" title="Switch program">${FS.programs().map(p=>`<option value="${p.id}" ${FS.studentRec(u.email)&&FS.studentRec(u.email).program===p.id?'selected':''}>${FS.esc(p.name)}</option>`).join('')}</select>`:''}<span class="hint" style="text-align:right">${FS.esc(u.name)}<br><b style="color:var(--navy);text-transform:capitalize">${u.role}</b></span><span class="av">${FS.esc(u.name[0])}</span></div></div>
  <div class="pbody view">${html}</div></div></div>`;
};
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
FS.render=(keepScroll)=>{
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
  FS.modal(`<h3>Apply for the Skill Program</h3><div class="price" style="grid-template-columns:1fr;padding:18px;margin-bottom:14px"><div class="amt">${FS.feeText}</div><p>One-time fee · access to all ${FS.programs().length} programs · payable after your application is approved</p></div>${FS.applyForm(pid||'')}`,true)};
A.pwForm=()=>FS.modal(`<h3>Change password</h3><form onsubmit="return A.pwSave(event)"><div class="fg"><label>Current password</label><input name="c" type="password" required autocomplete="current-password"></div><div class="fg"><label>New password (min 8 characters)</label><input name="n" type="password" minlength="8" required autocomplete="new-password"></div><div class="row"><button class="btn btn-p">Update password</button><button type="button" class="btn btn-o" onclick="FS.closeModal()">Cancel</button></div></form>`);
A.pwSave=async e=>{e.preventDefault();try{await FS.api('POST','/api/password',{current:e.target.c.value,password:e.target.n.value});FS.closeModal();FS.toast('Password updated')}catch(x){FS.err(x)}return false};
A.switchProg=pid=>{const r=FS.studentRec(FS.user().email);if(r){r.program=pid;FS.save();FS.toast('Switched to '+FS.pname(pid));FS.render(true)}};
