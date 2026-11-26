/* First-run seeding. `node server/seed.js --demo` adds demo accounts and sample activity; `--reset` wipes the database first. */
const { db, store, users, DATA_DIR } = require('./db');
const { hashPassword } = require('./auth');
const SD = require('./seed-data');

const SITE = { fee: 19999, email: 'info@finsang.in', phone: '+91 9929760623', address: 'Finsang India Digital Solution Pvt. Ltd., Jaipur, Rajasthan' };
const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const uid = (p) => p + Math.random().toString(36).slice(2, 7).toUpperCase();

function convertProgram(p, i) {
  const { modules, assignments, quiz, ...rest } = p;
  return {
    ...rest, order: i, published: true,
    modules: modules.map((m, mi) => ({
      id: `${p.id}-M${mi}`, title: m[0],
      videos: m[1].map((t, vi) => ({ id: `${p.id}-${mi}-${vi}`, title: t, url: '', dur: 8 + ((mi * 5 + vi * 7) % 14), desc: '' })),
      docs: m[2].map((d, di) => ({ id: `${p.id}-D${mi}-${di}`, title: d[0], type: d[1], fileId: '', url: '' }))
    })),
    assignments: assignments.map((a, i2) => ({ id: `${p.id}-A${i2}`, title: a[0], desc: a[1], due: day(a[2]), marks: a[3] })),
    quiz: quiz.map((q, i2) => ({ id: `${p.id}-Q${i2}`, mid: `${p.id}-M${q[0]}`, q: q[1], opts: q[2], a: q[3] })),
    papers: SD.PAPERS.map((x, i2) => ({ id: `${p.id}-P${i2}`, title: x[0], type: x[1], q: x[2], mins: x[3] }))
  };
}

function seedBase() {
  if (store.count('programs') === 0) SD.PROGRAMS.forEach((p, i) => store.put('programs', p.id, convertProgram(p, i)));
  if (!store.get('settings', 'site')) store.put('settings', 'site', {
    id: 'site', fee: SITE.fee, email: SITE.email, phone: SITE.phone, address: SITE.address, applicationsOpen: true
  });
  if (!store.get('settings', 'criteria')) store.put('settings', 'criteria', { id: 'criteria', progress: 80, score: 60, attendance: 75 });
  if (users.countRole('admin') === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@finsang.local').toLowerCase();
    const pw = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    users.create({ email, name: process.env.ADMIN_NAME || 'Administrator', role: 'admin', pass: hashPassword(pw) });
    console.log(`\n  Admin account created:  ${email}  /  ${pw}\n  Log in at /login.html and change the password immediately.\n`);
  }
}

function seedDemo() {
  const put = (c, o) => store.put(c, o.id, o);
  const mk = (email, name, role, pw, programs) => { if (!users.byEmail(email)) users.create({ email, name, role, programs, pass: hashPassword(pw) }); };
  mk('trainer@finsang.demo', 'Rohit Mehta', 'trainer', 'trainer123', ['software-development', 'ui-ux-designing']);
  mk('admin@finsang.demo', 'Neha Verma', 'admin', 'admin123', []);
  SD.DEMO_STUDENTS.forEach((d, i) => {
    mk(d[1], d[0], 'student', 'demo123', []);
    put('students', { id: 'S' + (1001 + i), name: d[0], email: d[1], program: d[2], progress: d[3], attendance: d[4], score: d[5], city: d[6], college: d[7],
      joined: day(-45 - i), status: 'Active', dyn: i === 0, feeStatus: 'Paid', feeRef: 'DEMO-' + (1001 + i) });
  });
  SD.JOBS.forEach((j) => put('jobs', j));
  const sd = store.get('programs', 'software-development');
  const w = {}; let n = 0;
  sd.modules.forEach((m) => m.videos.forEach((v) => { if (n < 7) { w[v.id] = true; n++; } }));
  store.put('watched', 'student@finsang.demo', { id: 'student@finsang.demo', map: w });
  const sub = (a, email, name, marks, fb, st, off) => put('submissions', { id: uid('SUB'), email, name, pid: sd.id, aid: a.id, title: a.title, link: 'https://github.com/sample-user/' + a.id, file: '', note: 'Submitted for review.', date: day(off), status: st, marks, feedback: fb });
  sub(sd.assignments[0], 'student@finsang.demo', 'Aarav Sharma', 18, 'Clean semantic markup. Improve spacing consistency on mobile.', 'Evaluated', -26);
  sub(sd.assignments[1], 'student@finsang.demo', 'Aarav Sharma', 26, 'Good use of localStorage. Add input validation and empty states.', 'Evaluated', -12);
  [['ishita@sample.demo', 'Ishita Kapoor'], ['rahul@sample.demo', 'Rahul Verma'], ['riya@sample.demo', 'Riya Bhatt']].forEach(([e, nm]) => sub(sd.assignments[2], e, nm, null, '', 'Submitted', -1));
  put('results', { id: uid('R'), email: 'student@finsang.demo', pid: sd.id, title: 'Month 1 Practice Quiz', score: 4, total: 5, date: day(-20), mode: 'Practice' });
  put('results', { id: uid('R'), email: 'student@finsang.demo', pid: sd.id, title: 'Topic Quiz: JavaScript', score: 3, total: 5, date: day(-9), mode: 'Practice' });
  put('certs', { id: 'FSC-2026-0001', email: 'riya@sample.demo', name: 'Riya Bhatt', pid: 'software-development', date: day(-5), score: 90, demo: true });
  const pass = hashPassword('demo123');
  [['APP-2026-1001', 'Meera Pillai', 'meera@sample.demo', '9000000001', 'Sample College', 'B.Com', '2026', 'Kochi', 'digital-marketing', 'Pending', -1, ''],
   ['APP-2026-1002', 'Tarun Nair', 'tarun@sample.demo', '9000000002', 'Sample University', 'B.Tech / B.E.', '2025', 'Mumbai', 'software-development', 'Under Review', -2, 'Interested in backend.'],
   ['APP-2026-1003', 'Simran Kaur', 'simran@sample.demo', '9000000003', 'Sample Institute', 'BBA / MBA', '2026', 'Amritsar', 'sales-business-development', 'Pending', 0, ''],
   ['APP-2026-1004', 'Yash Tiwari', 'yash@sample.demo', '9000000004', 'Sample College', 'BA / MA', '2024', 'Bhopal', 'ui-ux-designing', 'Rejected', -6, '']]
    .forEach((a) => put('applications', { id: a[0], name: a[1], email: a[2], phone: a[3], college: a[4], qualification: a[5], year: a[6], city: a[7], program: a[8], resume: '', resumeId: '', info: a[11],
      status: a[9], date: day(a[10]), passHash: pass, reason: a[9] === 'Rejected' ? 'Incomplete application (sample).' : '' }));
  put('interviews', { id: 'I1', email: 'student@finsang.demo', jobId: 'J2', date: day(6), time: '11:00 AM', mode: 'Video call' });
  put('jobApps', { id: 'JA1', email: 'student@finsang.demo', name: 'Aarav Sharma', jobId: 'J2', date: day(-3), status: 'Shortlisted' });
  [['N1', 'Class Schedule', 'Live session: REST API design', 'Join the live class this Friday at 5:00 PM. Link will be shared 15 minutes before.', -1, 'all'],
   ['N2', 'Deadline', 'Assignment 3 due soon', 'REST API for a Library is due soon. Upload your work or share a repository link.', -2, 'software-development'],
   ['N3', 'Examination', 'Sprint 2 assessment scheduled', 'The Sprint 2 practice assessment opens next week. Practice with the mock test first.', -3, 'all'],
   ['N4', 'Placement', 'New openings from partners', 'Partner openings are now listed in the Placement section. Placement assistance is not a guarantee of employment.', -4, 'all'],
   ['N5', 'Program Update', 'Industry session with partner mentors', 'Industry mentors from our partner organizations will host an open Q&A next week.', -6, 'all']]
    .forEach((a) => put('announcements', { id: a[0], type: a[1], title: a[2], body: a[3], date: day(a[4]), prog: a[5], by: 'admin' }));
  console.log('Demo data added. Demo logins: admin@finsang.demo/admin123, trainer@finsang.demo/trainer123, student@finsang.demo/demo123');
}

/* `--refresh`: bring an existing database in line with the current seed content (tracks, fee, contact) without touching students or activity. */
function refreshContent() {
  SD.PROGRAMS.forEach((p, i) => store.put('programs', p.id, convertProgram(p, i)));
  store.put('settings', 'site', { ...(store.get('settings', 'site') || { id: 'site', applicationsOpen: true }), id: 'site', ...SITE });
  SD.JOBS.forEach((j) => { if (store.get('jobs', j.id)) store.put('jobs', j.id, j); });
  console.log('Programs, fee and contact details refreshed.');
}

function run(argv) {
  if (argv.includes('--reset')) {
    for (const t of ['docs', 'sessions', 'resets', 'files', 'users']) db.exec(`DELETE FROM ${t}`);
    console.log('Database wiped in', DATA_DIR);
  }
  seedBase();
  if (argv.includes('--refresh')) refreshContent();
  if (argv.includes('--demo')) seedDemo();
}
module.exports = { seedBase, seedDemo, run, day };
if (require.main === module) run(process.argv.slice(2));
