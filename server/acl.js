/* Role-based access rules for the document collections.
   The browser keeps a local copy of the data it is allowed to see and syncs changes back through /api/sync;
   every change is re-validated here, so the client is never trusted. */
const { store } = require('./db');

const COLLS = ['programs', 'students', 'applications', 'submissions', 'results', 'certs', 'jobApps', 'interviews',
  'attendanceLog', 'jobs', 'announcements', 'employers', 'messages'];

class Deny extends Error {}
const deny = (m) => { throw new Deny(m); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const str = (v, max = 5000) => String(v == null ? '' : v).slice(0, max);
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const arr = (v) => (Array.isArray(v) ? v : []);
const slug = /^[a-z0-9][a-z0-9-]{1,60}$/;
const inProg = (u, pid) => arr(u.programs).includes(pid);
const studentOf = (email) => store.all('students').find((s) => s.email === email);

/* ---------- read filters ---------- */
function canRead(user, coll, d) {
  if (!user) return coll === 'programs' && d.published !== false;
  if (user.role === 'admin') return true;
  if (user.role === 'trainer') {
    if (['programs', 'jobs', 'announcements'].includes(coll)) return true;
    if (coll === 'students') return inProg(user, d.program);
    if (['submissions', 'results', 'attendanceLog'].includes(coll)) return inProg(user, d.pid);
    return false;
  }
  // student
  if (coll === 'programs') return d.published !== false;
  if (['jobs', 'announcements'].includes(coll)) return true;
  if (['students', 'submissions', 'results', 'jobApps', 'interviews', 'certs'].includes(coll)) return d.email === user.email;
  return false;
}
function outbound(coll, d) {
  if (coll === 'applications') { const { passHash, ...rest } = d; return rest; }
  return d;
}

/* ---------- program validation ---------- */
const PROG_LISTS = ['skills', 'careers', 'topics', 'outcomes', 'assess', 'eligibility'];
function cleanProgram(p, old) {
  if (!slug.test(str(p.id, 80))) deny('Program id must be lowercase letters, numbers and dashes.');
  if (old && old.id !== p.id) deny('Program id cannot change.');
  const o = {
    id: p.id, name: str(p.name, 160), icon: str(p.icon || '🎓', 8), color: str(p.color || '#e8eefe', 20),
    cat: str(p.cat, 60), months: Math.max(1, Math.min(24, num(p.months, 3))), mode: str(p.mode, 30),
    partner: str(p.partner || 'finsang', 30), mentor: str(p.mentor, 120), short: str(p.short, 600),
    overview: str(p.overview, 4000), live: str(p.live, 3000), published: p.published !== false, order: num(p.order, 0)
  };
  if (!o.name) deny('Program name is required.');
  for (const k of PROG_LISTS) o[k] = arr(p[k]).map((x) => str(x, 300)).filter(Boolean);
  o.roadmap = arr(p.roadmap).map((m) => arr(m).map((x) => str(x, 300)).filter(Boolean));
  o.links = arr(p.links).map((l) => [str(l[0], 200), str(l[1], 500)]).filter((l) => l[0] && /^https?:\/\//i.test(l[1]));
  o.faqs = arr(p.faqs).map((l) => [str(l[0], 300), str(l[1], 1500)]).filter((l) => l[0]);
  Object.assign(o, cleanContent(p));
  return o;
}
function cleanContent(p) {
  const ids = new Set();
  const uniq = (x) => { x = str(x, 80); if (!x || ids.has(x)) deny('Content items need unique ids.'); ids.add(x); return x; };
  const url = (u) => { u = str(u, 800); return u === '' || /^https?:\/\//i.test(u) ? u : ''; };
  return {
    modules: arr(p.modules).map((m) => ({
      id: uniq(m.id), title: str(m.title, 200),
      videos: arr(m.videos).map((v) => ({ id: uniq(v.id), title: str(v.title, 200), url: url(v.url), dur: Math.max(1, num(v.dur, 10)), desc: str(v.desc, 1000) })),
      docs: arr(m.docs).map((d) => ({ id: uniq(d.id), title: str(d.title, 200), type: ['PDF', 'PPT', 'DOC', 'ZIP', 'LINK'].includes(d.type) ? d.type : 'PDF', fileId: str(d.fileId, 80), url: url(d.url) }))
    })),
    assignments: arr(p.assignments).map((a) => ({ id: uniq(a.id), title: str(a.title, 200), desc: str(a.desc, 3000), due: str(a.due, 10), marks: Math.max(1, num(a.marks, 25)), fileId: str(a.fileId, 80) })),
    quiz: arr(p.quiz).map((x) => {
      const opts = arr(x.opts).map((o) => str(o, 300)); const a = num(x.a, 0);
      if (opts.length < 2 || a < 0 || a >= opts.length) deny('Each MCQ needs 2+ options and a valid correct answer.');
      return { id: uniq(x.id), mid: str(x.mid, 80), q: str(x.q, 1000), opts, a };
    }),
    papers: arr(p.papers).map((x) => ({ id: uniq(x.id), title: str(x.title, 200), type: str(x.type, 40), q: Math.max(1, num(x.q, 20)), mins: Math.max(1, num(x.mins, 30)), fileId: str(x.fileId, 80) }))
  };
}

/* ---------- write rules: return the sanitised doc to store ---------- */
const WRITERS = {
  admin: {
    programs: (nd, od) => cleanProgram(nd, od),
    students: (nd, od) => {
      if (!od) deny('Create students from the Students page.');
      return { ...od, ...pick(nd, ['name', 'city', 'college', 'program', 'status', 'attendance', 'progress', 'score', 'feeStatus', 'feeRef', 'phone']),
        attendance: clamp(num(nd.attendance, od.attendance)), email: od.email, id: od.id };
    },
    applications: (nd, od) => {
      if (!od) deny('Applications are created by applicants only.');
      if (!['Pending', 'Under Review', 'Approved', 'Rejected'].includes(nd.status)) deny('Invalid status.');
      if (nd.status === 'Approved' && od.status !== 'Approved') deny('Use the Approve action to create the account.');
      return { ...od, status: nd.status, reason: str(nd.reason, 500), notes: str(nd.notes, 1000) };
    },
    submissions: (nd, od) => { if (!od) deny('Not allowed.'); return { ...od, marks: nd.marks == null ? null : num(nd.marks), feedback: str(nd.feedback, 3000), status: nd.status === 'Evaluated' ? 'Evaluated' : 'Submitted' }; },
    results: (nd, od) => { if (od) deny('Results are immutable.'); return nd; },
    certs: (nd, od) => { if (!od) deny('Use the Generate action.'); return od; },
    jobApps: (nd, od) => { if (!od) deny('Not allowed.'); return { ...od, status: str(nd.status, 40) }; },
    interviews: (nd) => ({ id: str(nd.id, 40), email: str(nd.email, 200), jobId: str(nd.jobId, 40), date: str(nd.date, 10), time: str(nd.time, 20), mode: str(nd.mode, 30) }),
    attendanceLog: (nd) => ({ id: str(nd.id, 40), pid: str(nd.pid, 80), date: str(nd.date, 10), present: arr(nd.present).map(String), absent: arr(nd.absent).map(String) }),
    jobs: (nd) => {
      const j = { id: str(nd.id, 40), title: str(nd.title, 200), company: str(nd.company, 200), org: str(nd.org || 'finsang', 30), type: nd.type === 'Internship' ? 'Internship' : 'Job',
        loc: str(nd.loc, 200), prog: str(nd.prog || 'any', 80), min: clamp(num(nd.min, 60)), desc: str(nd.desc, 3000), elig: arr(nd.elig).map((x) => str(x, 300)).filter(Boolean) };
      if (!j.title) deny('Job title is required.'); return j;
    },
    announcements: (nd, od) => {
      const a = { id: str(nd.id, 40), type: str(nd.type, 40), title: str(nd.title, 200), body: str(nd.body, 3000), date: str(nd.date, 10), prog: str(nd.prog || 'all', 80), by: od ? od.by : 'admin' };
      if (!a.title) deny('Title is required.'); return a;
    },
    employers: (nd) => ({ id: str(nd.id, 40), name: str(nd.name, 200), contact: str(nd.contact, 200), phone: str(nd.phone, 40), notes: str(nd.notes, 1000) }),
    messages: (nd, od) => { if (!od) deny('Not allowed.'); return { ...od, read: !!nd.read }; }
  },
  trainer: {
    programs: (nd, od, u) => {
      if (!od || !inProg(u, od.id)) deny('You can only edit your assigned programs.');
      return { ...od, ...cleanContent(nd), links: cleanProgram({ ...od, links: nd.links }, od).links };
    },
    submissions: (nd, od, u) => {
      if (!od || !inProg(u, od.pid)) deny('Not your student.');
      return { ...od, marks: nd.marks == null ? null : num(nd.marks), feedback: str(nd.feedback, 3000), status: nd.status === 'Evaluated' ? 'Evaluated' : od.status };
    },
    students: (nd, od, u) => {
      if (!od || !inProg(u, od.program)) deny('Not your student.');
      return { ...od, attendance: clamp(num(nd.attendance, od.attendance)) };
    },
    attendanceLog: (nd, od, u) => {
      if (od) deny('Attendance records cannot be edited.');
      if (!inProg(u, nd.pid)) deny('Not your program.');
      return { id: str(nd.id, 40), pid: nd.pid, date: str(nd.date, 10), present: arr(nd.present).map(String), absent: arr(nd.absent).map(String) };
    },
    announcements: (nd, od, u) => {
      if (od) deny('Only admins can edit announcements.');
      if (nd.prog !== 'all' && !inProg(u, nd.prog)) deny('Not your program.');
      return { id: str(nd.id, 40), type: str(nd.type, 40), title: str(nd.title, 200), body: str(nd.body, 3000), date: str(nd.date, 10), prog: str(nd.prog, 80), by: u.email };
    }
  },
  student: {
    submissions: (nd, od, u) => {
      const me = studentOf(u.email); if (!me) deny('No enrollment.');
      if (od && (od.email !== u.email || od.status === 'Evaluated')) deny('Cannot change this submission.');
      const prog = store.get('programs', me.program);
      const a = prog && arr(prog.assignments).find((x) => x.id === nd.aid);
      if (!a) deny('Unknown assignment.');
      return { id: str(nd.id, 40), email: u.email, name: u.name, pid: me.program, aid: a.id, title: a.title, link: /^https?:\/\//i.test(nd.link) ? str(nd.link, 800) : '',
        file: str(nd.file, 200), fileId: str(nd.fileId, 80), note: str(nd.note, 2000), date: str(nd.date, 10), status: 'Submitted', marks: null, feedback: '' };
    },
    results: (nd, od, u) => {
      if (od) deny('Results are immutable.');
      const total = Math.max(1, num(nd.total, 1)), score = Math.max(0, Math.min(total, num(nd.score, 0)));
      return { id: str(nd.id, 40), email: u.email, pid: str(nd.pid, 80), title: str(nd.title, 200), score, total, date: str(nd.date, 10), mode: str(nd.mode, 20) };
    },
    jobApps: (nd, od, u) => {
      if (od) deny('Cannot change an application.');
      if (!store.get('jobs', nd.jobId)) deny('Unknown job.');
      if (store.all('jobApps').some((a) => a.email === u.email && a.jobId === nd.jobId)) deny('Already applied.');
      return { id: str(nd.id, 40), email: u.email, name: u.name, jobId: nd.jobId, date: str(nd.date, 10), status: 'Applied' };
    },
    students: (nd, od, u) => {
      if (!od || od.email !== u.email) deny('Not allowed.');
      if (!store.get('programs', nd.program)) deny('Unknown program.');
      return { ...od, program: nd.program, resume: str(nd.resume, 200), resumeId: str(nd.resumeId, 80) };
    }
  }
};
const clamp = (n) => Math.max(0, Math.min(100, n));
const pick = (o, ks) => Object.fromEntries(ks.filter((k) => k in o).map((k) => [k, typeof o[k] === 'string' ? str(o[k], 300) : o[k]]));

function validateWrite(user, coll, nd, od) {
  if (!user) deny('Not logged in.');
  if (!COLLS.includes(coll)) deny('Unknown collection.');
  const w = WRITERS[user.role] && WRITERS[user.role][coll];
  if (!w) deny('You are not allowed to change ' + coll + '.');
  if (!nd || typeof nd !== 'object' || !nd.id) deny('Invalid record.');
  if (od && !(user.role === 'admin' || canRead(user, coll, od))) deny('Not allowed.');
  return w(clone(nd), od, user);
}

function validateDelete(user, coll, od) {
  if (!od) return;
  if (user.role !== 'admin') deny('Only admins can delete records.');
  if (coll === 'programs') {
    if (store.all('students').some((s) => s.program === od.id)) deny('Cannot delete a program that has enrolled students. Move them first or unpublish it.');
  }
  if (coll === 'students') deny('Delete students from the Students page.');
  if (coll === 'applications' || coll === 'jobs' || coll === 'announcements' || coll === 'messages' || coll === 'employers' ||
      coll === 'certs' || coll === 'jobApps' || coll === 'interviews' || coll === 'submissions' || coll === 'results' || coll === 'attendanceLog' || coll === 'programs') return;
  deny('Not allowed.');
}

module.exports = { COLLS, Deny, canRead, outbound, validateWrite, validateDelete, clamp };
