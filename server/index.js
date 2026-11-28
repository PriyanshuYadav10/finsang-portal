/* Finsang portal server: static site + JSON API */
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { store, users, q, UPLOAD_DIR } = require('./db');
const A = require('./auth');
const acl = require('./acl');
const { seedBase, seedDemo, day } = require('./seed');

seedBase();
if (process.env.SEED_DEMO === '1' && store.count('students') === 0) seedDemo();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY ? 1 : false);
const PORT = +process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");
  next();
});
app.use('/api', A.loadUser);
app.use('/api', (req, res, next) => {
  // state-changing JSON calls must really be JSON (blocks cross-site form posts)
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && !req.path.startsWith('/upload') && !/^application\/json/.test(req.headers['content-type'] || '') && req.method !== 'DELETE')
    return res.status(415).json({ error: 'JSON required.' });
  next();
});
app.use('/api', express.json({ limit: '5mb' }));

const clean = (u) => u && ({ email: u.email, name: u.name, role: u.role, programs: u.programs });
const str = (v, max = 300) => String(v == null ? '' : v).trim().slice(0, max);
const emailOk = (e) => e.length <= 200 && /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,150}\.[A-Za-z]{2,}$/.test(e);
const uid = (p) => p + crypto.randomBytes(4).toString('hex').toUpperCase();
const wrap = (fn) => (req, res) => { try { fn(req, res); } catch (e) {
  if (e instanceof acl.Deny) return res.status(403).json({ error: e.message });
  console.error(e); res.status(500).json({ error: 'Server error.' }); } };

/* ---------------- state for the browser ---------------- */
function buildState(user) {
  const S = {};
  for (const c of acl.COLLS) S[c] = store.all(c).filter((d) => acl.canRead(user, c, d)).map((d) => acl.outbound(c, d));
  S.programs.sort((a, b) => (a.order || 0) - (b.order || 0));
  S.criteria = store.get('settings', 'criteria');
  S.site = store.get('settings', 'site');
  S.content = store.get('settings', 'content') || {};
  S.watched = {}; S.certReq = []; S.users = [];
  if (user && user.role === 'student') {
    const w = store.get('watched', user.email); if (w) S.watched[user.email] = w.map;
    S.certReq = store.get('certReq', user.email) ? [user.email] : [];
  }
  if (user && user.role === 'admin') {
    for (const w of store.all('watched')) S.watched[w.id] = w.map;
    S.certReq = store.all('certReq').map((c) => c.id);
    S.users = users.all().filter((u) => u.role !== 'student').map((u) => ({ id: u.id, ...clean(u), created: u.created }));
  }
  if (!user) S.site = { fee: S.site.fee, email: S.site.email, phone: S.site.phone, address: S.site.address, applicationsOpen: S.site.applicationsOpen };
  return S;
}
app.get('/api/bootstrap', (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json({ me: clean(req.user), state: buildState(req.user) }); });

/* ---------------- auth ---------------- */
app.post('/api/login', A.limit('login', 10, 5 * 60 * 1000), wrap((req, res) => {
  const email = str(req.body.email, 200).toLowerCase(), pass = String(req.body.password || '');
  const u = users.byEmail(email);
  if (u && A.verifyPassword(pass, u.pass)) {
    if (u.role === 'student') {
      const s = store.all('students').find((x) => x.email === u.email);
      if (s && s.status === 'Suspended') return res.status(403).json({ error: 'Your account is suspended. Please contact the administrator.' });
    }
    A.createSession(res, u.id);
    return res.json({ me: clean(u) });
  }
  const a = store.all('applications').find((x) => x.email === email && x.passHash && A.verifyPassword(pass, x.passHash));
  if (a && a.status !== 'Approved') return res.status(403).json({ error: `Your application (${a.id}) is "${a.status}". Dashboard access is enabled after admin approval.`, appId: a.id, email });
  res.status(401).json({ error: 'Invalid email or password.' });
}));
app.post('/api/logout', (req, res) => { A.destroySession(req, res); res.json({ ok: true }); });

app.post('/api/password', A.requireUser, A.limit('pw', 10, 600000), wrap((req, res) => {
  const pw = String(req.body.password || '');
  if (!A.verifyPassword(String(req.body.current || ''), req.user.pass)) return res.status(400).json({ error: 'Current password is incorrect.' });
  if (pw.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  users.update(req.user.id, { pass: A.hashPassword(pw) });
  res.json({ ok: true });
}));

app.post('/api/forgot', A.limit('forgot', 5, 600000), wrap((req, res) => {
  const u = users.byEmail(str(req.body.email, 200));
  if (u) {
    const t = crypto.randomBytes(24).toString('base64url');
    q('INSERT INTO resets(token,user_id,expires) VALUES(?,?,?)').run(A.sha(t), u.id, Date.now() + 3600000);
    // No mail server is bundled. The link is printed to the server log; admins can also reset passwords from the console.
    console.log(`[password reset] ${u.email}: ${BASE_URL}/forgot.html?token=${t}`);
  }
  res.json({ ok: true });
}));
app.post('/api/reset', A.limit('reset', 10, 600000), wrap((req, res) => {
  const pw = String(req.body.password || '');
  if (pw.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const r = q('SELECT user_id,expires FROM resets WHERE token=?').get(A.sha(String(req.body.token || '')));
  if (!r || r.expires < Date.now()) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  users.update(r.user_id, { pass: A.hashPassword(pw) });
  q('DELETE FROM resets WHERE user_id=?').run(r.user_id); q('DELETE FROM sessions WHERE user_id=?').run(r.user_id);
  res.json({ ok: true });
}));

/* ---------------- public: apply / track / verify / contact ---------------- */
app.post('/api/apply', A.limit('apply', 10, 3600000), wrap((req, res) => {
  const b = req.body || {}, site = store.get('settings', 'site');
  if (!site.applicationsOpen) return res.status(400).json({ error: 'Applications are currently closed.' });
  const f = { name: str(b.name, 120), email: str(b.email, 200).toLowerCase(), phone: str(b.phone, 20), city: str(b.city, 80), college: str(b.college, 160),
    qualification: str(b.qualification, 60), year: str(b.year, 6), program: str(b.program, 80), info: str(b.info, 1500) };
  for (const k of ['name', 'email', 'phone', 'city', 'college', 'qualification', 'year', 'program']) if (!f[k]) return res.status(400).json({ error: 'Please fill all required fields.' });
  if (!emailOk(f.email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!/^(19|20)\d{2}$/.test(f.year)) return res.status(400).json({ error: 'Enter a valid 4-digit year.' });
  if (!/^[0-9+\- ]{10,15}$/.test(f.phone)) return res.status(400).json({ error: 'Enter a valid mobile number.' });
  if (String(b.password || '').length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const prog = store.get('programs', f.program);
  if (!prog || prog.published === false) return res.status(400).json({ error: 'Unknown program.' });
  if (users.byEmail(f.email)) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  if (store.all('applications').some((a) => a.email === f.email && a.status !== 'Rejected')) return res.status(409).json({ error: 'An application with this email is already in progress. Use Track Application.' });
  let resume = '', resumeId = '';
  if (b.resumeId) {
    const file = q('SELECT * FROM files WHERE id=?').get(str(b.resumeId, 80));
    if (file && file.kind === 'resume') { resumeId = file.id; resume = file.name; }
  }
  const n = store.all('applications').reduce((m, a) => Math.max(m, +String(a.id).split('-')[2] || 0), 1000) + 1;
  const id = `APP-${new Date().getFullYear()}-${n}`;
  store.put('applications', id, { ...f, id, resume, resumeId, status: 'Pending', date: day(0), reason: '', passHash: A.hashPassword(b.password) });
  res.json({ id });
}));
app.post('/api/track', A.limit('track', 30, 600000), wrap((req, res) => {
  const id = str(req.body.id, 40).toUpperCase(), email = str(req.body.email, 200).toLowerCase();
  const a = store.get('applications', id);
  if (!a || a.email !== email) return res.status(404).json({ error: 'No application found for that ID and email.' });
  res.json({ id: a.id, name: a.name, program: a.program, date: a.date, status: a.status, reason: a.reason });
}));
app.get('/api/verify/:id', A.limit('verify', 60, 600000), wrap((req, res) => {
  const c = store.get('certs', str(req.params.id, 40).toUpperCase());
  if (!c) return res.status(404).json({ valid: false });
  const p = store.get('programs', c.pid);
  res.json({ valid: true, name: c.name, program: p ? p.name : c.pid, date: c.date, demo: !!c.demo });
}));
app.post('/api/contact', A.limit('contact', 5, 3600000), wrap((req, res) => {
  const m = { id: uid('MSG'), name: str(req.body.name, 120), email: str(req.body.email, 200), message: str(req.body.message, 3000), date: day(0), read: false };
  if (!m.name || !emailOk(m.email) || !m.message) return res.status(400).json({ error: 'Please fill in your name, a valid email and a message.' });
  store.put('messages', m.id, m); res.json({ ok: true });
}));

/* ---------------- sync (role-checked writes) ---------------- */
app.post('/api/sync', A.requireUser, wrap((req, res) => {
  const u = req.user, ch = req.body.changes || {};
  store.tx(() => {
    for (const [coll, c] of Object.entries(ch)) {
      if (!acl.COLLS.includes(coll)) throw new acl.Deny('Unknown collection.');
      for (const id of (c.del || [])) {
        const od = store.get(coll, id); acl.validateDelete(u, coll, od); store.del(coll, id);
        if (coll === 'documents' && od && od.fileId) { q('DELETE FROM files WHERE id=?').run(od.fileId); try { fs.unlinkSync(path.join(UPLOAD_DIR, od.fileId)); } catch (e) {} }
      }
      for (const d of (c.upsert || [])) {
        const od = store.get(coll, d && d.id);
        const nd = acl.validateWrite(u, coll, d, od);
        store.put(coll, nd.id, nd);
      }
    }
    const b = req.body;
    if (b.watched && u.role === 'student') store.put('watched', u.email, { id: u.email, map: b.watched });
    if (b.certReq) {
      if (u.role === 'student' && b.certReq.add) { if (!studentRec(u.email)) throw new acl.Deny('No enrollment.'); store.put('certReq', u.email, { id: u.email }); }
      if (u.role === 'admin') for (const e of (b.certReq.remove || [])) store.del('certReq', e);
    }
    if (b.content !== undefined) {
      if (u.role !== 'admin') throw new acl.Deny('Only admins can change website content.');
      store.put('settings', 'content', { id: 'content', ...acl.cleanSiteContent(b.content) });
    }
    if (b.criteria || b.site) {
      if (u.role !== 'admin') throw new acl.Deny('Only admins can change settings.');
      if (b.criteria) store.put('settings', 'criteria', { id: 'criteria', progress: acl.clamp(+b.criteria.progress || 0), score: acl.clamp(+b.criteria.score || 0), attendance: acl.clamp(+b.criteria.attendance || 0) });
      if (b.site) {
        const s = b.site, fee = Math.max(0, Math.round(+s.fee || 0));
        store.put('settings', 'site', { id: 'site', fee, email: str(s.email, 200), phone: str(s.phone, 60), address: str(s.address, 400), applicationsOpen: !!s.applicationsOpen });
      }
    }
  });
  res.json({ ok: true });
}));
const studentRec = (email) => store.all('students').find((s) => s.email === email);

/* ---------------- files ---------------- */
const EXT = { material: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'zip', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'mp4'],
  submission: ['pdf', 'doc', 'docx', 'zip', 'txt', 'png', 'jpg', 'jpeg', 'ppt', 'pptx', 'xls', 'xlsx'], resume: ['pdf', 'doc', 'docx'],
  document: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] };
const MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', mp4: 'video/mp4', txt: 'text/plain; charset=utf-8' };
app.post('/api/upload', (req, res, next) => {
  const kind = String(req.query.kind || '');
  const anon = !req.user;
  if (!EXT[kind]) return res.status(400).json({ error: 'Bad upload kind.' });
  if (anon && kind !== 'resume') return res.status(401).json({ error: 'Please log in.' });
  if (!anon && ((kind === 'material' && req.user.role === 'student') || (kind === 'submission' && req.user.role !== 'student') || (kind === 'document' && req.user.role !== 'student'))) return res.status(403).json({ error: 'Not allowed.' });
  (anon ? A.limit('upl', 10, 3600000) : (_q, _s, n) => n())(req, res, () =>
    express.raw({ type: () => true, limit: kind === 'resume' ? '5mb' : kind === 'document' ? '10mb' : '25mb' })(req, res, next));
}, wrap((req, res) => {
  const name = path.basename(str(req.query.name, 200)).replace(/[^\w.\- ()]/g, '_');
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!EXT[req.query.kind].includes(ext)) return res.status(400).json({ error: 'File type not allowed. Allowed: ' + EXT[req.query.kind].join(', ') });
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Empty file.' });
  const id = crypto.randomBytes(12).toString('hex');
  fs.writeFileSync(path.join(UPLOAD_DIR, id), req.body);
  q('INSERT INTO files(id,name,size,kind,owner) VALUES(?,?,?,?,?)').run(id, name, req.body.length, req.query.kind, req.user ? req.user.email : '');
  res.json({ id, name, size: req.body.length });
}));
app.get('/api/files/:id', A.requireUser, wrap((req, res) => {
  const f = q('SELECT * FROM files WHERE id=?').get(String(req.params.id));
  if (!f || !/^[a-f0-9]{24}$/.test(f.id)) return res.status(404).json({ error: 'Not found.' });
  const u = req.user;
  const ok = u.role === 'admin' || (f.kind === 'material') || f.owner === u.email || (u.role === 'trainer' && f.kind !== 'material' && f.kind !== 'document');
  if (!ok) return res.status(403).json({ error: 'Not allowed.' });
  const ext = f.name.split('.').pop().toLowerCase();
  const inline = req.query.dl !== '1' && MIME[ext];
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.sendFile(path.join(UPLOAD_DIR, f.id));
}));

/* ---------------- admin actions ---------------- */
const admin = express.Router();
admin.use(A.requireRole('admin'));
const needPw = (p) => { if (String(p || '').length < 8) throw new acl.Deny('Password must be at least 8 characters.'); return A.hashPassword(p); };
const progList = (v) => (Array.isArray(v) ? v : []).filter((id) => store.get('programs', id));

admin.post('/users', wrap((req, res) => {
  const b = req.body, email = str(b.email, 200).toLowerCase();
  if (!['trainer', 'admin'].includes(b.role)) throw new acl.Deny('Role must be trainer or admin.');
  if (!str(b.name) || !emailOk(email)) throw new acl.Deny('Name and a valid email are required.');
  if (users.byEmail(email)) throw new acl.Deny('That email is already registered.');
  users.create({ email, name: str(b.name, 120), role: b.role, programs: b.role === 'trainer' ? progList(b.programs) : [], pass: needPw(b.password) });
  res.json({ ok: true });
}));
admin.put('/users/:id', wrap((req, res) => {
  const u = users.byId(+req.params.id), b = req.body;
  if (!u || u.role === 'student') throw new acl.Deny('User not found.');
  const f = {};
  if (b.name) f.name = str(b.name, 120);
  if (b.role && b.role !== u.role) {
    if (!['trainer', 'admin'].includes(b.role)) throw new acl.Deny('Invalid role.');
    if (u.role === 'admin' && users.countRole('admin') < 2) throw new acl.Deny('There must be at least one admin.');
    if (u.id === req.user.id) throw new acl.Deny('You cannot change your own role.');
    f.role = b.role;
  }
  if (Array.isArray(b.programs)) f.programs = progList(b.programs);
  if (b.password) f.pass = needPw(b.password);
  users.update(u.id, f);
  if (b.password) q('DELETE FROM sessions WHERE user_id=?').run(u.id);
  res.json({ ok: true });
}));
admin.delete('/users/:id', wrap((req, res) => {
  const u = users.byId(+req.params.id);
  if (!u || u.role === 'student') throw new acl.Deny('User not found.');
  if (u.id === req.user.id) throw new acl.Deny('You cannot delete your own account.');
  if (u.role === 'admin' && users.countRole('admin') < 2) throw new acl.Deny('There must be at least one admin.');
  users.remove(u.id); res.json({ ok: true });
}));

const nextStudentId = () => 'S' + (store.all('students').reduce((m, s) => Math.max(m, +String(s.id).slice(1) || 0), 1000) + 1);
admin.post('/students', wrap((req, res) => {
  const b = req.body, email = str(b.email, 200).toLowerCase();
  if (!str(b.name) || !emailOk(email)) throw new acl.Deny('Name and a valid email are required.');
  if (!store.get('programs', b.program)) throw new acl.Deny('Choose a program.');
  if (users.byEmail(email)) throw new acl.Deny('That email is already registered.');
  const pass = needPw(b.password);
  store.tx(() => {
    users.create({ email, name: str(b.name, 120), role: 'student', pass });
    const id = nextStudentId();
    store.put('students', id, { id, name: str(b.name, 120), email, program: b.program, progress: 0, attendance: 100, score: 0, city: str(b.city, 80), college: str(b.college, 160),
      phone: str(b.phone, 20), joined: day(0), status: 'Active', dyn: true, feeStatus: b.feeStatus === 'Paid' ? 'Paid' : 'Pending', feeRef: str(b.feeRef, 80) });
  });
  res.json({ ok: true });
}));
admin.put('/students/:id/account', wrap((req, res) => {
  const s = store.get('students', req.params.id), u = s && users.byEmail(s.email);
  if (!u) throw new acl.Deny('Student not found.');
  users.update(u.id, { pass: needPw(req.body.password) });
  q('DELETE FROM sessions WHERE user_id=?').run(u.id);
  res.json({ ok: true });
}));
admin.delete('/students/:id', wrap((req, res) => {
  const s = store.get('students', req.params.id);
  if (!s) throw new acl.Deny('Student not found.');
  store.tx(() => {
    const u = users.byEmail(s.email); if (u) users.remove(u.id);
    store.del('students', s.id); store.del('watched', s.email); store.del('certReq', s.email);
    for (const c of ['submissions', 'results', 'jobApps', 'interviews', 'documents']) for (const d of store.all(c)) if (d.email === s.email) {
      store.del(c, d.id);
      if (c === 'documents' && d.fileId) { q('DELETE FROM files WHERE id=?').run(d.fileId); try { fs.unlinkSync(path.join(UPLOAD_DIR, d.fileId)); } catch (e) {} }
    }
  });
  res.json({ ok: true });
}));
admin.post('/applications/:id/approve', wrap((req, res) => {
  const a = store.get('applications', req.params.id);
  if (!a) throw new acl.Deny('Application not found.');
  if (a.status === 'Approved') throw new acl.Deny('Already approved.');
  if (users.byEmail(a.email)) throw new acl.Deny('An account with this email already exists.');
  if (!store.get('programs', a.program)) throw new acl.Deny('The applied program no longer exists. Edit the application program first.');
  store.tx(() => {
    users.create({ email: a.email, name: a.name, role: 'student', pass: a.passHash });
    const id = nextStudentId();
    store.put('students', id, { id, name: a.name, email: a.email, program: a.program, progress: 0, attendance: 100, score: 0, city: a.city, college: a.college, phone: a.phone,
      resume: a.resume || '', resumeId: a.resumeId || '', joined: day(0), status: 'Active', dyn: true, feeStatus: 'Pending', feeRef: '' });
    store.put('applications', a.id, { ...a, status: 'Approved', reason: '' });
  });
  res.json({ ok: true });
}));
admin.post('/certs', wrap((req, res) => {
  const s = studentRec(str(req.body.email, 200).toLowerCase());
  if (!s) throw new acl.Deny('Student not found.');
  if (store.all('certs').some((c) => c.email === s.email)) throw new acl.Deny('A certificate was already issued to this student.');
  const yr = new Date().getFullYear();
  const n = store.all('certs').reduce((m, c) => Math.max(m, +String(c.id).split('-')[2] || 0), 0) + 1;
  const cert = { id: `FSC-${yr}-${String(n).padStart(4, '0')}`, email: s.email, name: s.name, pid: s.program, date: day(0), score: acl.clamp(Math.round(+req.body.score || 0)) };
  store.tx(() => { store.put('certs', cert.id, cert); store.del('certReq', s.email); });
  res.json({ cert });
}));
/* is the data directory on a persistent volume? (a separate device from the container's root filesystem) */
admin.get('/storage', wrap((req, res) => {
  const { DATA_DIR } = require('./db');
  const dbFile = path.join(DATA_DIR, 'finsang.db');
  let mounted = false, created = null, size = 0;
  try { mounted = fs.statSync(DATA_DIR).dev !== fs.statSync('/').dev; } catch (e) {}
  try { const st = fs.statSync(dbFile); created = (st.birthtime && st.birthtime.getTime() > 0 ? st.birthtime : st.ctime).toISOString(); size = st.size; } catch (e) {}
  const uploads = (() => { try { return fs.readdirSync(UPLOAD_DIR).length; } catch (e) { return 0; } })();
  res.json({ dir: DATA_DIR, production: process.env.NODE_ENV === 'production', mounted, dbCreated: created, dbSize: size, uploads,
    counts: { students: store.count('students'), applications: store.count('applications'), users: users.all().length }, uptimeMin: Math.round(process.uptime() / 60) });
}));
admin.get('/backup', wrap((req, res) => {
  const out = { exported: new Date().toISOString(), docs: {}, users: users.all().map(({ pass, ...u }) => u) };
  for (const r of q('SELECT DISTINCT coll FROM docs').all()) out.docs[r.coll] = store.all(r.coll).map((d) => acl.outbound(r.coll, d));
  res.setHeader('Content-Disposition', `attachment; filename="finsang-backup-${day(0)}.json"`);
  res.json(out);
}));
app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

/* ---------------- static site ---------------- */
app.get('/favicon.ico', (req, res) => res.status(204).end());
// Android app link verification (express.static skips dot-folders)
app.get('/.well-known/assetlinks.json', (req, res) => res.type('application/json').sendFile(path.join(__dirname, '..', 'public', '.well-known', 'assetlinks.json')));
app.get('/sw.js', (req, res) => { res.setHeader('Cache-Control', 'no-cache'); res.sendFile(path.join(__dirname, '..', 'public', 'sw.js')); });
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'], maxAge: 0, index: 'index.html' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html')));

if (require.main === module) app.listen(PORT, () => {
  console.log(`Finsang portal running at ${BASE_URL}`);
  try { if (process.env.NODE_ENV === 'production' && fs.statSync(require('./db').DATA_DIR).dev === fs.statSync('/').dev)
    console.warn('[WARNING] The data directory is NOT on a mounted volume: the database and uploads will be erased on every redeploy. Mount a persistent volume at ' + require('./db').DATA_DIR); } catch (e) {}
});
module.exports = app;
