/* Self-contained API smoke test: boots the app on a temp database and exercises the main flows and permission rules. */
const os = require('os'), path = require('path'), fs = require('fs');
/* Usage: `npm test` boots the Node app on a temp DB. `TEST_URL=http://127.0.0.1:8080 npm test` tests an already-running
   instance (e.g. the PHP edition installed with demo data and admin admin@test.dev / admin-password-1). */
const REMOTE = process.env.TEST_URL;
let app = null;
if (!REMOTE) {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'finsang-test-'));
  process.env.ADMIN_EMAIL = 'admin@test.dev'; process.env.ADMIN_PASSWORD = 'admin-password-1';
  app = require('./index');
  require('./seed').seedDemo();
}

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const jar = {};
let base;
const call = async (who, method, url, body) => {
  const r = await fetch(base + url, { method, headers: { 'content-type': 'application/json', cookie: jar[who] || '' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = r.headers.get('set-cookie'); if (sc) jar[who] = sc.split(';')[0];
  let d = {}; try { d = await r.json(); } catch {}
  return { s: r.status, d };
};

const server = REMOTE ? { close() {} } : app.listen(0);
const start = async () => {
  base = REMOTE ? REMOTE.replace(/\/$/, '') : 'http://127.0.0.1:' + server.address().port;
  try {
    ok((await call('anon', 'GET', '/api/bootstrap')).d.state.programs.length === 5, 'public bootstrap lists programs');
    ok((await call('admin', 'POST', '/api/login', { email: 'admin@test.dev', password: 'wrong' })).s === 401, 'bad password rejected');
    ok((await call('admin', 'POST', '/api/login', { email: 'admin@test.dev', password: 'admin-password-1' })).s === 200, 'admin login');

    const apply = await call('anon', 'POST', '/api/apply', { name: 'Smoke User', email: 'smoke@test.dev', phone: '9999999999', city: 'X', college: 'Y', qualification: 'BBA / MBA', year: '2026', program: 'digital-marketing', password: 'smoke-pass-1' });
    ok(apply.s === 200 && apply.d.id, 'public application accepted');
    ok((await call('smoke', 'POST', '/api/login', { email: 'smoke@test.dev', password: 'smoke-pass-1' })).s === 403, 'unapproved applicant cannot log in');
    ok((await call('admin', 'POST', `/api/admin/applications/${apply.d.id}/approve`, {})).s === 200, 'admin approves application');
    ok((await call('smoke', 'POST', '/api/login', { email: 'smoke@test.dev', password: 'smoke-pass-1' })).s === 200, 'approved student logs in');

    const sb = (await call('smoke', 'GET', '/api/bootstrap')).d;
    ok(sb.state.students.length === 1 && sb.state.applications.length === 0 && !JSON.stringify(sb).includes('passHash'), 'student only receives own data');
    ok((await call('smoke', 'POST', '/api/sync', { changes: { programs: { del: ['digital-marketing'] } } })).s === 403, 'student cannot delete programs');
    ok((await call('smoke', 'POST', '/api/sync', { changes: { certs: { upsert: [{ id: 'FSC-F', email: 'a' }] } } })).s === 403, 'student cannot forge certificates');
    ok((await call('smoke', 'GET', '/api/admin/backup')).s === 403, 'student cannot access admin API');
    ok((await call('smoke', 'POST', '/api/sync', { changes: { results: { upsert: [{ id: 'R9', email: 'other@x.dev', pid: 'digital-marketing', title: 'Q', score: 99, total: 5, date: '2026-01-01', mode: 'Practice' }] } } })).s === 200, 'student can record a quiz result');
    const res = (await call('smoke', 'GET', '/api/bootstrap')).d.state.results[0];
    ok(res.email === 'smoke@test.dev' && res.score === 5, 'result identity and score are enforced server-side');

    ok((await call('trainer', 'POST', '/api/login', { email: 'trainer@finsang.demo', password: 'trainer123' })).s === 200, 'trainer login');
    const tb = (await call('trainer', 'GET', '/api/bootstrap')).d.state;
    ok(tb.students.every((s) => ['software-development', 'ui-ux-designing'].includes(s.program)), 'trainer sees only assigned programs');
    ok((await call('trainer', 'POST', '/api/sync', { changes: { announcements: { upsert: [{ id: 'Z1', type: 'Program Update', title: 't', body: 'b', date: '2026-01-01', prog: 'digital-marketing' }] } } })).s === 403, 'trainer cannot post to a foreign program');

    const cert = await call('admin', 'POST', '/api/admin/certs', { email: 'vikram@sample.demo', score: 88 });
    ok(cert.s === 200 && /^FSC-\d{4}-\d{4}$/.test(cert.d.cert.id), 'admin issues certificate');
    ok((await fetch(base + '/api/verify/' + cert.d.cert.id)).status === 200, 'certificate verifies publicly');
    ok((await call('admin', 'POST', '/api/admin/certs', { email: 'vikram@sample.demo' })).s === 403, 'duplicate certificate blocked');

    const users = (await call('admin', 'GET', '/api/bootstrap')).d.state.users;
    const me = users.find((u) => u.email === 'admin@test.dev');
    ok((await call('admin', 'DELETE', '/api/admin/users/' + me.id)).s === 403, 'admin cannot delete own account');
    ok((await call('admin', 'POST', '/api/admin/users', { name: 'T2', email: 't2@test.dev', role: 'trainer', password: 'trainer-pass-2', programs: ['digital-marketing'] })).s === 200, 'admin creates trainer');
    ok((await call('admin', 'POST', '/api/sync', { changes: { programs: { del: ['software-development'] } } })).s === 403, 'program with students cannot be deleted');

    // website content (CMS)
    const cmsBody = { content: { hero: { eyebrow: 'E', title: 'Hello world', highlight: 'Go', lead: 'L'.repeat(900) }, faqs: [['Q1?', 'A1'], ['', 'dropped'], ['Q2?', 'A2']],
      partners: [{ id: 'Acme Co!', name: 'Acme', color: 'red', contrib: ['x', '', 'y'] }, { id: 'ACMECO', name: 'dup' }], about: { cards: [{ icon: '🎯', h: 'Mission', p: 'p' }, { h: '' }] }, evil: { a: 1 } } };
    ok((await call('smoke', 'POST', '/api/sync', cmsBody)).s === 403, 'student cannot change website content');
    ok((await call('admin', 'POST', '/api/sync', cmsBody)).s === 200, 'admin saves website content');
    const pub = (await call('anon', 'GET', '/api/bootstrap')).d.state.content;
    ok(pub && pub.hero.title === 'Hello world' && pub.hero.lead.length === 600, 'content is public and long text is clamped');
    ok(pub.faqs.length === 2 && pub.partners.length === 1 && pub.partners[0].id === 'acmeco' && pub.partners[0].color === '#9a7a2e' && pub.partners[0].contrib.length === 2, 'FAQs/partners sanitised (empty dropped, ids slugged, bad colour reset)');
    ok(pub.about.cards.length === 1 && pub.evil === undefined, 'unknown keys dropped');
    ok((await call('admin', 'POST', '/api/sync', { content: {} })).s === 200 && Object.keys((await call('anon', 'GET', '/api/bootstrap')).d.state.content).join() === 'id', 'resetting content removes all overrides');

    const formPost = await fetch(base + '/api/sync', { method: 'POST', headers: { 'content-type': 'text/plain', cookie: jar.admin }, body: '{}' });
    ok(formPost.status === 415, 'non-JSON state-changing request rejected');
    const nf = async (u) => (await fetch(base + u)).headers.get('content-type') !== 'application/javascript' && !(await (await fetch(base + u)).text()).includes('require(');
    ok((await nf('/server/index.js')) && (await nf('/data/finsang.db')) && (await nf('/_app/config.php')) && (await fetch(base + '/_app/config.php')).status !== 200, 'server code, config and database are not publicly served');
  } catch (e) { console.error(e); fails++; }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  server.close(); process.exit(fails ? 1 : 0);
};
if (REMOTE) start(); else server.on('listening', start);
