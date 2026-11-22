/* SQLite storage (built-in node:sqlite, no native deps).
   Domain records are stored as JSON documents in `docs(coll,id,data)`; accounts, sessions and files have real tables. */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'finsang.db'));
db.exec(`
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','trainer','admin')),
  programs TEXT NOT NULL DEFAULT '[]',
  pass TEXT NOT NULL,
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS resets(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS docs(
  coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(coll,id)
);
CREATE TABLE IF NOT EXISTS files(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, size INTEGER NOT NULL, kind TEXT NOT NULL, owner TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const q = (sql) => db.prepare(sql);
const stm = {
  all: q('SELECT id,data FROM docs WHERE coll=? ORDER BY rowid'),
  get: q('SELECT data FROM docs WHERE coll=? AND id=?'),
  put: q('INSERT INTO docs(coll,id,data) VALUES(?,?,?) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data'),
  del: q('DELETE FROM docs WHERE coll=? AND id=?'),
  count: q('SELECT COUNT(*) AS n FROM docs WHERE coll=?')
};

const store = {
  all: (coll) => stm.all.all(coll).map((r) => JSON.parse(r.data)),
  get: (coll, id) => { const r = stm.get.get(coll, String(id)); return r ? JSON.parse(r.data) : null; },
  put: (coll, id, obj) => stm.put.run(coll, String(id), JSON.stringify(obj)),
  del: (coll, id) => stm.del.run(coll, String(id)),
  count: (coll) => stm.count.get(coll).n,
  tx(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const r = fn(); db.exec('COMMIT'); return r; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  }
};

const userRow = (r) => r && ({ id: r.id, email: r.email, name: r.name, role: r.role, programs: JSON.parse(r.programs || '[]'), pass: r.pass, created: r.created });
const users = {
  byEmail: (email) => userRow(q('SELECT * FROM users WHERE email=?').get(String(email).trim().toLowerCase())),
  byId: (id) => userRow(q('SELECT * FROM users WHERE id=?').get(id)),
  all: () => q('SELECT * FROM users ORDER BY id').all().map(userRow),
  create({ email, name, role, programs = [], pass }) {
    const r = q('INSERT INTO users(email,name,role,programs,pass) VALUES(?,?,?,?,?)')
      .run(String(email).trim().toLowerCase(), name, role, JSON.stringify(programs), pass);
    return Number(r.lastInsertRowid);
  },
  update(id, f) {
    const u = users.byId(id); if (!u) return;
    const n = { ...u, ...f };
    q('UPDATE users SET email=?,name=?,role=?,programs=?,pass=? WHERE id=?')
      .run(n.email, n.name, n.role, JSON.stringify(n.programs || []), n.pass, id);
  },
  remove: (id) => q('DELETE FROM users WHERE id=?').run(id),
  countRole: (role) => q('SELECT COUNT(*) AS n FROM users WHERE role=?').get(role).n
};

module.exports = { db, store, users, q, DATA_DIR, UPLOAD_DIR: path.join(DATA_DIR, 'uploads') };
