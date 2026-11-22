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

FS.route('/',()=>{
 const hl=[['🗓️','3–4 Months of Structured Learning','Week-by-week roadmap with weekly assessments.'],['🏭','Industry-Oriented Curriculum','Built with input from our technology and growth partners.'],['🛠️','Practical Projects & Assignments','Learn by building: assignments and live project briefs.'],['🧭','Industry Mentorship','Guided by trainers and partner mentors.'],['🏅','Certification Opportunities','Verifiable certificates on meeting completion criteria.'],['💼','Placement Assistance','Resume, mock interviews and partner openings. Not a job guarantee.']];
 const steps=[['Explore','Browse programs and pick your track'],['Apply','Submit your application and resume'],['Get Approved','Our team reviews and approves'],['Learn & Build','Modules, videos, assignments, projects'],['Certify & Launch','Assessments, certificate, placement support']];
 const meth=[['📖','Learn','Recorded videos, live classes, notes and reference guides.'],['✍️','Practice','Quizzes, topic tests and guided exercises every week.'],['🔨','Build','Assignments and a team live project with mentor reviews.'],['📊','Assess','Weekly assessments, mock tests and a final evaluation.'],['🚀','Launch','Portfolio, mock interviews and placement assistance.']];
  FS.mountPublic(`
 <section class="hero"><div class="wrap"><div><span class="eyebrow" style="background:rgba(255,255,255,.14);color:#fff">Skill Development &amp; Career Launch Program</span>
 <h1>Learn Skills. Build Experience. <em>Launch Your Career.</em></h1>
 <p class="lead">A 3–4 month industry-oriented program combining structured learning, practical projects, mentorship, certification and placement assistance — by Finsang India with GrainZap IT Solutions and Growth Digital.</p>
 <div class="cta"><a href="#" onclick="A.enroll();return false" class="btn btn-a">Enroll Now →</a><a href="#/programs" class="btn btn-w">Explore Programs</a></div>
 <div class="badges"><div><b>5</b>Career tracks</div><div><b>3–4</b>Months</div><div><b>3</b>Industry partners</div><div><b>Live</b>Projects</div></div></div>
 <div class="hv"><div class="c c1"><div class="row sp-b"><b>My Learning Progress</b><span class="tag g">Sample</span></div><div style="margin:12px 0 6px;font-size:.85rem;color:var(--mut)">Software Development · Month 2</div>${FS.bar(62)}<div class="row sp-b" style="margin-top:10px;font-size:.8rem;color:var(--mut)"><span>12 of 18 lessons</span><span>62%</span></div></div>
 <div class="c c2"><b>📝 Next assessment</b><p style="font-size:.85rem">Month 2 MCQ test<br>Friday, 5:00 PM</p></div>
 <div class="c c3"><b>🏅 Certificate</b><p style="font-size:.82rem">Unique verifiable ID on completion</p></div></div></div></section>
 <section class="sec alt"><div class="wrap"><div class="sec-head"><span class="eyebrow">Program Highlights</span><h2>Everything you need to get career-ready</h2></div>
 <div class="grid g3">${hl.map(h=>`<div class="card hl"><div class="ic">${h[0]}</div><div><h3>${h[1]}</h3><p style="font-size:.9rem;margin-top:4px">${h[2]}</p></div></div>`).join('')}</div></div></section>
 <section class="sec"><div class="wrap"><div class="sec-head"><span class="eyebrow">Featured Programs</span><h2>Choose your skill track</h2><p>Five programs designed around in-demand roles.</p></div>
 <div class="grid g3">${FS.programs().slice(0,6).map(FS.programCard).join('')}</div><div style="text-align:center;margin-top:30px"><a href="#/programs" class="btn btn-o">View all programs</a></div></div></section>
 <section class="sec alt"><div class="wrap"><div class="sec-head"><span class="eyebrow">How It Works</span><h2>Your journey from application to career</h2></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">${steps.map((s,i)=>`<div class="step"><div class="n">${i+1}</div><h3>${s[0]}</h3><p style="font-size:.88rem">${s[1]}</p></div>`).join('')}</div></div></section>
 <section class="sec dark"><div class="wrap"><div class="sec-head"><span class="eyebrow" style="background:rgba(255,255,255,.14);color:#fff">Learning Methodology</span><h2>Learn → Practice → Build → Assess → Launch</h2></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">${meth.map(m=>`<div class="card" style="background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);box-shadow:none"><div style="font-size:1.8rem">${m[0]}</div><h3 style="margin:8px 0 6px">${m[1]}</h3><p style="font-size:.88rem">${m[2]}</p></div>`).join('')}</div></div></section>
 <section class="sec"><div class="wrap"><div class="sec-head"><span class="eyebrow">Partners &amp; Industry Collaborators</span><h2>One program, three organizations</h2></div>${partnerCards()}<div style="text-align:center;margin-top:28px"><a href="#/partners" class="btn btn-o">Learn about our partners</a></div></div></section>
 <section class="sec"><div class="wrap" style="max-width:820px"><div class="sec-head"><span class="eyebrow">FAQs</span><h2>Frequently asked questions</h2></div>${faqHtml(FS.faqListF().slice(0,5))}<p style="text-align:center"><a href="#/faq">See all FAQs →</a></p></div></section>
 <section class="sec"><div class="wrap"><div class="price"><div><span class="eyebrow">Simple pricing</span><h2>One payment. All five programs.</h2><ul>${FS.programs().map(p=>`<li>${E(p.name)}</li>`).join('')}<li>Certificate &amp; placement assistance</li></ul></div><div style="text-align:center"><div class="amt">${FS.feeText}</div><p style="margin:6px 0 16px">one-time fee</p><button class="btn btn-a" onclick="A.enroll()">Enroll Now</button></div></div></div></section>
 <section class="sec" style="padding-top:0"><div class="wrap"><div class="cta-band"><h2>Ready to launch your career?</h2><p>One payment of ${FS.feeText}. ${FS.programs().length} programs. Start learning today.</p><a href="#" onclick="A.enroll();return false" class="btn btn-a">Enroll Now →</a></div></div></section>`,'#/');
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
