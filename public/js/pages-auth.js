/* Login, registration, password reset, application tracking, certificate verification */
/* Full-screen auth layout (no site header/footer): brand panel + form panel */
FS.mountAuth=(inner,o)=>{o=o||{};const S=FS.state.site||{},fee=FS.feeText||'';
 const bullets=o.bullets||[['🎓','Five career tracks','Videos, quizzes, assignments and live projects'],['🏅','Verifiable certificate','A unique ID that anyone can check'],['💼','Career and startup support','Guidance, mock interviews and partner openings*']];
 $app().innerHTML=`<div class="ax"><aside class="ax-l"><div class="mesh2"><i></i><i></i><i></i></div>
  <div class="ax-top"><a class="ax-brand" href="#/"><img src="img/logo.png" alt="Finsang"><span><b>Finsang</b><small>360° Career Program</small></span></a><a class="ax-back" href="#/">← Back to website</a></div>
  <div class="ax-hero"><span class="pill dk">${E(o.pill||'Finsang 360° Career Program')}</span><h2>${o.title||'Learn. Build. <em>Launch.</em>'}</h2><p>${E(o.lead||'One secure login for your learning portal, mentor panel or admin console.')}</p>
   <ul class="ax-ul">${bullets.map(x=>`<li><i>${x[0]}</i><div><b>${E(x[1])}</b><span>${E(x[2])}</span></div></li>`).join('')}</ul>
   <div class="ax-facts"><div><b>5</b><span>career tracks</span></div><div><b>${E(fee)}</b><span>one-time fee</span></div><div><b>1</b><span>verifiable certificate</span></div></div></div>
  <div class="ax-help">${S.email||S.phone?`Need help? ${S.email?`<a href="mailto:${E(S.email)}">${E(S.email)}</a>`:''}${S.email&&S.phone?' · ':''}${S.phone?E(S.phone):''}`:''}</div></aside>
 <main class="ax-r"><div class="ax-bar"><span></span><span class="ax-alt">${o.alt||''}</span></div>
  <div class="ax-main"><div class="ax-card ${o.wide?'wide':''}">${inner}</div></div>
  <div class="ax-foot">© ${new Date().getFullYear()} ${E(String((FS.ORGS.finsang||{}).name||'Finsang').replace(/\.+$/,''))} · <a href="#/terms">Terms</a> · <a href="#/privacy">Privacy</a></div></main></div>`;
};
FS.route('/enter',()=>{FS.go('#/login')});
FS.route('/login',(_,q)=>{
 const u=FS.user();if(u){FS.go(FS.homeFor(u.role));return}
 FS.mountAuth(`<div class="ax-h"><span class="ax-ic">🔐</span><div><h1>Welcome back</h1><p>Log in to your student, trainer or admin account.</p></div></div>
 <div id="lerr"></div><form onsubmit="return A.login(event)" novalidate><div class="fg"><label>Email address</label><input name="email" type="email" required autocomplete="username" placeholder="you@example.com"></div>
 <div class="fg"><label>Password</label><input name="pass" type="password" required autocomplete="current-password" placeholder="Your password"></div>
 <div class="ax-row"><span class="hint">Students get access after approval.</span><a href="#/forgot">Forgot password?</a></div>
 <button class="btn btn-a btn-block ax-btn">Log in <span class="ar">→</span></button></form>
 <div class="ax-or"><span>New to Finsang?</span></div>
 <div class="ax-two"><a class="btn btn-o" href="#/register">Apply for the program</a><a class="btn btn-o" href="#/track">Track application</a></div>`,
 {pill:'Welcome back',title:'Pick up where you <em>left off.</em>',lead:'Your lessons, assignments, scores and certificate are waiting in your dashboard.',alt:'New here? <a href="#/register">Apply now</a>'});
});
A.login=async ev=>{ev.preventDefault();const f=ev.target,btn=f.querySelector('.ax-btn');const le=document.getElementById('lerr');le.innerHTML='';
 if(!f.email.value.trim()||!f.pass.value){le.innerHTML='<div class="alert e">Please enter your email and password.</div>';return false}
 btn.disabled=true;
 const r=await FS.login(f.email.value,f.pass.value);btn.disabled=false;
 if(r.error){document.getElementById('lerr').innerHTML=`<div class="alert e">${E(r.error)}${r.appId?` <a href="#/track?id=${E(r.appId)}&email=${encodeURIComponent(r.email)}">Track status</a>`:''}</div>`;return false}
 const next=new URLSearchParams(location.search).get('next');
 const ok=next&&/^(student|admin|trainer)-\w+\.html(\?.*)?$/.test(next)&&next.startsWith(r.user.role+'-');
 location.href=ok?next:FS.toUrl(FS.homeFor(r.user.role));return false};

FS.route('/register',(_,q)=>{
 FS.mountAuth(`<div class="ax-h"><span class="ax-ic">📝</span><div><h1>Apply to the program</h1><p>Create your account by applying. After admin approval you can log in to your dashboard.</p></div></div>
 ${FS.state.site.applicationsOpen?FS.applyForm(q.get('p')||''):'<div class="alert w">Applications are currently closed.</div>'}`,
 {wide:1,pill:'Join the program',title:'Start your <em>360° journey.</em>',lead:'One application. One fee. All five career tracks, plus startup support if you want to build something of your own.',
  bullets:[['📝','Apply in about 3 minutes','Share your details and resume. No payment to apply.'],['✅','Approval by our team','You can track your status any time with your application ID.'],['🔓','Pay once, unlock everything','The fee is payable only after approval.']],
  alt:'Already applied? <a href="#/login">Log in</a> · <a href="#/track">Track status</a>'});
});

FS.route('/forgot',(_,q)=>{
 const token=q.get('token'),alt='Remembered it? <a href="#/login">Log in</a>';
 if(token)return FS.mountAuth(`<div class="ax-h"><span class="ax-ic">🔑</span><div><h1>Choose a new password</h1><p>Enter a new password for your account.</p></div></div>
  <form onsubmit="return A.reset(event,'${E(token)}')"><div class="fg"><label>New password</label><input name="np" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div><button class="btn btn-a btn-block ax-btn">Set password <span class="ar">→</span></button></form>`,{pill:'Account recovery',title:'Set a new <em>password.</em>',lead:'Choose a strong password you have not used elsewhere.',alt});
 FS.mountAuth(`<div class="ax-h"><span class="ax-ic">🔑</span><div><h1>Reset your password</h1><p id="fmsg">Enter your account email. If an account exists, a reset link will be issued.</p></div></div>
 <form onsubmit="return A.forgot(event)"><div class="fg"><label>Email address</label><input name="email" type="email" required placeholder="you@example.com"></div><button class="btn btn-a btn-block ax-btn">Send reset link <span class="ar">→</span></button></form>
 <p class="hint" style="margin-top:14px;text-align:center">No link? Contact the administrator, who can set a new password for you.</p>`,{pill:'Account recovery',title:'Forgot your <em>password?</em>',lead:'It happens. We will help you get back into your account.',alt});
});
A.forgot=async ev=>{ev.preventDefault();try{await FS.api('POST','/api/forgot',{email:ev.target.email.value});
 document.getElementById('fmsg').innerHTML='<div class="alert s">If that email has an account, a reset link has been issued. Please check with your administrator if it does not arrive.</div>';ev.target.style.display='none'}catch(e){FS.err(e)}return false};
A.reset=async(ev,token)=>{ev.preventDefault();try{await FS.api('POST','/api/reset',{token,password:ev.target.np.value});FS.toast('Password updated. Please log in.');setTimeout(()=>FS.go('#/login'),800)}catch(e){FS.err(e)}return false};

FS.route('/track',(_,q)=>{
 const id=(q.get('id')||'').trim(),em=(q.get('email')||'').trim().toLowerCase();
 const steps=[['📝','Submitted','We receive your application and send you an application ID.'],['🔍','Under review','Our admissions team reviews your details and resume.'],['✅','Decision','You are approved, or told what is needed to re-apply.'],['🔓','Access granted','Pay the one-time fee and log in to your dashboard.']];
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Track Your Application</h1><p>Check where your application stands. You will need your application ID and the email you applied with.</p></div></section>
 <section class="sec"><div class="wrap"><div class="tk-grid"><div><div class="card tk-f"><h2>Check your status</h2><form onsubmit="return A.track(event)"><div class="fg"><label>Application ID *</label><input name="id" value="${E(id)}" placeholder="APP-2026-1001" required autocomplete="off"><span class="hint">Shown when you submitted your application.</span></div><div class="fg"><label>Email address *</label><input name="email" type="email" value="${E(em)}" placeholder="The email you applied with" required></div><button class="btn btn-a ax-btn">Check status <span class="ar">→</span></button></form></div><div id="tres"></div></div>
  <aside class="card tk-s"><h3>How review works</h3><ol class="tk-steps">${steps.map(x=>`<li><i>${x[0]}</i><div><b>${x[1]}</b><span>${x[2]}</span></div></li>`).join('')}</ol><p class="hint" style="margin-top:14px">Lost your ID? <a href="#/contact">Contact admissions</a> and we will help.</p></aside></div></div></section>`,'#/track');
 if(id&&em)FS.api('POST','/api/track',{id,email:em}).then(a=>{
  const st=a.status,labels=['Submitted','Under review','Decision','Access granted'];
  const idx=st==='Pending'?0:st==='Under Review'?1:2;const cls=i=>st==='Rejected'&&i===2?'x':i<idx||(st==='Approved'&&i<=3)?'d':i===idx?'c':'';
  document.getElementById('tres').innerHTML=`<div class="card tk-r"><div class="row sp-b" style="align-items:flex-start;gap:12px"><div><b style="color:var(--navy);font-size:1.1rem">${E(a.name)}</b><br><span class="hint">${E(a.id)} · ${E(FS.pname(a.program))} · Applied ${FS.fmt(a.date)}</span></div><span class="tag ${st==='Approved'?'g':st==='Rejected'?'r':'a'}">${E(st)}</span></div>
   <div class="tracker">${labels.map((s2,i)=>`<div class="s ${cls(i)}"><i>${st==='Rejected'&&i===2?'✕':cls(i)==='d'?'✓':i+1}</i>${i===2&&st==='Rejected'?'Rejected':s2}</div>`).join('')}</div>
   ${st==='Approved'?`<div class="alert s">Approved! You can now <a href="#/login">log in</a> with your registered email and password.</div>`:st==='Rejected'?`<div class="alert e">${E(a.reason||'Your application was not approved.')} You may re-apply.</div>`:`<div class="alert">Our team is reviewing your application. Check back soon.</div>`}</div>`;
 }).catch(e=>{document.getElementById('tres').innerHTML=`<div class="alert e" style="margin-top:18px">${E(e.message)}</div>`});
});
A.track=e=>{e.preventDefault();const f=e.target;FS.go(`#/track?id=${encodeURIComponent(f.id.value)}&email=${encodeURIComponent(f.email.value)}`);return false};

FS.route('/verify',(_,q)=>{
 const id=(q.get('id')||'').trim().toUpperCase();
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Certificate Verification</h1><p>Confirm that a Finsang certificate is genuine by checking its unique ID.</p></div></section>
 <section class="sec"><div class="wrap"><div class="tk-grid"><div><div class="card tk-f"><h2>Verify a certificate</h2><form onsubmit="return A.verify(event)"><div class="fg"><label>Certificate ID *</label><input name="id" value="${E(id)}" placeholder="FSC-2026-0001" required autocomplete="off"><span class="hint">The ID is printed on the certificate.</span></div><button class="btn btn-a ax-btn">Verify <span class="ar">→</span></button></form></div><div id="vres"></div></div>
  <aside class="card tk-s"><h3>What we confirm</h3><ul class="chk"><li>The certificate was issued by Finsang</li><li>The name of the learner it was issued to</li><li>The program and the date of issue</li></ul><h3 style="margin-top:20px">Certificates are issued when</h3><ul class="chk"><li>The learner meets the published progress, assessment and attendance criteria</li><li>The result has been reviewed by our team</li></ul></aside></div></div></section>`,'#/verify');
 if(id)fetch('/api/verify/'+encodeURIComponent(id)).then(r=>r.json().then(c=>({ok:r.ok,c}))).then(({ok,c})=>{
  document.getElementById('vres').innerHTML=ok&&c.valid?`<div class="card vf-ok"><div class="vf-h"><i>✓</i><div><b>Valid certificate</b><span>This certificate is genuine and was issued by Finsang.</span></div></div><dl><div><dt>Issued to</dt><dd>${E(c.name)}</dd></div><div><dt>Program</dt><dd>${E(c.program)}</dd></div><div><dt>Date of issue</dt><dd>${FS.fmt(c.date)}</dd></div><div><dt>Certificate ID</dt><dd>${E(id)}</dd></div></dl>${c.demo?'<p class="hint">This is a sample record.</p>':''}</div>`:`<div class="card vf-no"><div class="vf-h"><i>✕</i><div><b>No certificate found</b><span>We could not find a certificate with the ID <b>${E(id)}</b>. Check the ID and try again, or <a href="#/contact">contact us</a>.</span></div></div></div>`});
});
A.verify=e=>{e.preventDefault();FS.go('#/verify?id='+encodeURIComponent(e.target.id.value));return false};
