# Finsang Skill Program Portal

Public website, student portal, trainer panel and a full admin console, backed by a real Node.js + SQLite server.

## Run it

Requires Node.js 22.13+ (uses the built-in `node:sqlite`; the only npm dependency is `express`).

```bash
npm install
npm start                  # http://localhost:3000
```

First start creates `data/finsang.db`, the 5 programs with their curriculum, default settings, and one admin:

| | |
|---|---|
| Email | `admin@finsang.local` (or `ADMIN_EMAIL`) |
| Password | `ChangeMe123!` (or `ADMIN_PASSWORD`) |

Log in at `/login.html` and change the password (sidebar → *Change password*). See `.env.example` for all options.

Want sample data to explore? `SEED_DEMO=1 npm start` (fresh DB) or `npm run seed:demo` adds demo students, a trainer and activity
(`admin@finsang.demo / admin123`, `trainer@finsang.demo / trainer123`, `student@finsang.demo / demo123`).
`npm run reset` wipes the database. `npm test` runs the API smoke test on a throwaway database.

## What the admin can manage (`/admin-overview.html`)

| Area | Capabilities |
|---|---|
| Students & Applications | Review / approve / reject applications (approval creates the login); add, edit, suspend, delete students; reset passwords; fee status & reference; resume downloads; CSV export |
| Programs | Create, edit every field (curriculum, roadmap, skills, FAQs, links…), reorder, publish/hide, delete |
| Learning Content | Modules (add/rename/reorder/delete), videos (YouTube/Vimeo/mp4), real file uploads for materials, assignments (with reference files) |
| Assessments | MCQ question bank, sample/previous/mock papers (PDF upload), evaluate submissions, completion criteria |
| Certificates | Eligibility view, issue with unique ID (override allowed), revoke, public verification |
| Placement | Jobs/internships, applications & status, interviews, employers |
| Announcements | Targeted to all students or one program |
| Trainers & Staff | Create trainer/admin accounts, assign programs, reset passwords, delete (last-admin protected) |
| Messages | Contact-form inbox |
| Settings | Fee, contact details, open/close applications, one-click JSON backup |

Trainers get a scoped panel (their programs only): content, attendance, evaluation, announcements.
Students get the learning portal: videos, materials, quizzes, assignment upload, certificates, placement.

## How it is built

```
server/index.js   Express app: static files + JSON API (login, apply, sync, upload, admin actions)
server/acl.js     Per-role read filters and write validation for every collection
server/auth.js    scrypt password hashing, httpOnly session cookies, rate limiting
server/db.js      SQLite (users, sessions, files, JSON documents)
server/seed*.js   First-run content
public/           Front-end (multi-page; js/store.js syncs a local copy of your data with the API)
data/             Database + uploads (created at runtime, git-ignored)
```

The browser holds a copy of only the records its role may read. Edits are diffed and sent to `POST /api/sync`,
where **every change is re-validated server-side** (students can only write their own submissions/results;
trainers only their programs; identity fields, marks, certificates and fees cannot be forged from the client).

## Going live — read this

* Serve behind HTTPS and set `COOKIE_SECURE=1` (and `TRUST_PROXY=1` behind a proxy). Keep `data/` on persistent storage and back it up
  (Settings → *Download backup* exports records; copy `data/uploads` for files).
* **Payments are not integrated.** The fee is shown and tracked per student (Pending/Paid + reference) which the admin updates manually;
  connect a gateway (Razorpay, Stripe…) if you need online payment.
* **Email is not integrated.** "Forgot password" prints a reset link to the server log; admins can also set a new password for any user.
  Plug a mailer into `POST /api/forgot` in `server/index.js` to email it.
* Partner/organisation details (`public/js/data.js`), FAQ copy and legal pages (`public/js/pages-public.js`) are static text you should review/edit
  in code; the legal pages are generic drafts and should be reviewed by counsel.
* Video playback uses embeds/links you provide; uploaded videos beyond 25 MB should be hosted on YouTube/Vimeo.

## Hostinger / shared hosting (PHP + MySQL edition)

The same portal also ships as a PHP 8.1+ / MySQL backend (`php/`), for shared hosting plans that cannot run Node.
The front-end and the API contract are identical; only the server is different.

```bash
npm run build:php          # -> dist/finsang-hostinger.zip (public site + api.php + installer)
```

1. hPanel → **Databases → MySQL Databases**: create a database and user, note the name, user and password.
2. hPanel → **Websites → your domain → File Manager**: open `public_html`, upload `finsang-hostinger.zip` and **Extract** it there
   (the `.htaccess` file must end up in `public_html`; enable "show hidden files" to check). Make sure PHP is **8.1 or newer** (Advanced → PHP Configuration).
3. Open `https://yourdomain.com/install.php`, enter the database details and choose your admin email and password. Leave "demo data" unticked for a real launch.
4. Delete `install.php` from File Manager, then log in at `/login.html`.

Notes: uploads and config live in `_app/` (blocked from the web by `.htaccess`); back up the MySQL database and `_app/uploads`.
Password-reset emails use PHP `mail()` if you set `mail_from` in `_app/config.php`; otherwise the link goes to the PHP error log and an admin can set a new password.
Test it locally: install into a MySQL database, run `php -S 127.0.0.1:8080 -t dist/hostinger php/dev-router.php`, then `TEST_URL=http://127.0.0.1:8080 npm test`.

## Deploying

The app is a single Node process that stores data in SQLite and uploaded files on disk, so it needs a host with a **persistent disk**.
Serverless hosts (Vercel, Netlify, Cloudflare Pages) will **not** work.

| Option | How |
|---|---|
| **Render** | Push to GitHub → New *Blueprint* → it reads `render.yaml` (Docker + 5 GB disk at `/data`). Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BASE_URL`. |
| **Railway / Fly.io** | Deploy the `Dockerfile`, attach a volume mounted at `/data`, set the same env vars. |
| **VPS** (DigitalOcean, Hetzner, AWS Lightsail) | Install Node 22, `git clone`, `npm ci --omit=dev`, run with `pm2 start server/index.js`, put Caddy or nginx in front for HTTPS. Set `COOKIE_SECURE=1 TRUST_PROXY=1`. |

Docker locally: `docker build -t finsang . && docker run -p 3000:3000 -v finsang-data:/data -e ADMIN_EMAIL=you@x.com -e ADMIN_PASSWORD='long-password' finsang`.
Back up the `/data` volume (database + `uploads/`) regularly.

### Fly.io

```bash
brew install flyctl && fly auth login
fly launch --no-deploy --copy-config --name <unique-app-name>   # uses fly.toml
fly volumes create data --size 3 --region sin                   # persistent disk (SQLite + uploads)
fly secrets set ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' BASE_URL=https://<unique-app-name>.fly.dev
fly deploy --ha=false                                           # one machine: SQLite must not be shared
```
