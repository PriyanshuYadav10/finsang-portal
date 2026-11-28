/* Public website pages */
const E=FS.esc;
FS.programCard=p=>`<div class="card pc"><div class="top"><div class="pi" style="background:${p.color}">${p.icon}</div><span class="tag t">${p.cat}</span></div>
<h3>${E(p.name)}</h3><p class="s">${E(p.short)}</p>
<div class="meta"><span class="tag">⏱ ${p.months} months</span><span class="tag g">${p.mode}</span></div>
<div class="lbl">Key skills</div><div class="meta">${(p.skills||[]).slice(0,5).map(s=>`<span class="tag m">${E(s)}</span>`).join('')}</div>
<div class="lbl">Career opportunities</div><p style="font-size:.85rem">${(p.careers||[]).slice(0,3).map(E).join(' · ')}</p>
<div class="lbl">Fee</div><p style="font-size:.85rem"><b>✓ Included in the one-time ${FS.feeText} fee</b> · one of all ${FS.programs().length}+ tracks</p>
<div class="act"><a class="btn btn-o" href="#/programs/${p.id}">View Details</a><a class="btn btn-p" href="#" onclick="A.enroll('${p.id}');return false">Apply Now</a></div></div>`;

/* ---------- editable website content: built-in defaults + admin overrides (Admin -> Website Content) ---------- */
FS.ORGS0=FS.ORGS0||JSON.parse(JSON.stringify(FS.ORGS));
FS.CD=()=>({
 announcement:{enabled:true,text:'🎓 Admissions open for the next batch. Limited seats per program.',cta:'Apply now →'},
 hero:{eyebrow:'Finsang 360° Career Program',title:'Your 3 month guide to a career,',highlight:'or a company.',lead:'One program, 5+ career tracks, {months} months. Structured learning, live projects, mentorship, certification, placement assistance and startup support, by Finsang India with GrainZap IT Solutions and Growtech E-commerce Service.'},
 home:{progTitle:'Learn with a [[curriculum built around real roles]]',progSub:'Learn all 5+ tracks in 3 months. Pick your focus track and see exactly what you will learn, build and be assessed on.',whyTitle:'Everything you need to [[get career‑ready]]',ctaTitle:'Ready to launch your career?',ctaText:'One payment of {fee}. All {count} career tracks, plus startup support. Start learning today.'},
 programsPage:{title:'5+ Career Tracks',sub:'One program, {count} industry-oriented tracks, all taught within {months} months. Search or filter, then choose your focus track.'},
 about:{sub:'Industry-oriented skill development by Finsang India.',intro:'{org} runs the Finsang 360° Career Program to help students, freshers and graduates build practical skills across 5+ tracks, gain industry exposure and move toward a job or a business of their own through certification, placement assistance and startup support.',
  cards:[{icon:'🎯',h:'Mission',p:'Make career-ready skills accessible through practical, mentor-led learning.'},{icon:'👁️',h:'Vision',p:'A trusted program management platform linking learners and industry.'},{icon:'⚖️',h:'Values',p:'Transparency, practical outcomes and honest placement communication.'}]},
 pricing:{title:'One payment. All {count} career tracks.',sub:'',includes:[],note:'one-time fee'},
 partners:Object.keys(FS.ORGS0).map(k=>Object.assign({id:k},FS.ORGS0[k])),
 faqs:[['Is this a guaranteed job program?','No. We provide placement assistance — resume support, mock interviews and access to partner openings. Employment is never guaranteed and depends on your performance and employer decisions.'],
  ['How long is the program?','3 months of guided learning. You learn all 5+ tracks within this time, then finish with a capstone and final evaluation.'],
  ['Do I have to pay for each track?','No. A single one-time fee of {fee} covers all {count} tracks. It is payable after your application is approved.'],
  ['Who can apply?','Students, freshers, graduates and aspiring professionals. Each track lists its own eligibility criteria.'],
  ['Can I learn more than one track?','Yes. All {count} tracks are part of the program and are taught within the {months} months. Your focus track gets extra depth in the final capstone, and you can change it by talking to your mentor early.'],
  ['I want to start a business. Can you help?','Yes. The Founder Sprint gives you mentorship and guidance from idea validation to your first customers. It is mentorship, not funding.'],
  ['How do I get a certificate?','Meet the completion criteria (progress and assessment score). Every certificate has a unique ID that can be verified online.'],
  ['What do I need to join?','A working email and phone number, and a laptop or desktop with a stable internet connection. After approval you can upload your ID and marksheets in My Profile.'],
  ['How does admission work?','Submit the application, receive an application ID, our team reviews it, and once approved you get access to the student dashboard.']],
 contact:{sub:'We usually reply within 2 working days.',hours:'We usually reply within 2 working days',note:'Request a call back and a counsellor will reach out.'},
 legal:{privacy:[['Information we collect','Application details you provide (name, contact, education), documents you upload to your profile, and learning activity within the portal.'],['How we use it','To process admissions, deliver the program, issue certificates and assist with placements.'],['Sharing','Application data may be shared with program partners only for program delivery and placement assistance, with your consent.'],['Your choices','You may request access, correction or deletion by contacting us.']],
  terms:[['Eligibility','Admission is subject to review and approval by Finsang India.'],['Certification','Certificates are issued only on meeting published completion criteria and can be verified by ID.'],['Placement assistance','Placement support is assistance only. Employment is not guaranteed.'],['Conduct','Learners must submit original work and follow program guidelines.']]},
 footer:{about:'The Finsang 360° Career Program: 5+ career tracks, certification, placement assistance and startup support.'}
});
const mergeC=(d,c)=>{if(Array.isArray(d))return Array.isArray(c)&&c.length?c:d;if(d&&typeof d==='object'){const o={};for(const k in d)o[k]=mergeC(d[k],c&&typeof c==='object'?c[k]:undefined);return o}
 if(typeof d==='boolean')return typeof c==='boolean'?c:d;return typeof c==='string'&&c!==''?c:d};
FS.C=()=>mergeC(FS.CD(),FS.state.content||{});
/* rebuild FS.ORGS (partners) from the merged content; the first partner is always "finsang", the organizer */
FS.applyContent=()=>{const ps=FS.C().partners.map(p=>(!p.logo&&FS.ORGS0[p.id]&&FS.ORGS0[p.id].logo)?Object.assign({},p,{logo:FS.ORGS0[p.id].logo,wide:FS.ORGS0[p.id].wide}):p),o={};ps.forEach(p=>{o[p.id]=p});if(!o.finsang)o.finsang=ps[0];FS.ORGS=o};
/* {fee} {count} {months} {org} placeholders and [[highlight]] markup */
FS.fx=t=>{const ps=FS.programs(),mo=ps.map(p=>p.months),mr=mo.length?(Math.min(...mo)===Math.max(...mo)?String(mo[0]):Math.min(...mo)+'–'+Math.max(...mo)):'3–4';
 return String(t==null?'':t).replace(/\{fee\}/g,FS.feeText||'').replace(/\{count\}/g,ps.length+'+').replace(/\{months\}/g,mr).replace(/\{org\}/g,(FS.ORGS.finsang||{}).name||'')};
FS.hl=t=>E(FS.fx(t)).replace(/\[\[(.+?)\]\]/g,'<mark>$1</mark>');
FS.faqListF=()=>FS.C().faqs.map(f=>[FS.fx(f[0]),FS.fx(f[1])]);
const faqHtml=l=>l.map(f=>`<details class="faq"><summary>${E(f[0])}</summary><p>${E(f[1])}</p></details>`).join('');

/* ---------- Home (marketing landing page) ---------- */
FS.stagger=root=>(root||document).querySelectorAll('.stg').forEach(p=>[...p.children].forEach((c,i)=>c.style.setProperty('--i',i)));
FS.reveal=()=>{FS.stagger();const els=[...document.querySelectorAll('.rv')];
 const run=el=>{el.classList.add('in');el.querySelectorAll('[data-count]').forEach(c=>{const to=+c.dataset.count,t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/1200);c.textContent=Math.round(to*(1-Math.pow(1-k,3)))+(c.dataset.suf||'');if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})};
 if(!('IntersectionObserver' in window)){els.forEach(e=>{e.classList.add('in');e.querySelectorAll('[data-count]').forEach(c=>c.textContent=c.dataset.count+(c.dataset.suf||''))});return}
 const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){run(en.target);io.unobserve(en.target)}}),{threshold:0,rootMargin:'0px 0px -6% 0px'});
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
 <div class="fg"><select name="program" required><option value="">Preferred focus track *</option>${FS.programs().map(p=>`<option value="${E(p.id)}">${E(p.name)}</option>`).join('')}<option value="not-sure">Not sure yet</option></select></div></div>
 ${compact?'':`<label class="chk1"><input type="checkbox" required><span>I agree to be contacted about Finsang programs.</span></label>`}
 <button class="btn btn-a btn-block">Request a Call Back <span class="ar">→</span></button></form>`;
A.lead=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button');b.disabled=true;
 const pn=f.program.value==='not-sure'?'Not sure yet':FS.pname(f.program.value);
 try{await FS.api('POST','/api/contact',{name:f.name.value,email:f.email.value,message:`Call-back request\nPhone: ${f.phone.value}\nInterested in: ${pn}`});
  f.innerHTML='<div class="okmsg"><i>✓</i><b>Thank you!</b><span>Our counsellor will call you shortly.</span></div>'}
 catch(x){b.disabled=false;FS.err(x)}return false};
A.leadModal=()=>FS.modal(`<h3 style="margin-bottom:4px">Get free career guidance</h3><p style="margin-bottom:14px">Tell us a little about yourself and we will call you back.</p>${FS.leadForm('leadm',true)}<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn btn-o btn-sm" onclick="FS.closeModal()">Close</button></div>`);
FS.fab=()=>{const d=String(FS.state.site.phone||'').replace(/\D/g,'');const wa=d.length>=10&&/[1-9]/.test(d.slice(-10))?(d.length===10?'91'+d:d):'';
 const ph='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
 return `<div class="fab"><button class="fab-cb" onclick="A.leadModal()" aria-label="Request a call back"><i class="fab-ic">${ph}</i><span class="fab-tip">Request a call back</span></button>${wa?`<a class="fab-wa" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent('Hello, I would like to know more about the Finsang programs.')}" aria-label="Chat on WhatsApp"><svg viewBox="0 0 32 32" width="26" height="26" fill="#fff"><path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.4.7 4.6 1.9 6.5L3.2 29l7.2-2.1c1.8 1 3.9 1.5 5.6 1.5 6.9 0 12.6-5.6 12.6-12.6S22.900 3 16 3zm6.500 17.600c-.3.800-1.700 1.500-2.300 1.600-.6.100-1.300.1-2.100-.1-.5-.2-1.200-.4-2-.8-3.500-1.500-5.800-5-6-5.300-.2-.2-1.400-1.900-1.400-3.600s.9-2.500 1.200-2.900c.3-.3.700-.4.900-.4h.7c.2 0 .5-.1.800.6.300.7 1 2.500 1.100 2.700.1.200.1.400 0 .6-.1.200-.2.400-.4.600l-.6.700c-.2.200-.4.400-.2.800.2.400 1 1.600 2.100 2.600 1.400 1.300 2.600 1.700 3 1.900.4.200.6.200.8-.1.200-.3 1-1.100 1.300-1.500.3-.4.500-.3.900-.2.400.1 2.300 1.100 2.700 1.300.4.200.7.300.8.500.1.200.1.900-.2 1.700z"/></svg><span class="fab-tip">Chat on WhatsApp</span></a>`:''}</div>`};

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
const wv=(t,k0)=>String(t).split(' ').filter(Boolean).map((w,i)=>`<span class="w" style="--k:${k0+i}">${E(w)}</span>`).join(' ');
FS.wave=(fill,flip)=>`<svg class="wave ${flip?'fl':''}" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path fill="${fill}" d="M0 40C180 80 360 0 540 28s360 52 540 20 270-34 360-8V80H0z"/></svg>`;

/* "Why Finsang" pop-ups: every figure comes from the live program data */
FS.whyDetail=i=>{const ps=FS.programs(),C=FS.state.criteria,ks=Object.keys(FS.ORGS),n=ps.length,
 sum=(f)=>ps.reduce((a,p)=>a+f(p),0),mods=sum(p=>(p.modules||[]).length),vids=sum(p=>(p.modules||[]).reduce((m,x)=>m+(x.videos||[]).length,0)),asg=sum(p=>(p.assignments||[]).length),qn=sum(p=>(p.quiz||[]).length),pap=sum(p=>(p.papers||[]).length);
 const L=a=>`<ul class="chk">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 const T=(t,b)=>`<div class="wy-s"><h4>${t}</h4>${b}</div>`;
 const D=[
 {t:'3 Months, 5+ Tracks',ic:'🗓️',lead:`One program, ${n}+ career tracks, about 3 months. Every track is structured the same way, so you always know what is next.`,
  body:T('How it works',L(['Each track is organised into modules of video lessons, notes and templates','Five sprints per track, each followed by a practice quiz','Weekly assessments, a mock test and a final evaluation','Month-wise roadmap: Foundation, Intermediate Learning, then Implementation &amp; Career Prep']))+
   T('The '+n+'+ tracks',`<div class="wy-g">${ps.map(p=>`<a class="wy-c" href="#/programs/${E(p.id)}" onclick="FS.closeModal()"><i>${E(p.icon)}</i><div><b>${E(p.name)}</b><small>${(p.modules||[]).length} modules · ${p.months} months</small></div></a>`).join('')}</div>`)+
   T('One fee, every track',`<p>Your single ${E(FS.feeText)} fee unlocks all ${n} tracks. You choose a focus track that shapes your capstone, and you can change it later by talking to your mentor early.</p>`),
  cta:['View all programs','#/programs']},
 {t:'Industry-Oriented Curriculum',ic:'🏭',lead:'The curriculum is shaped around real job roles, with input from our technology and e-commerce partners.',
  body:T('What is in it',L([`${mods} modules across ${n} tracks`,`${vids} video lessons with notes, cheat sheets and templates`,`${qn} practice questions and ${pap} sample, previous and mock papers`,'Each track ends with career preparation: resume template, portfolio and mock interviews']))+
   T('Built with partners',`<div class="wy-g">${ks.map(k=>{const o=FS.ORGS[k];return `<div class="wy-c"><i style="background:${E(o.color)};color:#fff;font-style:normal;font-weight:800">${E(o.mono||(o.short||'?')[0])}</i><div><b>${E(o.short||o.name)}</b><small>${E(o.role)}</small></div></div>`}).join('')}</div>`)+
   T('Roles it prepares you for',`<p>${ps.map(p=>E((p.careers||[]).slice(0,2).join(', '))).filter(Boolean).join('; ')}. <span class="hint">Illustrative roles; actual outcomes depend on individual performance and employers.</span></p>`),
  cta:['See the curriculum','#/programs']},
 {t:'Practical Projects & Assignments',ic:'🛠️',lead:'You learn by building. Every track has assignments you submit for mentor feedback, and a live project at the end.',
  body:T('Assignments',L([`${asg} assignments across the ${n} tracks, each with clear instructions and marks`,'Submit a file or a link, and receive marks plus written feedback','Examples: '+ps.slice(0,3).map(p=>E(((p.assignments||[])[0]||{}).title||'')).filter(Boolean).join(', ')]))+
   T('Live project',`<p>Each track finishes with a live project built against a brief shaped with a partner, reviewed by mentors and presented at the end. For example:</p><div class="wy-q">${E((ps[0]||{}).live||'')}</div>`)+
   T('How you are assessed',L(['Weekly quizzes and a mock test','Mentor-reviewed assignments','Live project evaluation','Final practical assessment'])),
  cta:['Explore the tracks','#/programs']},
 {t:'Industry Mentorship',ic:'🧭',lead:'You are not learning alone. Trainers and partner mentors review your work and guide your progress.',
  body:T('What mentors do',L(['Review and mark your assignments with written feedback','Guide your live project through sprint demos and reviews','Run industry sessions and open Q&amp;A with partner mentors','Help you choose a focus track and plan your portfolio','Support your career preparation, including mock interviews']))+
   T('Partner expertise',L(ks.map(k=>{const o=FS.ORGS[k];return `<b>${E(o.short||o.name)}</b>: ${E((o.contrib||[])[0]||o.role)}`}))),
  cta:['Contact admissions','#/contact']},
 {t:'Verifiable Certificates',ic:'🏅',lead:'Finish the program and earn a certificate with a unique ID that anyone can check online.',
  body:T('How you qualify',`<div class="wy-k"><div><b>${C.progress}%</b><span>lessons completed</span></div><div><b>${C.score}%</b><span>average assessment score</span></div></div><p class="hint">These are the current completion criteria. Your dashboard shows your live progress against each.</p>`)+
   T('Why it is trustworthy',L(['Every certificate carries a unique ID (for example FSC-2026-0001)','Employers and colleges can verify it on our verification page','Issued only after the criteria are met and reviewed by our team'])),
  cta:['Verify a certificate','#/verify']},
 {t:'Placement & Startup Support',ic:'💼',lead:'Career support is built into the program, whether you want a job or want to start your own business.',
  body:T('Placement assistance',L(['Resume templates and reviews for every track','Mock interviews and career preparation','Access to openings from Finsang and partners, with one-click applications','Interview scheduling and application tracking in your dashboard']))+
   T('Founder Sprint, for future founders',L(['A structured path from idea to first customers, running alongside your tracks','Validate, model, build, then launch and pitch, with mentors','Real assets: validated idea, business model, brand basics, first product scope, launch plan and pitch deck']))+
   `<div class="alert w" style="margin-top:6px"><b>Placement assistance, not a guarantee.</b> Hiring decisions rest with employers. Startup support is mentorship and guidance, not funding.</div>`,
  cta:['See the Founder Sprint','#/founder']}];
 return D[i]};
A.why=i=>{const d=FS.whyDetail(i);if(!d)return;
 FS.modal(`<div class="wy"><div class="wy-h"><i>${d.ic}</i><div><span class="pill">Why Finsang</span><h3>${E(d.t)}</h3></div></div><p class="wy-l">${d.lead}</p>${d.body}
 <div class="row wy-a"><a class="btn btn-a" href="${d.cta[1]}" onclick="FS.closeModal()">${E(d.cta[0])} <span class="ar">→</span></a><button class="btn btn-o" onclick="A.enroll();">Apply now</button></div></div>`,true);
 FS.fixLinks(document.getElementById('modal'))};
FS.route('/',()=>{
 const progs=FS.programs(),cats=[...new Set(progs.map(p=>p.cat))];
 const lessons=progs.reduce((n,p)=>n+(p.modules||[]).reduce((m,x)=>m+(x.videos||[]).length,0),0),qn=progs.reduce((n,p)=>n+(p.quiz||[]).length,0);
 const mo=progs.map(p=>p.months),mr=mo.length?(Math.min(...mo)===Math.max(...mo)?String(mo[0]):Math.min(...mo)+'–'+Math.max(...mo)):'3–4';
 const skills=[...new Set(progs.flatMap(p=>p.skills||[]))];const half=Math.ceil(skills.length/2),r1=skills.slice(0,half),r2=skills.slice(half);
 const hl=[['🗓️','3 Months, 5+ Tracks','Five sprints per track, each followed by a practice quiz, keep you on track from day one.'],['🏭','Industry-Oriented Curriculum','Built with input from our technology and e-commerce partners.'],['🛠️','Practical Projects & Assignments','Learn by building: assignments and live project briefs.'],['🧭','Industry Mentorship','Guided by trainers and partner mentors.'],['🏅','Verifiable Certificates','A unique certificate ID anyone can verify, on meeting completion criteria.'],['💼','Placement & Startup Support','Resume, mock interviews, partner openings and the Founder Sprint. Not a job guarantee.']];
 const steps=[['Explore','Browse the 5+ tracks and pick your focus'],['Apply','Submit your application'],['Get Approved','Our team reviews and approves'],['Learn & Build','Modules, videos, assignments, projects'],['Certify & Launch','Assessments, certificate, placement or startup support']];
 const meth=[['📖','Learn','Recorded videos, live classes, notes and reference guides.'],['✍️','Practice','Quizzes, topic tests and guided exercises every week.'],['🔨','Build','Assignments and a team live project with mentor reviews.'],['📊','Assess','Weekly assessments, mock tests and a final evaluation.'],['🚀','Launch','Portfolio, mock interviews and placement assistance.']];
 const C=FS.C(),H=C.hero,P=C.pricing,N=C.announcement;
 let ann='';try{ann=(!N.enabled||!N.text||sessionStorage.getItem('fs_ann'))?'':`<div class="annc" id="annc"><span>${E(FS.fx(N.text))}</span>${N.cta?`<a href="#" onclick="A.enroll();return false">${E(N.cta)}</a>`:''}<button onclick="A.annClose()" aria-label="Close">×</button></div>`}catch(e){}
 const st=(n,l,suf)=>`<div class="hs"><b data-count="${n}" data-suf="${suf||''}">0${suf||''}</b><span>${l}</span></div>`;
 const fl=(n,step)=>Math.floor(n/step)*step;
 const chip=s=>`<span>${E(s)}</span>`;
 FS.mountPublic(`${ann}
 <section class="hx2"><div class="mesh" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap hx2-in"><div class="hx2-l">
   <span class="pill">✦ ${E(H.eyebrow)}</span>
   <h1>${wv(H.title,0)} <em class="hl">${wv(H.highlight,String(H.title).split(' ').filter(Boolean).length)}</em></h1>
   <p class="lead">${E(FS.fx(H.lead))}</p>
   <div class="leadc"><h3>Get professional guidance!</h3>${FS.leadForm('leadh')}</div>
   <div class="hx-ctas"><a href="#" onclick="A.enroll();return false" class="btn btn-p">Enroll Now <span class="ar">→</span></a><a href="#/programs" class="btn btn-o">Explore programs</a></div></div>
   <div class="hx2-r" aria-hidden="true"><div class="arch"><img src="img/logo.png" alt=""></div><div class="orbit r1"></div><div class="orbit r2"></div>
    <div class="fcw" style="--d:26;left:-2%;top:9%"><div class="fc"><b>My Learning Progress</b><small>Sample · Software Development, Month 2</small>${FS.bar(62)}<div class="row sp-b" style="font-size:.75rem;color:var(--mut)"><span>12 of 18 lessons</span><span>62%</span></div></div></div>
    <div class="fcw" style="--d:-34;right:-4%;top:30%"><div class="fc fc-d"><b>📝 Next assessment</b><small>Month 2 MCQ test · Friday</small></div></div>
    <div class="fcw" style="--d:22;left:2%;bottom:15%"><div class="fc"><b>🏅 Certificate</b><small>Unique, verifiable ID</small></div></div>
    <div class="fcw" style="--d:-18;right:2%;bottom:3%"><div class="fc fc-c"><span>Figma</span><span>React</span><span>SEO</span><span>CRM</span></div></div></div></div>
  <div class="wrap hx2-b rv"><div class="feat"><span>✓ Verifiable certificate</span><span>✓ Live projects</span><span>✓ Mentor support</span><span>✓ Placement assistance*</span></div>
   <div class="stats2">${st(progs.length,'Career tracks','+')}<div class="hs"><b>${mr}</b><span>Months of learning</span></div>${st(fl(lessons,10),'Video lessons','+')}${st(fl(qn,5),'Practice questions','+')}${st(Object.keys(FS.ORGS).length,'Industry partners')}</div></div></section>

 <section class="sec dk2"><div class="wave-t">${FS.wave('#f5f4ef',1)}</div><div class="wrap rv"><div class="sec-head"><span class="pill dk">Skills you will build</span><h2>Hands-on skills across <mark>5+ career tracks</mark></h2><p>From coding and design to marketing, sales and e-commerce.</p></div></div>
  <div class="mq"><div class="mt">${[...r1,...r1].map(chip).join('')}</div></div><div class="mq rev"><div class="mt">${[...r2,...r2].map(chip).join('')}</div></div><div class="wave-b">${FS.wave('#f5f4ef')}</div></section>

 <section class="sec" id="programs"><div class="wrap rv"><div class="sec-head"><span class="pill">Featured programs</span><h2>${FS.hl(C.home.progTitle)}</h2><p>${E(FS.fx(C.home.progSub))}</p></div>
  <div class="ptabs"><button class="on" data-c="" onclick="A.homeCat('')">All programs</button>${cats.map(c=>`<button data-c="${E(c)}" onclick="A.homeCat(this.dataset.c)">${E(c)}</button>`).join('')}</div>
  <div class="grid g3 stg pgrid" id="pgrid">${progs.map(FS.programCard).join('')}</div><div style="text-align:center;margin-top:34px"><a href="#/programs" class="btn btn-o">View all programs <span class="ar">→</span></a></div></div></section>

 <section class="sec qzs"><div class="grid-bg"></div><div class="wrap rv qz-in"><div class="qz-l"><span class="pill dk">Program finder</span><h2>Unsure which program fits you?</h2><p>Take our 2-question quiz and we will point you to a track.</p><div id="quiz" class="quiz"></div></div>
  <div class="qz-r" aria-hidden="true"><div class="arch sm"><span>🎯</span></div><div class="orbit r1"></div></div></div></section>

 <section class="sec alt"><div class="wrap rv"><div class="sec-head"><span class="pill">Why Finsang</span><h2>${FS.hl(C.home.whyTitle)}</h2></div>
  <div class="bento stg">${hl.map((h,i)=>`<div class="bn ${i===0?'big':''}" role="button" tabindex="0" onclick="A.why(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();A.why(${i})}"><i>${h[0]}</i><h3>${h[1]}</h3><p>${h[2]}</p><span class="bn-m">Learn more <b>→</b></span></div>`).join('')}</div></div></section>

 <section class="sec"><div class="wrap rv"><div class="sec-head"><span class="pill">How it works</span><h2>Your journey from <mark>application to career</mark></h2></div>
  <div class="tl stg">${steps.map((s,i)=>`<div class="tl-s"><div class="n">${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div></div></section>

 <section class="sec dk2 meths"><div class="wave-t">${FS.wave('#f5f4ef',1)}</div><div class="grid-bg"></div><div class="wrap rv"><div class="sec-head"><span class="pill dk">Learning methodology</span><h2>Learn → Practice → Build → Assess → <mark>Launch</mark></h2></div>
  <div class="mgrid stg">${meth.map((m,i)=>`<div class="mcard"><b class="mn">0${i+1}</b><div class="mi">${m[0]}</div><h3>${m[1]}</h3><p>${m[2]}</p></div>`).join('')}</div></div><div class="wave-b">${FS.wave('#f5f4ef')}</div></section>

 <section class="sec" style="padding-top:0"><div class="wrap rv"><div class="cta-band"><i class="o1"></i><i class="o2"></i><h2>Want to start a business instead?</h2><p>Join the Founder Sprint: a mentor-guided path from idea to first customers, running alongside your 5+ tracks.</p><div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap"><a href="#/founder" class="btn btn-a">Explore the Founder Sprint <span class="ar">→</span></a></div></div></div></section>
 <section class="sec"><div class="wrap rv"><div class="sec-head"><span class="pill">Partners &amp; industry collaborators</span><h2>One program, <mark>three organizations</mark></h2></div>${partnerCards()}<div style="text-align:center;margin-top:30px"><a href="#/partners" class="btn btn-o">Learn about our partners <span class="ar">→</span></a></div></div></section>
 <section class="sec alt"><div class="wrap rv" style="max-width:820px"><div class="sec-head"><span class="pill">FAQs</span><h2>Frequently asked <mark>questions</mark></h2></div>${faqHtml(FS.faqListF().slice(0,5))}<p style="text-align:center;margin-top:8px"><a href="#/faq">See all FAQs →</a></p></div></section>
 <section class="sec"><div class="wrap rv"><div class="price"><div><span class="pill dk">Simple pricing</span><h2>${E(FS.fx(P.title))}</h2>${P.sub?`<p style="margin:8px 0">${E(FS.fx(P.sub))}</p>`:''}<ul>${(P.includes.length?P.includes.map(FS.fx):[...progs.map(p=>p.name),'Certificate & placement assistance']).map(x=>`<li>${E(x)}</li>`).join('')}</ul></div><div style="text-align:center"><div class="amt">${FS.feeText}</div><p style="margin:6px 0 16px">${E(FS.fx(P.note))}</p><button class="btn btn-a" onclick="A.enroll()">Enroll Now <span class="ar">→</span></button></div></div></div></section>
 <section class="sec" style="padding-top:0"><div class="wrap rv"><div class="cta-band"><i class="o1"></i><i class="o2"></i><h2>${E(FS.fx(C.home.ctaTitle))}</h2><p>${E(FS.fx(C.home.ctaText))}</p><div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap"><a href="#" onclick="A.enroll();return false" class="btn btn-a">Enroll Now <span class="ar">→</span></a><a href="#" onclick="A.leadModal();return false" class="btn btn-w">Talk to a counsellor</a></div></div><p class="hint" style="text-align:center;margin-top:16px">*Placement assistance means resume support, mock interviews and access to partner openings. It is not a guarantee of employment.</p></div></section>`,'#/');
 A.qz();FS.reveal();FS.chrome();
});
function partnerCards(){return `<div class="grid g3 stg">${Object.keys(FS.ORGS).map(k=>{const o=FS.ORGS[k];return `<div class="card" style="border-top:4px solid ${E(o.color)}">${FS.logoOrg(k,true)}<div class="hint" style="margin-top:8px">${E(o.name)}</div><span class="tag m" style="margin:12px 0 8px;display:block;width:fit-content">${E(o.role)}</span><p style="font-size:.9rem;margin-bottom:12px">${E(o.desc)}</p><ul class="chk" style="font-size:.88rem">${(o.contrib||[]).map(c=>`<li>${E(c)}</li>`).join('')}</ul></div>`}).join('')}</div>`}

/* Programs listing with search & filters */
FS.route('/programs',()=>{
 const f=FS.ui.pf||(FS.ui.pf={q:'',cat:'',dur:'',mode:''});
 const all=FS.programs();const list=all.filter(p=>(!f.q||(p.name+p.short+p.skills.join(' ')).toLowerCase().includes(f.q.toLowerCase()))&&(!f.cat||p.cat===f.cat)&&(!f.dur||String(p.months)===f.dur)&&(!f.mode||p.mode===f.mode));
 const opt=(arr,v)=>arr.map(a=>`<option ${v===String(a)?'selected':''}>${a}</option>`).join('');
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>${E(FS.fx(FS.C().programsPage.title))}</h1><p style="margin-top:8px">${E(FS.fx(FS.C().programsPage.sub))}</p></div></section>
 <section class="sec" style="padding-top:36px"><div class="wrap"><div class="alert s" style="margin-bottom:18px"><b>One fee, all ${all.length}+ tracks.</b> Your single ${FS.feeText} payment unlocks every track below. The focus track you choose only shapes your final capstone, and you can change it later.</div><div class="filters">
 <input id="pq" placeholder="🔍 Search programs or skills…" value="${E(f.q)}" oninput="A.pf('q',this.value)">
 <select onchange="A.pf('cat',this.value)"><option value="">All categories</option>${opt([...new Set(all.map(p=>p.cat))],f.cat)}</select>
 <select onchange="A.pf('dur',this.value)"><option value="">Any duration</option>${[...new Set(all.map(p=>p.months))].sort().map(m=>`<option value="${m}" ${f.dur==m?'selected':''}>${m} months</option>`).join('')}</select>
 
 <button class="btn btn-o" onclick="A.pfReset()">Reset</button></div>
 <p class="hint" style="margin-bottom:16px">${list.length} program${list.length!==1?'s':''} found</p>
 <div class="grid g3 pgrid">${list.map(FS.programCard).join('')||'<div class="empty card" style="grid-column:1/-1">No programs match your filters.</div>'}</div></div></section>${FS.focusGuide()}`,'#/programs');
 const i=document.getElementById('pq');if(i&&FS.ui.focusq){i.focus();i.setSelectionRange(i.value.length,i.value.length)}
});
A.pf=(k,v)=>{FS.ui.pf[k]=v;FS.ui.focusq=k==='q';FS.render(true);FS.ui.focusq=false};
A.pfReset=()=>{FS.ui.pf={q:'',cat:'',dur:'',mode:''};FS.render(true)};

/* Program details */
FS.applyForm=pid=>`<form onsubmit="return A.apply(event)" id="appf" class="appf">
 <fieldset><legend><i>1</i>Personal details</legend>
 <div class="frow"><div class="fg"><label>Full name *</label><input name="name" required autocomplete="name"></div><div class="fg"><label>Email address *</label><input name="email" type="email" required autocomplete="email"></div></div>
 <div class="frow"><div class="fg"><label>Mobile number *</label><input name="phone" type="tel" required pattern="[0-9+\\- ]{10,15}" title="Enter a valid mobile number" autocomplete="tel"></div><div class="fg"><label>City *</label><input name="city" required autocomplete="address-level2"></div></div></fieldset>
 <fieldset><legend><i>2</i>Education</legend>
 <div class="frow"><div class="fg"><label id="lbl-inst">College / university *</label><input name="college" id="inp-inst" required autocomplete="organization"></div><div class="fg"><label>Qualification *</label><select name="qualification" required onchange="A.qualChange(this.value)"><option value="">Select</option><option>12th Pass</option><option>Diploma</option><option>B.Tech / B.E.</option><option>BCA / MCA</option><option>B.Com / M.Com</option><option>BBA / MBA</option><option>BA / MA</option><option>B.Sc / M.Sc</option><option>Other</option></select></div></div>
 <div class="frow"><div class="fg"><label id="lbl-year">Graduation year *</label><input name="year" id="inp-year" inputmode="numeric" required list="yrlist" placeholder="Type or pick a year" pattern="(19|20)[0-9]{2}" title="Enter a 4-digit year, for example 2026" autocomplete="off"><datalist id="yrlist">${(()=>{const y=new Date().getFullYear(),o=[];for(let i=y+8;i>=y-40;i--)o.push(`<option value="${i}">`);return o.join('')})()}</datalist></div>
 <div class="fg"><label>Focus track *</label><select name="program" required>${FS.programs().map(p=>`<option value="${p.id}" ${p.id===pid?'selected':''}>${E(p.name)}</option>`).join('')}</select><span class="hint">All 5+ tracks are included in your fee.</span></div></div></fieldset>
 <fieldset><legend><i>3</i>Account</legend>
 <div class="fg"><label>Create password *</label><input name="pass" type="password" minlength="8" required autocomplete="new-password"><span class="hint">At least 8 characters. You will use it to log in after approval.</span></div>
 <div class="fg"><label>Anything else we should know?</label><textarea name="info" rows="3" placeholder="For example: your goals, or a business idea you want to build"></textarea></div></fieldset>
 <label class="agree"><input type="checkbox" required><span>I agree to the <a href="#/terms" target="_blank">Terms</a> and <a href="#/privacy" target="_blank">Privacy Policy</a>.</span></label>
 <button class="btn btn-a btn-block ax-btn">Submit application <span class="ar">→</span></button></form>`;
A.qualChange=q=>{const school=/^(10th|12th)/i.test(q),l=document.getElementById('lbl-inst'),i=document.getElementById('inp-inst'),y=document.getElementById('lbl-year');
 if(l)l.textContent=school?'School *':'College / university *';if(i)i.placeholder=school?'Name of your school':'';if(y)y.textContent=school?'Year of passing *':'Graduation year *'};
A.apply=async e=>{e.preventDefault();const form=e.target,btn=form.querySelector('.ax-btn');const fd=new FormData(form);const f=Object.fromEntries(fd.entries());
 f.email=f.email.trim().toLowerCase();f.password=f.pass;delete f.pass;delete f.resume;btn.disabled=true;
 try{
  const r=await FS.api('POST','/api/apply',f);
  FS.modal(`<h3>✅ Application submitted</h3><p>Your application ID is <b style="color:var(--navy);font-size:1.2rem">${E(r.id)}</b>. Save it to track your status.</p><p style="margin:10px 0 18px">Next: our team reviews your application. Once approved, you can log in to your dashboard with the email and password you just chose.</p><div class="row"><a class="btn btn-p" href="#/track?id=${E(r.id)}&email=${encodeURIComponent(f.email)}">Track Application</a><button class="btn btn-o" onclick="FS.closeModal()">Close</button></div>`);
  form.reset();
 }catch(x){FS.err(x)}finally{btn.disabled=false}
 return false};

/* assessment weights parsed from the program's published methodology, e.g. "Assignments & code reviews (30%)" */
FS.weights=p=>(p.assess||[]).map(t=>{const m=/^(.*?)\s*\((\d+(?:\.\d+)?)%\)\s*$/.exec(String(t));return m?{n:m[1],w:+m[2]}:null}).filter(Boolean);
FS.asgWeight=p=>{const w=FS.weights(p).find(x=>/assign|campaign|task/i.test(x.n));return w?w.w:0};
const fmtN=n=>String(Math.round(n*100)/100);
FS.route('/programs/([\\w-]+)',([id])=>{
 const p=FS.program(id);if(!p){FS.go('#/programs');return}
 const o=FS.ORGS[p.partner]||FS.ORGS.finsang;const roadmap=p.roadmap||[];
 const titles=['Foundation','Intermediate Learning','Practical Implementation','Career Preparation'];
 const sec=[['overview','Overview'],['outcomes','Outcomes'],['curriculum','Curriculum'],['roadmap','Roadmap'],['assignments','Assignments'],['project','Live Project'],['assessment','Assessment'],['careers','Careers'],['certification','Certification'],['placement','Placement'],['eligibility','Eligibility'],['faq','FAQ']];
 FS.mountPublic(`<section class="ph pd"><div class="wrap ph-l"><div class="crumb"><a href="#/">Home</a> / <a href="#/programs">Programs</a> / ${E(p.name)}</div>
 <div class="pd-g"><div class="pd-l"><div class="pd-t"><div class="pd-i" style="background:${p.color}">${p.icon}</div><div><span class="pd-k">Track · ${E(p.cat)}</span><h1>${E(p.name)}</h1></div></div>
  <p class="pd-s">${E(p.short)}</p>
  <div class="pd-b"><a class="btn btn-a" href="#" onclick="A.enroll('${p.id}');return false">Apply for All ${FS.programs().length}+ Tracks</a><a class="btn btn-w" href="#/programs">All Programs</a></div></div>
  <div class="pd-f"><div><span>Duration</span><b>${p.months} months</b></div><div><span>Mode</span><b>${E(p.mode)}</b></div><div><span>Fee</span><b>Included in ${FS.feeText}</b></div></div></div></div></section>
 <section class="sec" style="padding-top:20px"><div class="wrap"><div class="subnav">${sec.map(s=>`<a href="#" onclick="return A.go('s-${s[0]}')">${s[1]}</a>`).join('')}</div>
 <div class="pl"><div>
 <div class="blk" id="s-overview"><h2>Overview</h2><p style="color:var(--ink)">${E(p.overview||p.short)}</p><div class="card flat" style="margin-top:16px;background:#faf8f1"><b>What you'll cover</b><ul class="chk" style="margin-top:8px;columns:2;column-gap:24px">${p.topics.map(t=>`<li>${E(t)}</li>`).join('')}</ul></div></div>
 <div class="blk" id="s-outcomes"><h2>Learning Outcomes</h2><ul class="chk">${(p.outcomes||[]).map(t=>`<li>${E(t)}</li>`).join('')}</ul></div>
 <div class="blk" id="s-curriculum"><h2>Detailed Curriculum</h2>${FS.modules(p.id).map((m,i)=>`<details class="acc" ${i===0?'open':''}><summary>Module ${i+1}: ${E(m.title)}</summary><div><b>Lessons</b><ul class="chk">${m.vids.map(v=>`<li>${E(v.title)}</li>`).join('')||'<li>Content coming soon</li>'}</ul></div></details>`).join('')}</div>
 <div class="blk" id="s-roadmap"><h2>Month-wise Learning Roadmap</h2><div class="rmap">${roadmap.map((m,i)=>`<div class="m"><h3>Month ${i+1} — ${i===roadmap.length-1&&roadmap.length===3?'Implementation & Career Prep':titles[i]}</h3><ul class="chk" style="margin-top:6px">${m.map(x=>`<li>${E(x)}</li>`).join('')}</ul></div>`).join('')||'<p>Roadmap will be published soon.</p>'}</div></div>
 <div class="blk" id="s-assignments"><h2>Practical Assignments</h2>${(()=>{const as=p.assignments||[],tot=as.reduce((a,x)=>a+(+x.marks||0),0),aw=FS.asgWeight(p);
  const sh=m=>aw&&tot?`<span class="tag t">${fmtN(m/tot*aw)}% of final score</span>`:'';
  return `<div class="mk-sum"><div><b>${tot}</b><span>total marks</span></div><div><b>${as.length}</b><span>assignments</span></div>${aw?`<div><b>${aw}%</b><span>of your final score</span></div>`:''}</div>
  <div class="grid g2">${as.map(a=>`<div class="card flat"><b>${E(a.title)}</b><p style="font-size:.9rem;margin-top:4px">${E(a.desc)}</p><div class="mk-r"><span class="tag a">${a.marks} / ${tot} marks</span>${sh(a.marks)}</div><div class="bar" style="margin-top:10px"><i style="width:${tot?Math.round(a.marks/tot*100):0}%"></i></div></div>`).join('')}</div>${aw?`<p class="hint" style="margin-top:12px">How it is calculated: each assignment's share of the ${tot} total marks, multiplied by the ${aw}% that assignments carry in your final score.</p>`:''}`})()}</div>
 <div class="blk" id="s-project"><h2>Live Project</h2><div class="lp" style="--pc:${E(o.color)}"><p class="lp-t">${E(p.live||'')}</p><div class="lp-p"><span>Project partner</span>${FS.orgCard(p.partner)}</div></div></div>
 <div class="blk" id="s-assessment"><h2>Assessment Methodology</h2>${(()=>{const W=FS.weights(p),sum=W.reduce((a,x)=>a+x.w,0);
  return W.length&&sum===100?`<div class="wt-bar">${W.map((x,i)=>`<i class="w${i}" style="flex:${x.w}" title="${E(x.n)} ${x.w}%"></i>`).join('')}</div><div class="wt-l">${W.map((x,i)=>`<div><i class="w${i}"></i><span>${E(x.n)}</span><b>${x.w}%</b></div>`).join('')}<div class="wt-t"><span>Final score</span><b>100%</b></div></div>`:`<ul class="chk">${(p.assess||[]).map(t=>`<li>${E(t)}</li>`).join('')}</ul>`})()}<p style="margin-top:12px">Weekly assessments, a mock test and a final evaluation determine completion and certification eligibility.</p></div>
 <div class="blk" id="s-careers"><h2>Sample Career Opportunities</h2><div class="pill-row">${(p.careers||[]).map(c=>`<span class="tag t" style="font-size:.9rem;padding:8px 14px">${E(c)}</span>`).join('')}</div><p class="hint" style="margin-top:8px">Illustrative roles; actual outcomes depend on individual performance and employers.</p></div>
 <div class="blk" id="s-certification"><h2>Certification</h2><p style="color:var(--ink)">A Certificate of Completion from Finsang India is issued when you meet the criteria: minimum <b>${FS.state.criteria.progress}%</b> completion and <b>${FS.state.criteria.score}%</b> assessment score. Every certificate carries a unique ID verifiable on our <a href="#/verify">verification page</a>.</p></div>
 <div class="blk" id="s-placement"><h2>Placement Assistance</h2><div class="alert w"><b>Placement assistance, not a guarantee.</b> We support you with resume reviews, mock interviews, interview scheduling and access to partner openings. Hiring decisions rest with employers.</div></div>
 <div class="blk" id="s-eligibility"><h2>Eligibility Criteria</h2><ul class="chk">${(p.eligibility||[]).map(t=>`<li>${E(t)}</li>`).join('')}</ul></div>
 <div class="blk" id="s-faq"><h2>Frequently Asked Questions</h2>${faqHtml(p.faqs||[])}</div>
 </div>
 <aside class="side"><div class="card" id="s-apply"><span class="eyebrow">One-time fee</span><div style="font:700 2.4rem 'Playfair Display',serif;color:var(--navy)">${FS.feeText}</div><p style="margin:6px 0 14px">Pay once and unlock <b>all ${FS.programs().length}+ tracks</b>, including ${E(p.name)}.</p><ul class="chk" style="font-size:.9rem;margin-bottom:16px"><li>All ${FS.programs().length} tracks within ${p.months} months</li><li>Assignments &amp; live project</li><li>Certificate on completion</li><li>Placement assistance</li></ul><button class="btn btn-p btn-block" onclick="A.enroll('${p.id}')">Apply for All ${FS.programs().length}+ Tracks</button></div></aside></div></div></section>`,'#/programs');
 FS.spy();
});

/* highlight the matching tab in the program page's section bar while scrolling */
FS.spy=()=>{if(window.__spy){window.removeEventListener('scroll',window.__spy)}
 const nav=document.querySelector('.subnav');if(!nav)return;const links=[...nav.querySelectorAll('a')],ids=links.map(a=>(a.getAttribute('onclick').match(/'(s-[\w]+)'/)||[])[1]);
 window.__spy=()=>{let cur=0;ids.forEach((id,i)=>{const e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<160)cur=i});links.forEach((a,i)=>a.classList.toggle('on',i===cur));const a=links[cur];if(a&&nav.scrollWidth>nav.clientWidth){const l=a.offsetLeft-nav.clientWidth/2+a.offsetWidth/2;nav.scrollTo({left:l,behavior:'auto'})}};
 window.addEventListener('scroll',window.__spy,{passive:true});window.__spy()};
/* Static pages */
const page=(title,sub,body,active,wide)=>FS.mountPublic(`<section class="ph"><div class="wrap"><h1>${title}</h1><p>${sub}</p></div></section><section class="sec"><div class="wrap" style="${wide?'':'max-width:960px'}">${body}</div></section>`,active);
const ctaBand=(h,t,extra)=>`<section class="sec" style="padding-top:0"><div class="wrap"><div class="cta-band"><i class="o1"></i><i class="o2"></i><h2>${h}</h2><p>${t}</p><div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap"><a href="#" onclick="A.enroll();return false" class="btn btn-a">Apply now <span class="ar">→</span></a>${extra||'<a href="#/contact" class="btn btn-w">Contact admissions</a>'}</div></div></div></section>`;
FS.route('/about',()=>{const C=FS.C(),A0=C.about,ps=FS.programs(),ks=Object.keys(FS.ORGS),mo=ps.map(p=>p.months),mr=mo.length?(Math.min(...mo)===Math.max(...mo)?String(mo[0]):Math.min(...mo)+'–'+Math.max(...mo)):'3';
 const meth=[['📖','Learn','Recorded videos, notes and reference guides.'],['✍️','Practice','Quizzes, topic tests and mock papers.'],['🔨','Build','Assignments and a live project with mentor reviews.'],['📊','Assess','Assessments and a final evaluation.'],['🚀','Launch','Portfolio, interview practice and placement assistance*.']];
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>About Us</h1><p>${E(FS.fx(A0.sub))}</p></div></section>
 <section class="sec"><div class="wrap"><div class="ab-split"><div class="rv"><span class="pill">Who we are</span><h2>Practical skills, <mark>real support</mark></h2><p class="ab-p">${E(FS.fx(A0.intro))}</p>
  <ul class="chk"><li>Mentor-led learning with projects, not just lectures</li><li>One fee that covers every track</li><li>Certification you can verify online</li><li>Career guidance, and startup support if you want to build your own business</li></ul></div>
  <div class="ab-facts rv"><div><b>${ps.length}+</b><span>career tracks</span></div><div><b>${E(mr)}</b><span>months of learning</span></div><div><b>${E(FS.feeText)}</b><span>one-time fee</span></div><div><b>${ks.length}</b><span>program organizations</span></div></div></div></div></section>
 <section class="sec alt"><div class="wrap"><div class="sec-head"><span class="pill">What guides us</span><h2>Mission, vision <mark>and values</mark></h2></div><div class="grid g3 stg">${A0.cards.map((x,i)=>`<div class="card ab-c"><span class="ab-n">0${i+1}</span><div class="ab-i">${E(x.icon)}</div><h3>${E(x.h)}</h3><p>${E(x.p)}</p></div>`).join('')}</div></div></section>
 <section class="sec"><div class="wrap"><div class="sec-head"><span class="pill">How learning works</span><h2>Learn → Practice → Build → Assess → <mark>Launch</mark></h2></div><div class="ab-flow stg">${meth.map(m=>`<div class="ab-s"><i>${m[0]}</i><b>${m[1]}</b><span>${m[2]}</span></div>`).join('')}</div><p class="hint" style="text-align:center;margin-top:18px">*Placement assistance means resume support, mock interviews and access to partner openings. It is not a guarantee of employment.</p></div></section>
 <section class="sec alt"><div class="wrap"><div class="sec-head"><span class="pill">Who runs the program</span><h2>${ks.length} organizations, <mark>one program</mark></h2></div><div class="grid g3 stg">${ks.map(k=>{const o=FS.ORGS[k];return `<div class="card" style="border-top:4px solid ${E(o.color)}">${FS.logoOrg(k,true)}<span class="tag m" style="margin:14px 0 8px;display:block;width:fit-content">${E(o.role)}</span><p style="font-size:.92rem">${E(o.desc)}</p></div>`}).join('')}</div><div style="text-align:center;margin-top:24px"><a class="btn btn-o" href="#/partners">Meet our partners <span class="ar">→</span></a></div></div></section>
 ${ctaBand('Ready to start?','One payment of '+E(FS.feeText)+'. All '+ps.length+'+ tracks, plus career and startup support.')}`,'#/about')});
FS.route('/partners',()=>{const ks=Object.keys(FS.ORGS),first=FS.ORGS[ks[0]],rest=ks.slice(1).map(k=>FS.ORGS[k].short||FS.ORGS[k].name);
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Partners &amp; Industry Collaborators</h1><p>${E(first.short||first.name)} leads the program${rest.length?`; ${E(rest.join(' and '))} contribute practical industry expertise`:''}.</p></div></section><section class="sec"><div class="wrap">${partnerCards()}
 <h2 style="margin:44px 0 16px;text-align:center">Who contributes what</h2><div class="card tw"><table class="tbl pt"><tr><th>Partner</th><th>Role</th><th>Contribution</th></tr>
 ${ks.map(k=>{const o=FS.ORGS[k];return `<tr><td><b>${E(o.short||o.name)}</b><br><span class="hint">${E(o.name)}</span></td><td><span class="tag ${k==='finsang'?'g':'m'}">${E(o.role)}</span></td><td><ul class="chk">${(o.contrib||[]).map(c=>`<li>${E(c)}</li>`).join('')}</ul></td></tr>`}).join('')}</table></div></div></section>
 ${ctaBand('Interested in partnering with us?','We work with colleges, training partners and employers. Tell us how you would like to collaborate.')}`,'#/partners')});
/* Choosing a focus track, and how the 5+ tracks combine (shown under the track list) */
FS.focusGuide=()=>{const rows=[['Solving problems with logic and building things people use','Software Development','Developer, QA and tech roles'],['Growing audiences, campaigns, numbers and creative content','Digital Marketing','Marketing and performance roles'],['Understanding people and making products easy and beautiful','UI/UX Designing','Design and product roles'],['Talking to people, negotiating and winning clients','Sales & Business Development','Sales and account roles'],['Selling products online and running a store','E-commerce Management','Marketplace and operations roles']],
 combos=[['Product builder','Software Development + UI/UX Designing: design it, then build it.'],['Online business','E-commerce Management + Digital Marketing: list it, then drive traffic.'],['Growth role','Digital Marketing + Sales & Business Development: generate and close demand.'],['Founder','All 5+ tracks plus the Founder Sprint turn your idea into a business.']];
 return `<section class="sec alt"><div class="wrap"><div class="sec-head"><span class="pill">Pick your focus</span><h2>Choosing your <mark>focus track</mark></h2><p>You learn all 5+ tracks over 3 months. Choose one as your focus: it shapes your final capstone and the portfolio and career preparation you build around it. You can change it later by talking to your mentor early.</p></div>
 <div class="card tw"><table class="tbl"><tr><th>If you enjoy…</th><th>Focus on</th><th>Good for</th></tr>${rows.map(r=>`<tr><td>${E(r[0])}</td><td><b>${E(r[1])}</b></td><td>${E(r[2])}</td></tr>`).join('')}</table></div>
 <h3 style="margin:30px 0 14px;text-align:center">How the 5+ tracks work together</h3><div class="grid g2 stg">${combos.map(c=>`<div class="card flat"><b>${E(c[0])}</b><p style="margin-top:4px;font-size:.92rem">${E(c[1])}</p></div>`).join('')}</div></div></section>`};

/* Founder Sprint: startup support inside the 360° program */
FS.route('/founder',()=>{
 const ph=[['Phase 1 · Weeks 1–3','Validate. Define the problem and your customer; hold at least 10 customer conversations; test whether people will pay.','Problem statement · customer profile · validation scorecard'],['Phase 2 · Weeks 4–6','Model. Shape the business model, pricing and unit costs; scan competitors; choose your name and brand identity.','One-page business model · pricing sheet · brand basics'],['Phase 3 · Weeks 7–9','Build. Scope your first product or service with technology and marketing mentors; create a landing page and outreach plan.','MVP scope · landing page · outreach plan'],['Phase 4 · Weeks 10–12','Launch & pitch. Soft-launch to first customers; run a small campaign; practise your pitch; review compliance and registration steps.','Pitch deck · launch report · compliance checklist · 90-day plan']],
 dl=[['Validated idea','Evidence from real customers that the problem is worth solving.'],['Business model & pricing','A one-page plan covering customers, revenue, costs and pricing.'],['Brand & online presence','A name, simple identity, landing page and social profiles.'],['First product (MVP)','A clearly scoped first version, with technology mentor guidance.'],['Launch plan & first customers','Outreach, campaign and sales steps to win your first users.'],['Pitch & compliance readiness','A pitch deck, plus a checklist of registrations and basics to review.']],
 sup=[['Mentor sessions','Industry mentors from technology, marketing and business'],['Weekly checkpoints','Review your milestone and get unblocked'],['Templates','Interviews, business models, pitches and checklists'],['Practice','Pitching, sales calls and customer discovery'],['Career guidance','A safety net if you decide to take a job first'],['Feedback','On your pitch, pricing and launch plan from mentors']];
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>The Founder Sprint</h1><p style="margin-top:8px">Want to start a business instead of, or alongside, a job? A structured, mentor-guided path from idea to first customers, running in parallel with your 5+ tracks running in parallel with your 5+ tracks</p></div></section>
 <section class="sec"><div class="wrap"><div class="sec-head"><span class="pill">12 weeks</span><h2>From idea to <mark>first customers</mark></h2></div>
 <div class="card tw"><table class="tbl"><tr><th>When</th><th>Milestone</th><th>You produce</th></tr>${ph.map(r=>`<tr><td><b>${E(r[0])}</b></td><td>${E(r[1])}</td><td>${E(r[2])}</td></tr>`).join('')}</table></div>
 <div class="grid g2 stg" style="margin-top:24px"><div class="card"><h3>Why it works inside the 360° program</h3><p style="margin-top:6px">All 5+ tracks become your startup toolkit: build with Software, brand with Design, promote with Digital Marketing, sell with Sales, and operate online with E-commerce.</p></div><div class="card"><h3>Who should join</h3><ul class="chk" style="margin-top:6px"><li>You have an idea, or want help finding one</li><li>You want to work on your own venture</li><li>You can commit time to customer conversations</li></ul></div></div></div></section>
 <section class="sec alt"><div class="wrap"><div class="sec-head"><span class="pill">What you leave with</span><h2>Real assets you can <mark>show to customers</mark></h2></div>
 <div class="grid g3 stg">${dl.map((d,i)=>`<div class="card"><b style="font-family:'Playfair Display',serif;font-size:1.5rem;color:var(--gold)">0${i+1}</b><h3 style="margin:4px 0 6px">${E(d[0])}</h3><p style="font-size:.92rem">${E(d[1])}</p></div>`).join('')}</div>
 <h3 style="margin:34px 0 14px;text-align:center">How we support you</h3><div class="grid g3 stg">${sup.map(d=>`<div class="card flat"><b>${E(d[0])}</b><p style="margin-top:4px;font-size:.92rem">${E(d[1])}</p></div>`).join('')}</div>
 <div class="alert" style="margin-top:28px"><b>Good to know.</b> Startup support is mentorship and guidance. It does not include investment or funding, and outcomes depend on the founder's effort and market conditions. Legal, tax and registration questions should be confirmed with qualified professionals; we help you know what to ask.</div></div></section>
 <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta-band"><i class="o1"></i><i class="o2"></i><h2>Ready to start?</h2><p>Tell us about your idea when you apply, or speak to the admissions team.</p><div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap"><a href="#" onclick="A.enroll();return false" class="btn btn-a">Apply now <span class="ar">→</span></a><a href="#/contact" class="btn btn-w">Contact admissions</a></div></div></div></section>`,'#/founder')});
FS.route('/contact',()=>{const st=FS.state.site,C=FS.C().contact,tel=String(st.phone||'').replace(/[^\d+]/g,'');
 const row=(i,l,v)=>`<div class="ci"><i>${i}</i><div><b>${l}</b>${v}</div></div>`;
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Contact Us</h1><p>${E(FS.fx(C.sub))}</p></div></section>
 <section class="sec"><div class="wrap"><div class="ct-grid">
  <div class="ct-l">${row('📍','Visit us',`<span>${E(st.address)}</span>${st.address?`<a class="mapl2" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address)}">Open in Maps ↗</a>`:''}`)}
   ${row('✉️','Email us',`<a href="mailto:${E(st.email)}">${E(st.email)}</a>`)}
   ${row('📞','Call us',tel?`<a href="tel:${E(tel)}">${E(st.phone)}</a>`:`<span>${E(st.phone)}</span>`)}
   ${C.hours?row('🕘','Response time',`<span>${E(FS.fx(C.hours))}</span>`):''}
   <div class="ctc-n"><b>Prefer a call?</b><p>${E(FS.fx(C.note))}</p><button class="btn btn-a btn-sm" onclick="A.leadModal()">Request a call back →</button></div></div>
  <div class="card ct-f"><h2>Send us a message</h2><p class="hint" style="margin:4px 0 18px">Questions about the program, fees or admissions? Write to us and we will reply by email.</p>
   <form onsubmit="return A.contact(event)"><div class="frow"><div class="fg"><label>Your name *</label><input name="name" required maxlength="120" autocomplete="name"></div><div class="fg"><label>Email address *</label><input name="email" type="email" required autocomplete="email"></div></div>
   <div class="fg"><label>Message *</label><textarea name="message" rows="6" required maxlength="3000" placeholder="How can we help?"></textarea></div><button class="btn btn-a ax-btn">Send message <span class="ar">→</span></button></form></div>
 </div></div></section>`,'#/contact')});
A.contact=async e=>{e.preventDefault();const f=e.target;try{await FS.api('POST','/api/contact',{name:f.name.value,email:f.email.value,message:f.message.value});f.innerHTML='<div class="okmsg"><i>✓</i><b>Message sent</b><span>Thank you. We will reply by email soon.</span></div>'}catch(x){FS.err(x)}return false};
A.faqFilter=v=>{v=String(v||'').toLowerCase().trim();let n=0;document.querySelectorAll('.fq-list details').forEach(d=>{const m=!v||d.textContent.toLowerCase().includes(v);d.style.display=m?'':'none';if(m)n++});
 document.querySelectorAll('.fq-grp').forEach(g=>{g.style.display=[...g.querySelectorAll('details')].some(d=>d.style.display!=='none')?'':'none'});const e=document.getElementById('fqn');if(e)e.style.display=n?'none':'block'};
FS.route('/faq',()=>{const gen=FS.faqListF(),prog=[].concat(...FS.programs().map(p=>(p.faqs||[]).slice(0,1).map(f=>[p.name+': '+f[0],f[1]])));const st=FS.state.site;
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Frequently Asked Questions</h1><p>Quick answers about the program, fees, certification and support.</p></div></section>
 <section class="sec"><div class="wrap"><div class="fq-grid"><aside class="fq-side"><div class="card"><h3>Search the FAQs</h3><div class="srch" style="margin-top:10px"><span>🔍</span><input placeholder="Type a keyword…" oninput="A.faqFilter(this.value)"></div></div>
  <div class="card dkc"><h3>Still have questions?</h3><p>Our admissions team is happy to help.</p><div class="fq-btns"><a class="btn btn-a btn-sm" href="#/contact">Contact us</a><button class="btn btn-w btn-sm" onclick="A.leadModal()">Request a call back</button></div>${st.email?`<p class="fq-m">${E(st.email)}${st.phone?'<br>'+E(st.phone):''}</p>`:''}</div></aside>
  <div class="fq-list"><div class="fq-grp"><h3 class="fq-h">General</h3>${faqHtml(gen)}</div>${prog.length?`<div class="fq-grp"><h3 class="fq-h">About the tracks</h3>${faqHtml(prog)}</div>`:''}<div class="empty card" id="fqn" style="display:none">No questions match your search.</div></div></div></div></section>`,'#/faq')});
const legal=(t,items)=>{const st=FS.state.site;FS.mountPublic(`<section class="ph"><div class="wrap"><h1>${E(t)}</h1><p>Please read these terms carefully and review them from time to time.</p></div></section>
 <section class="sec"><div class="wrap"><div class="lg-grid"><aside class="lg-toc"><div class="card"><h3>On this page</h3><nav>${items.map((i,k)=>`<a href="#" onclick="return A.go('lg-${k}')"><b>${k+1}</b>${E(FS.fx(i[0]))}</a>`).join('')}</nav></div></aside>
  <div class="lg-body">${items.map((i,k)=>`<article class="card lg-s" id="lg-${k}"><span class="lg-n">${String(k+1).padStart(2,'0')}</span><h2>${E(FS.fx(i[0]))}</h2><p>${E(FS.fx(i[1]))}</p></article>`).join('')}
  <div class="card dkc"><h3>Questions about this policy?</h3><p>Contact us${st.email?` at <a href="mailto:${E(st.email)}" style="color:var(--gold-bright)">${E(st.email)}</a>`:''} and we will be glad to help.</p></div></div></div></div></section>`,t.startsWith('Privacy')?'#/privacy':'#/terms')};
FS.route('/privacy',()=>legal('Privacy Policy',FS.C().legal.privacy));
FS.route('/terms',()=>legal('Terms & Conditions',FS.C().legal.terms));
