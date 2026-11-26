/* Login, registration, password reset, application tracking, certificate verification */
/* Split-screen shell used by login / register / reset */
FS.authShell=(inner,wide)=>`<div class="auth2"><aside class="au-l"><div class="mesh2"><i></i><i></i><i></i></div><div class="au-in">
 <span class="pill dk">Finsang 360° Career Program</span><h2>Learn. Build. <em>Launch.</em></h2><p>One secure login for your learning portal, mentor panel or admin console.</p>
 <ul class="au-ul"><li><i>🎓</i><div><b>Five career tracks</b><span>Videos, quizzes and live projects</span></div></li><li><i>🏅</i><div><b>Verifiable certificates</b><span>A unique ID anyone can check</span></div></li><li><i>💼</i><div><b>Placement assistance</b><span>Mock interviews and partner openings</span></div></li></ul>
 <div class="au-fc"><div class="au-c1"><b>My Learning Progress</b><small>Sample · Month 2</small><div class="bar"><i style="width:62%"></i></div></div><div class="au-c2">🏅 Certificate ready</div></div></div></aside>
 <div class="au-r"><div class="au-form ${wide?'wide':''}">${inner}</div></div></div>`;
FS.route('/enter',()=>{FS.go('#/login')});
FS.route('/login',(_,q)=>{
 const u=FS.user();if(u){FS.go(FS.homeFor(u.role));return}
 FS.mountPublic(FS.authShell(`<h2 style="margin-bottom:6px">Welcome back</h2><p style="margin-bottom:18px">Log in to your student, trainer or admin account.</p>
 <div id="lerr"></div><form onsubmit="return A.login(event)"><div class="fg"><label>Email</label><input name="email" type="email" required autocomplete="username"></div>
 <div class="fg"><label>Password</label><input name="pass" type="password" required autocomplete="current-password"></div>
 <div class="row sp-b" style="margin-bottom:16px"><span class="hint">Students get access after approval.</span><a href="#/forgot" style="font-size:.85rem">Forgot password?</a></div>
 <button class="btn btn-p btn-block">Log In</button></form>
 <p style="text-align:center;margin-top:16px;font-size:.9rem">New here? <a href="#/register">Apply for a program</a> · <a href="#/track">Track application</a></p>`),'#/login');
});
A.login=async ev=>{ev.preventDefault();const f=ev.target,btn=f.querySelector('button');btn.disabled=true;
 const r=await FS.login(f.email.value,f.pass.value);btn.disabled=false;
 if(r.error){document.getElementById('lerr').innerHTML=`<div class="alert e">${E(r.error)}${r.appId?` <a href="#/track?id=${E(r.appId)}&email=${encodeURIComponent(r.email)}">Track status</a>`:''}</div>`;return false}
 const next=new URLSearchParams(location.search).get('next');
 const ok=next&&/^(student|admin|trainer)-\w+\.html(\?.*)?$/.test(next)&&next.startsWith(r.user.role+'-');
 location.href=ok?next:FS.toUrl(FS.homeFor(r.user.role));return false};

FS.route('/register',(_,q)=>{
 FS.mountPublic(FS.authShell(`<h2 style="margin-bottom:6px">Student Registration &amp; Application</h2><p style="margin-bottom:18px">Create your account by applying to a program. After admin approval you can log in to your dashboard.</p>${FS.state.site.applicationsOpen?FS.applyForm(q.get('p')||''):'<div class="alert w">Applications are currently closed.</div>'}<p style="text-align:center;margin-top:14px;font-size:.9rem">Already applied? <a href="#/track">Track status</a> · <a href="#/login">Log in</a></p>`,1),'#/register');
});

FS.route('/forgot',(_,q)=>{
 const token=q.get('token');
 if(token)return FS.mountPublic(FS.authShell(`<h2 style="margin-bottom:6px">Choose a new password</h2><p style="margin-bottom:18px">Enter a new password for your account.</p>
  <form onsubmit="return A.reset(event,'${E(token)}')"><div class="fg"><label>New password (min 8 characters)</label><input name="np" type="password" minlength="8" required autocomplete="new-password"></div><button class="btn btn-p btn-block">Set password</button></form>`));
 FS.mountPublic(FS.authShell(`<h2 style="margin-bottom:6px">Reset password</h2><p style="margin-bottom:18px" id="fmsg">Enter your account email. If an account exists, a reset link will be issued.</p>
 <form onsubmit="return A.forgot(event)"><div class="fg"><label>Email</label><input name="email" type="email" required></div><button class="btn btn-p btn-block">Send reset link</button></form>
 <p class="hint" style="margin-top:12px">If you do not receive a link, contact the administrator, who can set a new password for you.</p><p style="text-align:center;margin-top:14px"><a href="#/login">Back to login</a></p>`));
});
A.forgot=async ev=>{ev.preventDefault();try{await FS.api('POST','/api/forgot',{email:ev.target.email.value});
 document.getElementById('fmsg').innerHTML='<div class="alert s">If that email has an account, a reset link has been issued. Please check with your administrator if it does not arrive.</div>';ev.target.style.display='none'}catch(e){FS.err(e)}return false};
A.reset=async(ev,token)=>{ev.preventDefault();try{await FS.api('POST','/api/reset',{token,password:ev.target.np.value});FS.toast('Password updated. Please log in.');setTimeout(()=>FS.go('#/login'),800)}catch(e){FS.err(e)}return false};

FS.route('/track',(_,q)=>{
 const id=(q.get('id')||'').trim(),em=(q.get('email')||'').trim().toLowerCase();
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Track Your Application</h1><p style="margin-top:8px">Enter your application ID and email.</p></div></section><section class="sec"><div class="wrap" style="max-width:720px"><div class="card"><form onsubmit="return A.track(event)"><div class="frow"><div class="fg"><label>Application ID</label><input name="id" value="${E(id)}" placeholder="APP-2026-1001" required></div><div class="fg"><label>Email</label><input name="email" type="email" value="${E(em)}" required></div></div><button class="btn btn-p">Check Status</button></form><div id="tres"></div></div></div></section>`,'#/track');
 if(id&&em)FS.api('POST','/api/track',{id,email:em}).then(a=>{
  const st=a.status,steps=['Submitted','Under Review','Decision','Access Granted'];
  const idx=st==='Pending'?0:st==='Under Review'?1:2;const cls=i=>st==='Rejected'&&i===2?'x':i<idx||(st==='Approved'&&i<=3)?'d':i===idx?'c':'';
  document.getElementById('tres').innerHTML=`<div class="card flat" style="margin-top:20px"><div class="row sp-b"><div><b style="color:var(--navy)">${E(a.name)}</b><br><span class="hint">${E(a.id)} · ${E(FS.pname(a.program))} · Applied ${FS.fmt(a.date)}</span></div><span class="tag ${st==='Approved'?'g':st==='Rejected'?'r':'a'}">${E(st)}</span></div>
   <div class="tracker">${steps.map((s,i)=>`<div class="s ${cls(i)}"><i>${st==='Rejected'&&i===2?'✕':cls(i)==='d'?'✓':i+1}</i>${i===2&&st==='Rejected'?'Rejected':s}</div>`).join('')}</div>
   ${st==='Approved'?`<div class="alert s">Approved! You can now <a href="#/login">log in</a> with your registered email and password.</div>`:st==='Rejected'?`<div class="alert e">${E(a.reason||'Your application was not approved.')} You may re-apply.</div>`:`<div class="alert">Our team is reviewing your application. Check back soon.</div>`}</div>`;
 }).catch(e=>{document.getElementById('tres').innerHTML=`<div class="alert e" style="margin-top:18px">${E(e.message)}</div>`});
});
A.track=e=>{e.preventDefault();const f=e.target;FS.go(`#/track?id=${encodeURIComponent(f.id.value)}&email=${encodeURIComponent(f.email.value)}`);return false};

FS.route('/verify',(_,q)=>{
 const id=(q.get('id')||'').trim().toUpperCase();
 FS.mountPublic(`<section class="ph"><div class="wrap"><h1>Certificate Verification</h1><p style="margin-top:8px">Verify the authenticity of a Finsang certificate by its unique ID.</p></div></section><section class="sec"><div class="wrap" style="max-width:640px"><div class="card"><form onsubmit="return A.verify(event)"><div class="fg"><label>Certificate ID</label><input name="id" value="${E(id)}" placeholder="FSC-2026-0001" required></div><button class="btn btn-p">Verify</button></form><div id="vres"></div></div></div></section>`,'#/verify');
 if(id)fetch('/api/verify/'+encodeURIComponent(id)).then(r=>r.json().then(c=>({ok:r.ok,c}))).then(({ok,c})=>{
  document.getElementById('vres').innerHTML=ok&&c.valid?`<div class="alert s" style="margin-top:18px">✅ <b>Valid certificate.</b> Issued to <b>${E(c.name)}</b> for <b>${E(c.program)}</b> on ${FS.fmt(c.date)}.${c.demo?' (Sample record)':''}</div>`:`<div class="alert e" style="margin-top:18px">❌ No certificate found with ID <b>${E(id)}</b>.</div>`});
});
A.verify=e=>{e.preventDefault();FS.go('#/verify?id='+encodeURIComponent(e.target.id.value));return false};
