/* Exports the Node seed content as JSON for the PHP/MySQL edition (php/_app/seed/*.json). */
const os = require('os'), path = require('path'), fs = require('fs');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'finsang-seed-'));
const { store, users } = require('../server/db');
const { seedBase, seedDemo } = require('../server/seed');
seedBase();
const base = {};
for (const c of ['programs', 'settings']) base[c] = store.all(c);
const prog = store.all('programs'), settings = store.all('settings');
const before = new Set();
for (const c of ['programs', 'settings']) store.all(c).forEach((d) => before.add(c + ':' + d.id));
seedDemo();
const demo = { docs: {}, users: [] };
for (const c of ['students', 'jobs', 'watched', 'submissions', 'results', 'certs', 'applications', 'interviews', 'jobApps', 'announcements'])
  demo.docs[c] = store.all(c).map((d) => (d.passHash ? { ...d, passHash: '__DEMO__' } : d));
demo.users = [['trainer@finsang.demo', 'Rohit Mehta', 'trainer', 'trainer123', ['software-development', 'ui-ux-designing']], ['admin@finsang.demo', 'Neha Verma', 'admin', 'admin123', []]];
for (const u of users.all().filter((x) => x.role === 'student')) demo.users.push([u.email, u.name, 'student', 'demo123', []]);
const out = path.join(__dirname, '..', 'php', '_app', 'seed');
fs.writeFileSync(path.join(out, 'base.json'), JSON.stringify({ programs: prog, settings }));
fs.writeFileSync(path.join(out, 'demo.json'), JSON.stringify(demo));
console.log('programs', prog.length, 'demo users', demo.users.length, Object.fromEntries(Object.entries(demo.docs).map(([k, v]) => [k, v.length])));
