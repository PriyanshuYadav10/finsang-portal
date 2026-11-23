/* Public website pages */
const E=FS.esc;
FS.programCard=p=>`<div class="card pc"><div class="top"><div class="pi" style="background:${p.color}">${p.icon}</div><span class="tag t">${p.cat}</span></div>
<h3>${E(p.name)}</h3><p class="s">${E(p.short)}</p>
<div class="meta"><span class="tag">⏱ ${p.months} months</span><span class="tag g">${p.mode}</span></div>
<div class="lbl">Key skills</div><div class="meta">${(p.skills||[]).slice(0,5).map(s=>`<span class="tag m">${E(s)}</span>`).join('')}</div>
<div class="lbl">Career opportunities</div><p style="font-size:.85rem">${(p.careers||[]).slice(0,3).map(E).join(' · ')}</p>
<div class="act"><a class="btn btn-o" href="#/programs/${p.id}">View Details</a><a class="btn btn-p" href="#" onclick="A.enroll('${p.id}');return false">Enroll Now</a></div></div>`;

FS.faqListF=()=>[['Is this a guaranteed job program?','No. We provide placement assistance — resume support, mock interviews and access to partner openings. Employment is never guaranteed and depends on your performance and employer decisions.'],
['How long are the programs?','Programs run for approximately 3–4 months depending on the track. Duration, mode and schedule are listed on each program page.'],
['Who can apply?','Students, freshers, graduates and aspiring professionals. Each program lists its own eligibility criteria.'],
['How does admission work?','Submit the application, receive an application ID, our team reviews it, and once approved you get access to the student dashboard.'],
['How do I get a certificate?','Certificates are issued after meeting completion criteria: minimum progress, assessment score and attendance. Every certificate has a unique ID you can verify online.'],
['What does it cost?',`A single one-time fee of ${FS.feeText} gives you access to all ${FS.programs().length} programs. The fee is payable after your application is approved.`]];
const faqHtml=l=>l.map(f=>`<details class="faq"><summary>${E(f[0])}</summary><p>${E(f[1])}</p></details>`).join('');

/* ---------- Home (marketing landing page) ---------- */
FS.stagger=root=>(root||document).querySelectorAll('.stg').forEach(p=>[...p.children].forEach((c,i)=>c.style.setProperty('--i',i)));
FS.reveal=()=>{FS.stagger();const els=[...document.querySelectorAll('.rv')];
 const run=el=>{el.classList.add('in');el.querySelectorAll('[data-count]').forEach(c=>{const to=+c.dataset.count,t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/1200);c.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})};
 if(!('IntersectionObserver' in window)){els.forEach(e=>{e.classList.add('in');e.querySelectorAll('[data-count]').forEach(c=>c.textContent=c.dataset.count)});return}
 const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){run(en.target);io.unobserve(en.target)}}),{threshold:.12});
 els.forEach(e=>io.observe(e))};
/* scroll progress bar, sticky-nav shadow and hero parallax (bound once per page) */
FS.chrome=()=>{if(window.__chrome)return;window.__chrome=1;
 const on=()=>{const h=document.documentElement,t=h.scrollTop||document.body.scrollTop,m=h.scrollHeight-h.clientHeight;const b=document.getElementById('sprog');if(b)b.style.transform=`scaleX(${m>0?t/m:0})`;const n=document.querySelector('.nav');if(n)n.classList.toggle('sc',t>12)};
 window.addEventListener('scroll',on,{passive:true});on();
 window.addEventListener('pointermove',e=>{const h=document.querySelector('.hx2');if(!h||innerWidth<960)return;const r=h.getBoundingClientRect();if(r.bottom<0)return;h.style.setProperty('--mx',((e.clientX/innerWidth)-.5).toFixed(3));h.style.setProperty('--my',((e.clientY/innerHeight)-.5).toFixed(3))},{passive:true})};
A.annClose=()=>{try{sessionStorage.setItem('fs_ann','1')}catch(e){}const a=document.getElementById('annc');if(a)a.remove()};
A.homeCat=c=>{FS.ui.hc=c;const g=document.getElementById('pgrid');if(!g)return;
 g.innerHTML=FS.programs().filter(p=>!c||p.cat===c).map(FS.programCard).join('');FS.fixLinks(g);FS.stagger(g.parentNode);
 document.querySelectorAll('.ptabs button').forEach(b=>b.classList.toggle('on',(b.dataset.c||'')===c))};
FS.leadForm=(id,compact)=>`<form onsubmit="return A.lead(event)" id="${id}" class="leadf">
 <div class="frow"><div class="fg"><input name="name" placeholder="Full name *" required maxlength="120" autocomplete="name"></div><div class="fg"><input name="email" type="email" placeholder="Email address *" required autocomplete="email"></div></div>
 <div class="frow"><div class="fg"><input name="phone" type="tel" placeholder="Mobile number *" required pattern="[0-9+\\- ]{10,15}" autocomplete="tel"></div>
 <div class="fg"><select name="program" required><option value="">Preferred program *</option>${FS.programs().map(p=>`<option value="${E(p.id)}">${E(p.name)}</option>`).join('')}<option value="not-sure">Not sure yet</option></select></div></div>
 ${compact?'':`<label class="chk1"><input type="checkbox" required> I agree to be contacted about Finsang programs.</label>`}
 <button class="btn btn-a btn-block">Request a Call Back <span class="ar">→</span></button></form>`;
A.lead=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button');b.disabled=true;
 const pn=f.program.value==='not-sure'?'Not sure yet':FS.pname(f.program.value);
 try{await FS.api('POST','/api/contact',{name:f.name.value,email:f.email.value,message:`Call-back request\nPhone: ${f.phone.value}\nInterested in: ${pn}`});
  f.innerHTML='<div class="okmsg"><i>✓</i><b>Thank you!</b><span>Our counsellor will call you shortly.</span></div>'}
 catch(x){b.disabled=false;FS.err(x)}return false};
A.leadModal=()=>FS.modal(`<h3 style="margin-bottom:4px">Get free career guidance</h3><p style="margin-bottom:14px">Tell us a little about yourself and we will call you back.</p>${FS.leadForm('leadm',true)}<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn btn-o btn-sm" onclick="FS.closeModal()">Close</button></div>`);
FS.fab=()=>{const d=String(FS.state.site.phone||'').replace(/\D/g,'');const wa=d.length>=10&&/[1-9]/.test(d.slice(-10))?(d.length===10?'91'+d:d):'';
 return `<div class="fab"><button class="fab-cb" onclick="A.leadModal()"><span>📞</span><em>Request call back</em></button>${wa?`<a class="fab-wa" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent('Hello, I would like to know more about the Finsang programs.')}" aria-label="WhatsApp us"><svg viewBox="0 0 32 32" width="26" height="26" fill="#fff"><path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.4.7 4.6 1.9 6.5L3.2 29l7.2-2.1c1.8 1 3.9 1.5 5.6 1.5 6.9 0 12.6-5.6 12.6-12.6S22.900 3 16 3zm6.500 17.600c-.3.800-1.700 1.500-2.300 1.600-.6.100-1.300.1-2.100-.1-.5-.2-1.200-.4-2-.8-3.500-1.500-5.800-5-6-5.300-.2-.2-1.400-1.900-1.400-3.600s.9-2.500 1.200-2.900c.3-.3.700-.4.900-.4h.7c.2 0 .5-.1.800.6.300.7 1 2.500 1.100 2.700.1.200.1.400 0 .6-.1.200-.2.400-.4.600l-.6.700c-.2.200-.4.400-.2.800.2.400 1 1.600 2.100 2.600 1.400 1.300 2.600 1.700 3 1.900.4.200.6.200.8-.1.200-.3 1-1.100 1.300-1.500.3-.4.500-.3.900-.2.400.1 2.300 1.100 2.700 1.300.4.200.7.300.8.500.1.200.1.900-.2 1.700z"/></svg></a>`:''}</div>`};

/* program finder quiz */
FS.quizDef=()=>{const ps=FS.programs();return [{q:'What are you most interested in?',k:'cat',o:[...new Set(ps.map(p=>p.cat))]},{q:'How do you prefer to learn?',k:'mode',o:[...new Set(ps.map(p=>p.mode))]}]};
A.qz=(act,v)=>{const Q=FS.quizDef(),s=FS.ui.qz||(FS.ui.qz={s:0,a:{}});
 if(act==='pick')s.a[Q[s.s].k]=v;else if(act==='next'&&s.a[Q[s.s].k])s.s++;else if(act==='back'&&s.s>0)s.s--;else if(act==='reset'){s.s=0;s.a={}}
 const el=document.getElementById('quiz');if(!el)return;
 if(s.s>=Q.length){const ps=FS.programs();const m=ps.filter(p=>p.cat===s.a.cat);const best=m.find(p=>p.mode===s.a.mode)||m[0]||ps[0];
  el.innerHTML=`<div class="qres"><span class="pill dk">Your best match</span><h3>${E(best.icon)} ${E(best.name)}</h3><p>${E(best.short)}</p><div class="meta"><span class="tag">⏱ ${best.months} months</span><span class="tag g">${E(best.mode)}</span></div>
   <div class="row" style="gap:10px;margin-top:20px;flex-wrap:wrap"><a class="btn btn-a" href="#/programs/${best.id}">View program →</a><button class="btn btn-w" onclick="A.enroll('${best.id}')">Enroll now</button><button class="btn btn-w" onclick="A.qz('reset')">Retake quiz</button></div></div>`;FS.fixLinks(el);return}
 const q=Q[s.s];
 el.innerHTML=`<div class="qstep"><b class="qk">${s.s+1}/${Q.length}</b><h3>${q.q}</h3><div class="qopts stg">${q.o.map((o,i)=>`<button class="qo ${s.a[q.k]===o?'on':''}" data-v="${E(o)}" onclick="A.qz('pick',this.dataset.v)"><i></i>${E(o)}</button>`).join('')}</div>
  <div class="qnav"><button class="btn btn-w btn-sm" onclick="A.qz('back')" ${s.s?'':'disabled'}>← Back</button><button class="btn btn-a btn-sm" onclick="A.qz('next')" ${s.a[q.k]?'':'disabled'}>${s.s===Q.length-1?'See my match':'Next'} →</button></div></div>`;
 FS.stagger(el)};
const wv=(t,k0)=>t.split(' ').map((w,i)=>`<span class="w" style="--k:${k0+i}">${w}</span>`).join(' ');
FS.wave=(fill,flip)=>`<svg class="wave ${flip?'fl':''}" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path fill="${fill}" d="M0 40C180 80 360 0 540 28s360 52 540 20 270-34 360-8V80H0z"/></svg>`;

FS.route('/',()=>{
 const progs=FS.programs(),cats=[...new Set(progs.map(p=>p.cat))];
 const lessons=progs.reduce((n,p)=>n+(p.modules||[]).reduce((m,x)=>m+(x.videos||[]).length,0),0),qn=progs.reduce((n,p)=>n+(p.quiz||[]).length,0);
 const mo=progs.map(p=>p.months),mr=mo.length?(Math.min(...mo)===Math.max(...mo)?String(mo[0]):Math.min(...mo)+'–'+Math.max(...mo)):'3–4';
 const skills=[...new Set(progs.flatMap(p=>p.skills||[]))];const half=Math.ceil(skills.length/2),r1=skills.slice(0,half),r2=skills.slice(half);
 const hl=[['🗓️','3–4 Months of Structured Learning','A week-by-week roadmap with weekly assessments keeps you on track from day one.'],['🏭','Industry-Oriented Curriculum','Built with input from our technology and growth partners.'],['🛠️','Practical Projects & Assignments','Learn by building: assignments and live project briefs.'],['🧭','Industry Mentorship','Guided by trainers and partner mentors.'],['🏅','Verifiable Certificates','A unique certificate ID anyone can verify, on meeting completion criteria.'],['💼','Placement Assistance','Resume, mock interviews and partner openings. Not a job guarantee.']];
 const steps=[['Explore','Browse programs and pick your track'],['Apply','Submit your application and resume'],['Get Approved','Our team reviews and approves'],['Learn & Build','Modules, videos, assignments, projects'],['Certify & Launch','Assessments, certificate, placement support']];
 const meth=[['📖','Learn','Recorded videos, live classes, notes and reference guides.'],['✍️','Practice','Quizzes, topic tests and guided exercises every week.'],['🔨','Build','Assignments and a team live project with mentor reviews.'],['📊','Assess','Weekly assessments, mock tests and a final evaluation.'],['🚀','Launch','Portfolio, mock interviews and placement assistance.']];
 let ann='';try{ann=sessionStorage.getItem('fs_ann')?'':`<div class="annc" id="annc"><span>🎓 <b>Admissions open</b> for the next batch. Limited seats per program.</span><a href="#" onclick="A.enroll();return false">Apply now →</a><button onclick="A.annClose()" aria-label="Close">×</button></div>`}catch(e){}
 const st=(n,l)=>`<div class="hs"><b data-count="${n}">0</b><span>${l}</span></div>`;
 const chip=s=>`<span>${E(s)}</span>`;
 FS.mountPublic(`${ann}
 <section class="hx2"><div class="mesh" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap hx2-in"><div class="hx2-l">
   <span class="pill">✦ Skill Development &amp; Career Launch Program</span>
   <h1>${wv('Learn Skills. Build Experience.',0)} <em class="hl">${wv('Launch Your Career.',4)}</em></h1>
   <p class="lead">A ${mr} month, industry-oriented program with structured learning, live projects, mentorship, certification and placement assistance, by Finsang India with GrainZap IT Solutions and Growth Digital.</p>
   <div class="leadc"><h3>Get professional guidance!</h3>${FS.leadForm('leadh')}</div>
   <div class="hx-ctas"><a href="#" onclick="A.enroll();return false" class="btn btn-p">Enroll Now <span class="ar">→</span></a><a href="#/programs" class="btn btn-o">Explore programs</a></div></div>
   <div class="hx2-r" aria-hidden="true"><div class="arch"><img src="img/logo.png" alt=""></div><div class="orbit r1"></div><div class="orbit r2"></div>
    <div class="fcw" style="--d:26;left:-2%;top:9%"><div class="fc"><b>My Learning Progress</b><small>Sample · Software Development, Month 2</small>${FS.bar(62)}<div class="row sp-b" style="font-size:.75rem;color:var(--mut)"><span>12 of 18 lessons</span><span>62%</span></div></div></div>
    <div class="fcw" style="--d:-34;right:-4%;top:30%"><div class="fc fc-d"><b>📝 Next assessment</b><small>Month 2 MCQ test · Friday</small></div></div>
    <div class="fcw" style="--d:22;left:2%;bottom:15%"><div class="fc"><b>🏅 Certificate</b><small>Unique, verifiable ID</small></div></div>
    <div class="fcw" style="--d:-18;right:2%;bottom:3%"><div class="fc fc-c"><span>Figma</span><span>React</span><span>SEO</span><span>CRM</span></div></div></div></div>
  <div class="wrap hx2-b rv"><div class="feat"><span>✓ Verifiable certificate</span><span>✓ Live projects</span><span>✓ Mentor support</span><span>✓ Placement assistance*</span></div>
   <div class="stats2">${st(progs.length,'Career tracks')}<div class="hs"><b>${mr}</b><span>Months of learning</span></div>${st(lessons,'Video lessons')}${st(qn,'Practice questions')}${st(Object.keys(FS.ORGS).length,'Industry partners')}</div></div></section>

 <section class="sec dk2"><div class="wave-t">${FS.wave('#f5f4ef',1)}</div><div class="wrap rv"><div class="sec-head"><span class="pill dk">Skills you will build</span><h2>Hands-on skills across <mark>five career tracks</mark></h2><p>From coding and design to marketing, sales and e-commerce.</p></div></div>
  <div class="mq"><div class="mt">${[...r1,...r1].map(chip).join('')}</div></div><div class="mq rev"><div class="mt">${[...r2,...r2].map(chip).join('')}</div></div><div class="wave-b">${FS.wave('#f5f4ef')}</div></section>

 <section class="sec" id="programs"><div class="wrap rv"><div class="sec-head"><span class="pill">Featured programs</span><h2>Learn with a <mark>curriculum built around real roles</mark></h2><p>Pick a track and see exactly what you will learn, build and be assessed on.</p></div>
  <div class="ptabs"><button class="on" data-c="" onclick="A.homeCat('')">All programs</button>${cats.map(c=>`<button data-c="${E(c)}" onclick="A.homeCat(this.dataset.c)">${E(c)}</button>`).join('')}</div>
  <div class="grid g3 stg" id="pgrid">${progs.map(FS.programCard).join('')}</div><div style="text-align:center;margin-top:34px"><a href="#/programs" class="btn btn-o">View all programs <span class="ar">→</span></a></div></div></section>

 <section class="sec qzs"><div class="grid-bg"></div><div class="wrap rv qz-in"><div class="qz-l"><span class="pill dk">Program finder</span><h2>Unsure which program fits you?</h2><p>Take our 2-question quiz and we will point you to a track.</p><div id="quiz" class="quiz"></div></div>
  <div class="qz-r" aria-hidden="true"><div class="arch sm"><span>🎯</span></div><div class="orbit r1"></div></div></div></section>

 <section class="sec alt"><div class="wrap rv"><div class="sec-head"><span class="pill">Why Finsang</span><h2>Everything you need to <mark>get career‑ready</mark></h2></div>
  <div class="bento stg">${hl.map((h,i)=>`<div class="bn ${i===0?'big':''}"><i>${h[0]}</i><h3>${h[1]}</h3><p>${h[2]}</p></div>`).join('')}</div></div></section>

 <section class="sec"><div class="wrap rv"><div class="sec-head"><span class="pill">How it works</span><h2>Your journey from <mark>application to career</mark></h2></div>
  <div class="tl stg">${steps.map((s,i)=>`<div class="tl-s"><div class="n">${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div></div></section>

 <section class="sec dk2 meths"><div class="wave-t">${FS.wave('#f5f4ef',1)}</div><div class="grid-bg"></div><div class="wrap rv"><div class="sec-head"><span class="pill dk">Learning methodology</span><h2>Learn → Practice → Build → Assess → <mark>Launch</mark></h2></div>
  <div class="mgrid stg">${meth.map((m,i)=>`<div class="mcard"><b class="mn">0${i+1}</b><div class="mi">${m[0]}</div><h3>${m[1]}</h3><p>${m[2]}</p></div>`).join('')}</div></div><div class="wave-b">${FS.wave('#f5f4ef')}</div></section>

 <section class="sec"><div class="wrap rv"><div class="sec-head"><span class="pill">Partners &amp; industry collaborators</span><h2>One program, <mark>three organizations</mark></h2></div>${partnerCards()}<div style="text-align:center;margin-top:30px"><a href="#/partners" class="btn btn-o">Learn about our partners <span class="ar">→</span></a></div></div></section>
 <section class="sec alt"><div class="wrap rv" style="max-width:820px"><div class="sec-head"><span class="pill">FAQs</span><h2>Frequently asked <mark>questions</mark></h2></div>${faqHtml(FS.faqListF().slice(0,5))}<p style="text-align:center;margin-top:8px"><a href="#/faq">See all FAQs →</a></p></div></section>
 <section class="sec"><div class="wrap rv"><div class="price"><div><span class="pill dk">Simple pricing</span><h2>One payment. All five programs.</h2><ul>${progs.map(p=>`<li>${E(p.name)}</li>`).join('')}<li>Certificate &amp; placement assistance</li></ul></div><div style="text-align:center"><div class="amt">${FS.feeText}</div><p style="margin:6px 0 16px">one-time fee</p><button class="btn btn-a" onclick="A.enroll()">Enroll Now <span class="ar">→</span></button></div></div></div></section>
 <section class="sec" style="padding-top:0"><div class="wrap rv"><div class="cta-band"><i class="o1"></i><i class="o2"></i><h2>Ready to launch your career?</h2><p>One payment of ${FS.feeText}. ${progs.length} programs. Start learning today.</p><div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap"><a href="#" onclick="A.enroll();return false" class="btn btn-a">Enroll Now <span class="ar">→</span></a><a href="#" onclick="A.leadModal();return false" class="btn btn-w">Talk to a counsellor</a></div></div><p class="hint" style="text-align:center;margin-top:16px">*Placement assistance means resume support, mock interviews and access to partner openings. It is not a guarantee of employment.</p></div></section>`,'#/');
 A.qz();FS.reveal();FS.chrome();
});
function partnerCards(){return `<div class="grid g3">${Object.keys(FS.ORGS).map(k=>{const o=FS.ORGS[k];return `<div class="card" style="border-top:4px solid ${o.color}">${FS.logoOrg(k,true)}<span class="tag m" style="margin:14px 0 8px;display:block;width:fit-content">${o.role}</span><p style="font-size:.9rem;margin-bottom:12px">${o.desc}</p><ul class="chk" style="font-size:.88rem">${o.contrib.map(c=>`<li>${c}</li>`).join('')}</ul></div>`}).join('')}</div>`}

/* Programs listing with search & filters */
FS.route('/programs',()=>{
 const f=FS.ui.pf||(FS.ui.pf={q:'',cat:'',dur:'',mode:''});
 const all=FS.programs();const list=all.filter(p=>(!f.q||(p.name+p.short+p.skills.join(' ')).toLowerCase().includes(f.q.toLowerCase()))&&(!f.cat||p.cat===f.cat)&&(!f.dur||String(p.months)===f.dur)&&(!f.mode||p.mode===f.mode));
 const opt=(arr,v)=>arr.map(a=>`<option ${v===String(a)?'selected':''}>${a}</option>`).join('');
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>All Programs</h1><p style="margin-top:8px">Five industry-oriented tracks. Search or filter to find your fit.</p></div></section>
 <section class="sec" style="padding-top:36px"><div class="wrap"><div class="filters">
 <input id="pq" placeholder="🔍 Search programs or skills…" value="${E(f.q)}" oninput="A.pf('q',this.value)">
 <select onchange="A.pf('cat',this.value)"><option value="">All categories</option>${opt([...new Set(all.map(p=>p.cat))],f.cat)}</select>
 <select onchange="A.pf('dur',this.value)"><option value="">Any duration</option>${[...new Set(all.map(p=>p.months))].sort().map(m=>`<option value="${m}" ${f.dur==m?'selected':''}>${m} months</option>`).join('')}</select>
 <select onchange="A.pf('mode',this.value)"><option value="">All modes</option>${opt([...new Set(all.map(p=>p.mode))],f.mode)}</select>
 <button class="btn btn-o" onclick="A.pfReset()">Reset</button></div>
 <p class="hint" style="margin-bottom:16px">${list.length} program${list.length!==1?'s':''} found</p>
 <div class="grid g3">${list.map(FS.programCard).join('')||'<div class="empty card" style="grid-column:1/-1">No programs match your filters.</div>'}</div></div></section>`,'#/programs');
 const i=document.getElementById('pq');if(i&&FS.ui.focusq){i.focus();i.setSelectionRange(i.value.length,i.value.length)}
});
A.pf=(k,v)=>{FS.ui.pf[k]=v;FS.ui.focusq=k==='q';FS.render(true);FS.ui.focusq=false};
A.pfReset=()=>{FS.ui.pf={q:'',cat:'',dur:'',mode:''};FS.render(true)};

/* Program details */
FS.applyForm=pid=>`<form onsubmit="return A.apply(event)" id="appf">
 <div class="frow"><div class="fg"><label>Full name *</label><input name="name" required></div><div class="fg"><label>Email address *</label><input name="email" type="email" required></div></div>
 <div class="frow"><div class="fg"><label>Mobile number *</label><input name="phone" required pattern="[0-9+\\- ]{10,15}" title="Enter a valid mobile number"></div><div class="fg"><label>City *</label><input name="city" required></div></div>
 <div class="frow"><div class="fg"><label>College / university *</label><input name="college" required></div><div class="fg"><label>Qualification *</label><select name="qualification" required><option value="">Select</option><option>12th Pass</option><option>Diploma</option><option>B.Tech / B.E.</option><option>BCA / MCA</option><option>B.Com / M.Com</option><option>BBA / MBA</option><option>BA / MA</option><option>B.Sc / M.Sc</option><option>Other</option></select></div></div>
 <div class="frow"><div class="fg"><label>Graduation year *</label><select name="year" required><option value="">Select</option>${[2023,2024,2025,2026,2027,2028].map(y=>`<option>${y}</option>`).join('')}</select></div>
 <div class="fg"><label>Selected program *</label><select name="program" required>${FS.programs().map(p=>`<option value="${p.id}" ${p.id===pid?'selected':''}>${E(p.name)}</option>`).join('')}</select></div></div>
 <div class="fg"><label>Create password *</label><input name="pass" type="password" minlength="8" required autocomplete="new-password"><span class="hint">At least 8 characters. Used to log in after your application is approved.</span></div>
 <div class="fg"><label>Resume upload</label><input name="resume" type="file" accept=".pdf,.doc,.docx"><span class="hint">PDF or Word, up to 5 MB.</span></div>
 <div class="fg"><label>Additional information</label><textarea name="info" placeholder="Anything you'd like us to know"></textarea></div>
 <label style="font-weight:500;display:flex;gap:8px;align-items:flex-start"><input type="checkbox" required style="width:auto;margin-top:4px"> I agree to the <a href="#/terms" target="_blank">Terms</a> and <a href="#/privacy" target="_blank">Privacy Policy</a>.</label>
 <button class="btn btn-p btn-block" style="margin-top:16px">Submit Application</button></form>`;
A.apply=async e=>{e.preventDefault();const form=e.target,btn=form.querySelector('button.btn-block');const fd=new FormData(form);const f=Object.fromEntries(fd.entries());
 f.email=f.email.trim().toLowerCase();f.password=f.pass;delete f.pass;const file=fd.get('resume');delete f.resume;btn.disabled=true;
 try{
  if(file&&file.size){if(file.size>5*1024*1024)throw new Error('Resume must be under 5 MB.');f.resumeId=(await FS.upload(file,'resume')).id}
  const r=await FS.api('POST','/api/apply',f);
  FS.modal(`<h3>✅ Application submitted</h3><p>Your application ID is <b style="color:var(--navy);font-size:1.2rem">${E(r.id)}</b>. Save it to track your status.</p><p style="margin:10px 0 18px">Next: our team reviews your application. Once approved, you can log in to your dashboard with the email and password you just chose.</p><div class="row"><a class="btn btn-p" href="#/track?id=${E(r.id)}&email=${encodeURIComponent(f.email)}">Track Application</a><button class="btn btn-o" onclick="FS.closeModal()">Close</button></div>`);
  form.reset();
 }catch(x){FS.err(x)}finally{btn.disabled=false}
 return false};

FS.route('/programs/([\\w-]+)',([id])=>{
 const p=FS.program(id);if(!p){FS.go('#/programs');return}
 const o=FS.ORGS[p.partner]||FS.ORGS.finsang;const roadmap=p.roadmap||[];
 const titles=['Foundation','Intermediate Learning','Practical Implementation','Career Preparation'];
 const sec=[['overview','Overview'],['outcomes','Outcomes'],['curriculum','Curriculum'],['roadmap','Roadmap'],['assignments','Assignments'],['project','Live Project'],['assessment','Assessment'],['careers','Careers'],['certification','Certification'],['placement','Placement'],['eligibility','Eligibility'],['faq','FAQ']];
 FS.mountPublic(`<section class="ph"><div class="wrap"><div class="crumb"><a href="#/">Home</a> / <a href="#/programs">Programs</a> / ${E(p.name)}</div>
 <div class="row" style="gap:18px;align-items:flex-start"><div class="pi" style="width:72px;height:72px;font-size:2.2rem;background:${p.color};border-radius:18px;display:grid;place-items:center">${p.icon}</div><div style="flex:1;min-width:240px"><h1>${E(p.name)}</h1><p style="margin:10px 0 16px;max-width:680px">${E(p.short)}</p>
 <div class="meta"><span class="tag">⏱ ${p.months} months</span><span class="tag g">${p.mode}</span><span class="tag a">${p.cat}</span><span class="tag m">Mentor: ${E(FS.mentorOf(p.id))}</span></div></div></div>
 <div class="row" style="margin-top:18px"><a class="btn btn-a" href="#" onclick="A.enroll('${p.id}');return false">Enroll Now</a><a class="btn btn-w" href="#/programs">All Programs</a></div></div></section>
 <section class="sec" style="padding-top:20px"><div class="wrap"><div class="subnav">${sec.map(s=>`<a href="#" onclick="return A.go('s-${s[0]}')">${s[1]}</a>`).join('')}</div>
 <div class="pl"><div>
 <div class="blk" id="s-overview"><h2>Overview</h2><p style="color:var(--ink)">${E(p.overview||p.short)}</p><div class="card flat" style="margin-top:16px;background:#faf8f1"><b>What you'll cover</b><ul class="chk" style="margin-top:8px;columns:2;column-gap:24px">${p.topics.map(t=>`<li>${E(t)}</li>`).join('')}</ul></div></div>
 <div class="blk" id="s-outcomes"><h2>Learning Outcomes</h2><ul class="chk">${(p.outcomes||[]).map(t=>`<li>${E(t)}</li>`).join('')}</ul></div>
 <div class="blk" id="s-curriculum"><h2>Detailed Curriculum</h2>${FS.modules(p.id).map((m,i)=>`<details class="acc" ${i===0?'open':''}><summary>Module ${i+1}: ${E(m.title)}</summary><div><b>Lessons</b><ul class="chk">${m.vids.map(v=>`<li>${E(v.title)}</li>`).join('')||'<li>Content coming soon</li>'}</ul></div></details>`).join('')}</div>
 <div class="blk" id="s-roadmap"><h2>Month-wise Learning Roadmap</h2><div class="tl">${roadmap.map((m,i)=>`<div class="m"><h3>Month ${i+1} — ${i===roadmap.length-1&&roadmap.length===3?'Implementation & Career Prep':titles[i]}</h3><ul class="chk" style="margin-top:6px">${m.map(x=>`<li>${E(x)}</li>`).join('')}</ul></div>`).join('')||'<p>Roadmap will be published soon.</p>'}</div></div>
 <div class="blk" id="s-assignments"><h2>Practical Assignments</h2><div class="grid g2">${(p.assignments||[]).map(a=>`<div class="card flat"><b>${E(a.title)}</b><p style="font-size:.9rem;margin-top:4px">${E(a.desc)}</p><span class="tag a" style="margin-top:8px">${a.marks} marks</span></div>`).join('')}</div></div>
 <div class="blk" id="s-project"><h2>Live Project</h2><div class="card" style="border-left:4px solid ${o.color}"><p style="color:var(--ink)">${E(p.live||'')}</p><p style="margin-top:12px">Project partner: ${FS.logoOrg(p.partner)}</p></div></div>
 <div class="blk" id="s-assessment"><h2>Assessment Methodology</h2><ul class="chk">${(p.assess||[]).map(t=>`<li>${E(t)}</li>`).join('')}</ul><p style="margin-top:8px">Weekly assessments, a mock test and a final evaluation determine completion and certification eligibility.</p></div>
 <div class="blk" id="s-careers"><h2>Sample Career Opportunities</h2><div class="pill-row">${(p.careers||[]).map(c=>`<span class="tag t" style="font-size:.9rem;padding:8px 14px">${E(c)}</span>`).join('')}</div><p class="hint" style="margin-top:8px">Illustrative roles; actual outcomes depend on individual performance and employers.</p></div>
 <div class="blk" id="s-certification"><h2>Certification</h2><p style="color:var(--ink)">A Certificate of Completion from Finsang India is issued when you meet the criteria: minimum <b>${FS.state.criteria.progress}%</b> completion, <b>${FS.state.criteria.score}%</b> assessment score and <b>${FS.state.criteria.attendance}%</b> attendance. Every certificate carries a unique ID verifiable on our <a href="#/verify">verification page</a>.</p></div>
 <div class="blk" id="s-placement"><h2>Placement Assistance</h2><div class="alert w"><b>Placement assistance, not a guarantee.</b> We support you with resume reviews, mock interviews, interview scheduling and access to partner openings. Hiring decisions rest with employers.</div></div>
 <div class="blk" id="s-eligibility"><h2>Eligibility Criteria</h2><ul class="chk">${(p.eligibility||[]).map(t=>`<li>${E(t)}</li>`).join('')}</ul></div>
 <div class="blk" id="s-faq"><h2>Frequently Asked Questions</h2>${faqHtml(p.faqs||[])}</div>
 </div>
 <aside class="side"><div class="card" id="s-apply"><span class="eyebrow">One-time fee</span><div style="font:700 2.4rem 'Playfair Display',serif;color:var(--navy)">${FS.feeText}</div><p style="margin:6px 0 14px">Pay once and unlock <b>all ${FS.programs().length} programs</b>, including ${E(p.name)}.</p><ul class="chk" style="font-size:.9rem;margin-bottom:16px"><li>${p.months}-month guided learning</li><li>Assignments &amp; live project</li><li>Certificate on completion</li><li>Placement assistance</li></ul><button class="btn btn-p btn-block" onclick="A.enroll('${p.id}')">Enroll Now</button></div></aside></div></div></section>`,'#/programs');
});

/* Static pages */
const page=(title,sub,body,active)=>FS.mountPublic(`<section class="ph"><div class="wrap"><h1>${title}</h1><p style="margin-top:8px">${sub}</p></div></section><section class="sec"><div class="wrap" style="max-width:900px">${body}</div></section>`,active);
FS.route('/about',()=>page('About Us','Industry-oriented skill development by Finsang India.',`
 <div class="card"><h3>Who we are</h3><p style="margin:10px 0;color:var(--ink)">${FS.ORGS.finsang.name} runs the Skill Development &amp; Career Launch Program to help students, freshers and graduates build practical skills, gain industry exposure and move toward employment through certification and placement assistance.</p></div>
 <div class="grid g3" style="margin-top:22px">${[['🎯','Mission','Make career-ready skills accessible through practical, mentor-led learning.'],['👁️','Vision','A trusted program management platform linking learners and industry.'],['⚖️','Values','Transparency, practical outcomes and honest placement communication.']].map(x=>`<div class="card"><div style="font-size:1.8rem">${x[0]}</div><h3 style="margin:8px 0">${x[1]}</h3><p style="font-size:.9rem">${x[2]}</p></div>`).join('')}</div>
 <h2 style="margin:36px 0 16px">How the program is run</h2><div class="grid g2">${Object.keys(FS.ORGS).map(k=>`<div class="card flat">${FS.logoOrg(k)}<p style="margin-top:10px;font-size:.9rem">${FS.ORGS[k].role}</p></div>`).join('')}</div>`,'#/about'));
FS.route('/partners',()=>FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Partners &amp; Industry Collaborators</h1><p style="margin-top:8px">Finsang leads the program; GrainZap and Growth Digital contribute practical industry expertise.</p></div></section><section class="sec"><div class="wrap">${partnerCards()}
 <div class="alert" style="margin-top:28px">Partner marks shown here are monograms. Official brand assets can be added by the administrator.</div>
 <h2 style="margin:30px 0 14px">Who contributes what</h2><div class="card tw"><table class="tbl"><tr><th>Area</th><th>Finsang</th><th>GrainZap</th><th>Growth Digital</th></tr>
 ${[['Curriculum & governance','●','○','○'],['Technology / software projects','○','●','○'],['Marketing, sales & e-commerce exposure','○','○','●'],['Mentorship & industry sessions','●','●','●'],['Certification','●','','' ],['Placement assistance','●','●','●']].map(r=>`<tr><td><b>${r[0]}</b></td>${r.slice(1).map(c=>`<td>${c==='●'?'<span class="tag g">Lead</span>':c==='○'?'<span class="tag m">Support</span>':'—'}</td>`).join('')}</tr>`).join('')}</table></div></div></section>`,'#/partners'));
FS.route('/contact',()=>{const st=FS.state.site;page('Contact Us','We usually reply within 2 working days.',`<div class="grid g2"><div class="card"><h3>Send a message</h3><form onsubmit="return A.contact(event)" style="margin-top:14px"><div class="fg"><label>Name</label><input name="name" required maxlength="120"></div><div class="fg"><label>Email</label><input name="email" type="email" required></div><div class="fg"><label>Message</label><textarea name="message" required maxlength="3000"></textarea></div><button class="btn btn-p">Send Message</button></form></div>
 <div class="card"><h3>Get in touch</h3><p style="margin:12px 0"><b>${FS.ORGS.finsang.name}</b><br>Address: ${E(st.address)}<br>Email: ${E(st.email)}<br>Phone: ${E(st.phone)}</p></div></div>`,'#/contact')});
A.contact=async e=>{e.preventDefault();const f=e.target;try{await FS.api('POST','/api/contact',{name:f.name.value,email:f.email.value,message:f.message.value});f.reset();FS.toast('Message sent. Thank you!')}catch(x){FS.err(x)}return false};
FS.route('/faq',()=>page('Frequently Asked Questions','Quick answers about the program.',faqHtml(FS.faqListF().concat(...FS.programs().map(p=>(p.faqs||[]).slice(0,1).map(f=>[p.name+': '+f[0],f[1]])))),'#/faq'));
const legal=(t,items)=>page(t,'Please review these terms periodically.',`<div class="card">${items.map(i=>`<h3 style="margin:16px 0 6px">${i[0]}</h3><p>${i[1]}</p>`).join('')}</div>`);
FS.route('/privacy',()=>legal('Privacy Policy',[['Information we collect','Application details you provide (name, contact, education, resume) and learning activity within the portal.'],['How we use it','To process admissions, deliver the program, issue certificates and assist with placements.'],['Sharing','Application data may be shared with program partners only for program delivery and placement assistance, with your consent.'],['Your choices','You may request access, correction or deletion by contacting us.']]));
FS.route('/terms',()=>legal('Terms & Conditions',[['Eligibility','Admission is subject to review and approval by Finsang India.'],['Certification','Certificates are issued only on meeting published completion criteria and can be verified by ID.'],['Placement assistance','Placement support is assistance only. Employment is not guaranteed.'],['Conduct','Learners must submit original work and follow program guidelines.']]));
