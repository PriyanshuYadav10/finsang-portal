<?php
/* Finsang portal JSON API (PHP edition of server/index.js). All /api/* requests are rewritten here by .htaccess. */
declare(strict_types=0);
require __DIR__ . '/_app/lib/acl.php';
require __DIR__ . '/_app/lib/auth.php';
require __DIR__ . '/_app/lib/seed.php';

send_headers();
header('Cache-Control: no-store');
set_exception_handler(function (Throwable $e) {
  if ($e instanceof Deny) out(['error' => $e->getMessage()], 403);
  error_log('[finsang] ' . $e);
  out(['error' => 'Server error.'], 500);
});
ini_set('display_errors', '0');

$method = $_SERVER['REQUEST_METHOD'];
$path = rtrim((string)parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$path = preg_replace('#^/api#', '', $path) ?: '/';
$user = load_user();

$isUpload = $path === '/upload';
if (in_array($method, ['POST', 'PUT'], true) && !$isUpload && !preg_match('#^application/json#', $_SERVER['CONTENT_TYPE'] ?? ''))
  fail('JSON required.', 415);
$body = [];
if (in_array($method, ['POST', 'PUT', 'DELETE'], true) && !$isUpload) {
  $raw = file_get_contents('php://input');
  if (strlen($raw) > 5 * 1024 * 1024) fail('Request too large.', 413);
  if ($raw !== '' && $raw !== false) { $body = jdec($raw); if (!is_array($body)) fail('Invalid JSON.', 400); }
}
function B(string $k, $d = null) { global $body; return $body[$k] ?? $d; }
function clean_user(?array $u) { return $u ? ['email' => $u['email'], 'name' => $u['name'], 'role' => $u['role'], 'programs' => $u['programs']] : null; }
function route(string $m, string $pattern, callable $fn) {
  global $method, $path;
  if ($method !== $m) return;
  if (preg_match('#^' . $pattern . '$#', $path, $mm)) { array_shift($mm); $fn(...$mm); exit; }
}

/* ---------------- state for the browser ---------------- */
function build_state(?array $user): array {
  $S = [];
  foreach (COLLS as $c) $S[$c] = array_values(array_map(fn($d) => outbound($c, $d), array_filter(store::all($c), fn($d) => can_read($user, $c, $d))));
  usort($S['programs'], fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
  $S['criteria'] = store::get('settings', 'criteria');
  $S['site'] = store::get('settings', 'site');
  $S['content'] = store::get('settings', 'content') ?: new stdClass;
  $S['watched'] = []; $S['certReq'] = []; $S['users'] = [];
  if ($user && $user['role'] === 'student') {
    $w = store::get('watched', $user['email']); if ($w) $S['watched'][$user['email']] = $w['map'];
    $S['certReq'] = store::get('certReq', $user['email']) ? [$user['email']] : [];
  }
  if ($user && $user['role'] === 'admin') {
    foreach (store::all('watched') as $w) $S['watched'][$w['id']] = $w['map'];
    $S['certReq'] = array_map(fn($c) => $c['id'], store::all('certReq'));
    $S['users'] = array_values(array_map(fn($u) => ['id' => $u['id']] + clean_user($u) + ['created' => $u['created']], array_filter(users::all(), fn($u) => $u['role'] !== 'student')));
  }
  if (!$user) $S['site'] = ['fee' => $S['site']['fee'], 'email' => $S['site']['email'], 'phone' => $S['site']['phone'], 'address' => $S['site']['address'], 'applicationsOpen' => $S['site']['applicationsOpen']];
  $S['watched'] = (object)array_map(fn($m) => (object)$m, $S['watched']);
  return $S;
}
route('GET', '/bootstrap', function () use ($user) { out(['me' => clean_user($user), 'state' => build_state($user)]); });

/* ---------------- auth ---------------- */
route('POST', '/login', function () {
  limit('login', 10, 300000);
  $email = strtolower(strt(B('email'), 200)); $pass = (string)B('password', '');
  $u = users::byEmail($email);
  if ($u && verify_password($pass, $u['pass'])) {
    if ($u['role'] === 'student') foreach (store::all('students') as $s)
      if (($s['email'] ?? null) === $u['email'] && ($s['status'] ?? null) === 'Suspended') fail('Your account is suspended. Please contact the administrator.', 403);
    create_session($u['id']);
    out(['me' => clean_user($u)]);
  }
  foreach (store::all('applications') as $a)
    if (($a['email'] ?? null) === $email && !empty($a['passHash']) && verify_password($pass, $a['passHash']) && $a['status'] !== 'Approved')
      fail('Your application (' . $a['id'] . ') is "' . $a['status'] . '". Dashboard access is enabled after admin approval.', 403, ['appId' => $a['id'], 'email' => $email]);
  fail('Invalid email or password.', 401);
});
route('POST', '/logout', function () { destroy_session(); out(['ok' => true]); });

route('POST', '/password', function () use ($user) {
  require_user($user); limit('pw', 10, 600000);
  $pw = (string)B('password', '');
  if (!verify_password((string)B('current', ''), $user['pass'])) fail('Current password is incorrect.', 400);
  if (strlen($pw) < 8) fail('New password must be at least 8 characters.', 400);
  users::update($user['id'], ['pass' => hash_password($pw)]);
  out(['ok' => true]);
});

route('POST', '/forgot', function () {
  limit('forgot', 5, 600000);
  $u = users::byEmail(strt(B('email'), 200));
  if ($u) {
    $t = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    q('INSERT INTO resets(token,user_id,expires) VALUES(?,?,?)', [sha($t), $u['id'], now_ms() + 3600000]);
    $base = rtrim((string)cfg('base_url', ''), '/') ?: ((is_https() ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $link = $base . '/forgot.html?token=' . $t;
    // No mail server is wired in: the link is logged and, if mail() works on the host, emailed.
    error_log("[password reset] {$u['email']}: $link");
    if (cfg('mail_from')) @mail($u['email'], 'Reset your Finsang password', "Use this link within one hour to choose a new password:\n\n$link\n\nIf you did not ask for this, ignore this email.", 'From: ' . cfg('mail_from'));
  }
  out(['ok' => true]);
});
route('POST', '/reset', function () {
  limit('reset', 10, 600000);
  $pw = (string)B('password', '');
  if (strlen($pw) < 8) fail('Password must be at least 8 characters.', 400);
  $r = q('SELECT user_id,expires FROM resets WHERE token=?', [sha((string)B('token', ''))])->fetch();
  if (!$r || (int)$r['expires'] < now_ms()) fail('This reset link is invalid or has expired.', 400);
  users::update((int)$r['user_id'], ['pass' => hash_password($pw)]);
  q('DELETE FROM resets WHERE user_id=?', [$r['user_id']]); q('DELETE FROM sessions WHERE user_id=?', [$r['user_id']]);
  out(['ok' => true]);
});

/* ---------------- public: apply / track / verify / contact ---------------- */
route('POST', '/apply', function () {
  limit('apply', 10, 3600000);
  $site = store::get('settings', 'site');
  if (empty($site['applicationsOpen'])) fail('Applications are currently closed.');
  $f = ['name' => strt(B('name'), 120), 'email' => strtolower(strt(B('email'), 200)), 'phone' => strt(B('phone'), 20), 'city' => strt(B('city'), 80), 'college' => strt(B('college'), 160),
    'qualification' => strt(B('qualification'), 60), 'year' => strt(B('year'), 6), 'program' => strt(B('program'), 80), 'info' => strt(B('info'), 1500)];
  foreach (['name', 'email', 'phone', 'city', 'college', 'qualification', 'year', 'program'] as $k) if ($f[$k] === '') fail('Please fill all required fields.');
  if (!emailOk($f['email'])) fail('Enter a valid email address.');
  if (!preg_match('/^[0-9+\- ]{10,15}$/', $f['phone'])) fail('Enter a valid mobile number.');
  $pw = (string)B('password', '');
  if (strlen($pw) < 8) fail('Password must be at least 8 characters.');
  $prog = store::get('programs', $f['program']);
  if (!$prog || ($prog['published'] ?? true) === false) fail('Unknown program.');
  if (users::byEmail($f['email'])) fail('An account with this email already exists. Please log in.', 409);
  $apps = store::all('applications');
  foreach ($apps as $a) if (($a['email'] ?? null) === $f['email'] && $a['status'] !== 'Rejected') fail('An application with this email is already in progress. Use Track Application.', 409);
  $resume = ''; $resumeId = '';
  if (B('resumeId')) {
    $file = q('SELECT * FROM files WHERE id=?', [str(B('resumeId'), 80)])->fetch();
    if ($file && $file['kind'] === 'resume') { $resumeId = $file['id']; $resume = $file['name']; }
  }
  $n = 1000; foreach ($apps as $a) { $p = explode('-', (string)$a['id']); $n = max($n, (int)($p[2] ?? 0)); } $n++;
  $id = 'APP-' . gmdate('Y') . '-' . $n;
  store::put('applications', $id, $f + ['id' => $id, 'resume' => $resume, 'resumeId' => $resumeId, 'status' => 'Pending', 'date' => day(0), 'reason' => '', 'passHash' => hash_password($pw)]);
  out(['id' => $id]);
});
route('POST', '/track', function () {
  limit('track', 30, 600000);
  $id = strtoupper(strt(B('id'), 40)); $email = strtolower(strt(B('email'), 200));
  $a = store::get('applications', $id);
  if (!$a || $a['email'] !== $email) fail('No application found for that ID and email.', 404);
  out(['id' => $a['id'], 'name' => $a['name'], 'program' => $a['program'], 'date' => $a['date'], 'status' => $a['status'], 'reason' => $a['reason'] ?? '']);
});
route('GET', '/verify/([^/]+)', function ($id) {
  limit('verify', 60, 600000);
  $c = store::get('certs', strtoupper(str(urldecode($id), 40)));
  if (!$c) out(['valid' => false], 404);
  $p = store::get('programs', $c['pid']);
  out(['valid' => true, 'name' => $c['name'], 'program' => $p ? $p['name'] : $c['pid'], 'date' => $c['date'], 'demo' => !empty($c['demo'])]);
});
route('POST', '/contact', function () {
  limit('contact', 5, 3600000);
  $m = ['id' => uid('MSG'), 'name' => strt(B('name'), 120), 'email' => strt(B('email'), 200), 'message' => strt(B('message'), 3000), 'date' => day(0), 'read' => false];
  if ($m['name'] === '' || !emailOk($m['email']) || $m['message'] === '') fail('Please fill in your name, a valid email and a message.');
  store::put('messages', $m['id'], $m);
  out(['ok' => true]);
});

/* ---------------- sync (role-checked writes) ---------------- */
route('POST', '/sync', function () use ($user) {
  require_user($user);
  $ch = B('changes', []); if (!is_array($ch)) $ch = [];
  store::tx(function () use ($user, $ch) {
    foreach ($ch as $coll => $c) {
      if (!in_array($coll, COLLS, true)) deny('Unknown collection.');
      if (!is_array($c)) continue;
      foreach (arr($c['del'] ?? null) as $id) { validate_delete($user, $coll, store::get($coll, $id)); store::del($coll, $id); }
      foreach (arr($c['upsert'] ?? null) as $d) {
        $od = (is_array($d) && isset($d['id']) && is_scalar($d['id'])) ? store::get($coll, $d['id']) : null;
        $nd = validate_write($user, $coll, $d, $od);
        store::put($coll, $nd['id'], $nd);
      }
    }
    $w = B('watched');
    if (is_array($w) && $user['role'] === 'student') store::put('watched', $user['email'], ['id' => $user['email'], 'map' => (object)$w]);
    $cr = B('certReq');
    if (is_array($cr)) {
      if ($user['role'] === 'student' && !empty($cr['add'])) { if (!student_of($user['email'])) deny('No enrollment.'); store::put('certReq', $user['email'], ['id' => $user['email']]); }
      if ($user['role'] === 'admin') foreach (arr($cr['remove'] ?? null) as $e) store::del('certReq', $e);
    }
    if (array_key_exists('content', $GLOBALS['body'])) {
      if ($user['role'] !== 'admin') deny('Only admins can change website content.');
      $cc = clean_site_content(B('content'));
      store::put('settings', 'content', ['id' => 'content'] + $cc);
    }
    $crit = B('criteria'); $site = B('site');
    if (is_array($crit) || is_array($site)) {
      if ($user['role'] !== 'admin') deny('Only admins can change settings.');
      if (is_array($crit)) store::put('settings', 'criteria', ['id' => 'criteria', 'progress' => clamp(num($crit['progress'] ?? 0)), 'score' => clamp(num($crit['score'] ?? 0)), 'attendance' => clamp(num($crit['attendance'] ?? 0))]);
      if (is_array($site)) store::put('settings', 'site', ['id' => 'site', 'fee' => max(0, (int)round((float)num($site['fee'] ?? 0))), 'email' => strt($site['email'] ?? '', 200), 'phone' => strt($site['phone'] ?? '', 60),
        'address' => strt($site['address'] ?? '', 400), 'applicationsOpen' => !empty($site['applicationsOpen'])]);
    }
  });
  out(['ok' => true]);
});

/* ---------------- files ---------------- */
const EXT = ['material' => ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'zip', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'mp4'],
  'submission' => ['pdf', 'doc', 'docx', 'zip', 'txt', 'png', 'jpg', 'jpeg', 'ppt', 'pptx', 'xls', 'xlsx'], 'resume' => ['pdf', 'doc', 'docx']];
const MIMES = ['pdf' => 'application/pdf', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'mp4' => 'video/mp4', 'txt' => 'text/plain; charset=utf-8'];

route('POST', '/upload', function () use ($user) {
  $kind = (string)($_GET['kind'] ?? '');
  if (!isset(EXT[$kind])) fail('Bad upload kind.');
  if (!$user && $kind !== 'resume') fail('Please log in.', 401);
  if ($user && (($kind === 'material' && $user['role'] === 'student') || ($kind === 'submission' && $user['role'] !== 'student'))) fail('Not allowed.', 403);
  if (!$user) limit('upl', 10, 3600000);
  $max = $kind === 'resume' ? 5 * 1048576 : 25 * 1048576;
  if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $max) fail('File too large.', 413);
  $in = fopen('php://input', 'rb'); $data = stream_get_contents($in, $max + 1); fclose($in);
  if ($data === false || $data === '') fail('Empty file.');
  if (strlen($data) > $max) fail('File too large.', 413);
  $name = preg_replace('/[^\w.\- ()]/u', '_', basename(str($_GET['name'] ?? '', 200)));
  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if (!in_array($ext, EXT[$kind], true)) fail('File type not allowed. Allowed: ' . implode(', ', EXT[$kind]));
  $id = bin2hex(random_bytes(12));
  if (file_put_contents(upload_dir() . '/' . $id, $data) === false) fail('Could not store the file.', 500);
  q('INSERT INTO files(id,name,size,kind,owner) VALUES(?,?,?,?,?)', [$id, $name, strlen($data), $kind, $user ? $user['email'] : '']);
  out(['id' => $id, 'name' => $name, 'size' => strlen($data)]);
});
route('GET', '/files/([^/]+)', function ($fid) use ($user) {
  require_user($user);
  $f = preg_match('/^[a-f0-9]{24}$/', $fid) ? q('SELECT * FROM files WHERE id=?', [$fid])->fetch() : null;
  $file = $f ? upload_dir() . '/' . $f['id'] : '';
  if (!$f || !is_file($file)) fail('Not found.', 404);
  $ok = $user['role'] === 'admin' || $f['kind'] === 'material' || $f['owner'] === $user['email'] || ($user['role'] === 'trainer' && $f['kind'] !== 'material');
  if (!$ok) fail('Not allowed.', 403);
  $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
  $inline = (($_GET['dl'] ?? '') !== '1') && isset(MIMES[$ext]);
  $size = filesize($file); $start = 0; $end = $size - 1;
  if (preg_match('/^bytes=(\d*)-(\d*)$/', $_SERVER['HTTP_RANGE'] ?? '', $m) && ($m[1] !== '' || $m[2] !== '')) {
    if ($m[1] === '') { $start = max(0, $size - (int)$m[2]); } else { $start = (int)$m[1]; if ($m[2] !== '') $end = min($end, (int)$m[2]); }
    if ($start > $end || $start >= $size) { http_response_code(416); header("Content-Range: bytes */$size"); exit; }
    http_response_code(206); header("Content-Range: bytes $start-$end/$size");
  }
  header_remove('Content-Type');
  header('Content-Type: ' . (MIMES[$ext] ?? 'application/octet-stream'));
  header("Content-Disposition: " . ($inline ? 'inline' : 'attachment') . "; filename*=UTF-8''" . rawurlencode($f['name']));
  header('Cache-Control: private, max-age=300'); header('Accept-Ranges: bytes'); header('Content-Length: ' . ($end - $start + 1));
  $fh = fopen($file, 'rb'); fseek($fh, $start); $left = $end - $start + 1;
  while ($left > 0 && !feof($fh)) { $chunk = fread($fh, min(8192, $left)); echo $chunk; $left -= strlen($chunk); }
  fclose($fh);
});

/* ---------------- admin actions ---------------- */
function need_pw($p): string { if (strlen((string)$p) < 8) deny('Password must be at least 8 characters.'); return hash_password((string)$p); }
function prog_list($v): array { return array_values(array_filter(arr($v), fn($id) => is_string($id) && store::get('programs', $id))); }
function next_student_id(): string { $m = 1000; foreach (store::all('students') as $s) $m = max($m, (int)substr((string)$s['id'], 1)); return 'S' . ($m + 1); }

if (strncmp($path, '/admin/', 7) === 0) {
  require_role($user, 'admin');

  route('POST', '/admin/users', function () {
    $email = strtolower(strt(B('email'), 200)); $role = B('role');
    if (!in_array($role, ['trainer', 'admin'], true)) deny('Role must be trainer or admin.');
    if (strt(B('name'), 120) === '' || !emailOk($email)) deny('Name and a valid email are required.');
    if (users::byEmail($email)) deny('That email is already registered.');
    users::create($email, strt(B('name'), 120), $role, $role === 'trainer' ? prog_list(B('programs')) : [], need_pw(B('password')));
    out(['ok' => true]);
  });
  route('PUT', '/admin/users/(\d+)', function ($id) use ($user) {
    $u = users::byId((int)$id);
    if (!$u || $u['role'] === 'student') deny('User not found.');
    $f = [];
    if (B('name')) $f['name'] = strt(B('name'), 120);
    $role = B('role');
    if ($role && $role !== $u['role']) {
      if (!in_array($role, ['trainer', 'admin'], true)) deny('Invalid role.');
      if ($u['role'] === 'admin' && users::countRole('admin') < 2) deny('There must be at least one admin.');
      if ($u['id'] === $user['id']) deny('You cannot change your own role.');
      $f['role'] = $role;
    }
    if (is_array(B('programs'))) $f['programs'] = prog_list(B('programs'));
    if (B('password')) $f['pass'] = need_pw(B('password'));
    users::update($u['id'], $f);
    if (B('password')) q('DELETE FROM sessions WHERE user_id=?', [$u['id']]);
    out(['ok' => true]);
  });
  route('DELETE', '/admin/users/(\d+)', function ($id) use ($user) {
    $u = users::byId((int)$id);
    if (!$u || $u['role'] === 'student') deny('User not found.');
    if ($u['id'] === $user['id']) deny('You cannot delete your own account.');
    if ($u['role'] === 'admin' && users::countRole('admin') < 2) deny('There must be at least one admin.');
    users::remove($u['id']); out(['ok' => true]);
  });

  route('POST', '/admin/students', function () {
    $email = strtolower(strt(B('email'), 200));
    if (strt(B('name'), 120) === '' || !emailOk($email)) deny('Name and a valid email are required.');
    if (!is_string(B('program')) || !store::get('programs', B('program'))) deny('Choose a program.');
    if (users::byEmail($email)) deny('That email is already registered.');
    $pass = need_pw(B('password'));
    store::tx(function () use ($email, $pass) {
      users::create($email, strt(B('name'), 120), 'student', [], $pass);
      $id = next_student_id();
      store::put('students', $id, ['id' => $id, 'name' => strt(B('name'), 120), 'email' => $email, 'program' => B('program'), 'progress' => 0, 'attendance' => 100, 'score' => 0,
        'city' => strt(B('city'), 80), 'college' => strt(B('college'), 160), 'phone' => strt(B('phone'), 20), 'joined' => day(0), 'status' => 'Active', 'dyn' => true,
        'feeStatus' => B('feeStatus') === 'Paid' ? 'Paid' : 'Pending', 'feeRef' => strt(B('feeRef'), 80)]);
    });
    out(['ok' => true]);
  });
  route('PUT', '/admin/students/([^/]+)/account', function ($id) {
    $s = store::get('students', urldecode($id)); $u = $s ? users::byEmail($s['email']) : null;
    if (!$u) deny('Student not found.');
    users::update($u['id'], ['pass' => need_pw(B('password'))]);
    q('DELETE FROM sessions WHERE user_id=?', [$u['id']]);
    out(['ok' => true]);
  });
  route('DELETE', '/admin/students/([^/]+)', function ($id) {
    $s = store::get('students', urldecode($id));
    if (!$s) deny('Student not found.');
    store::tx(function () use ($s) {
      $u = users::byEmail($s['email']); if ($u) users::remove($u['id']);
      store::del('students', $s['id']); store::del('watched', $s['email']); store::del('certReq', $s['email']);
      foreach (['submissions', 'results', 'jobApps', 'interviews'] as $c) foreach (store::all($c) as $d) if (($d['email'] ?? null) === $s['email']) store::del($c, $d['id']);
    });
    out(['ok' => true]);
  });
  route('POST', '/admin/applications/([^/]+)/approve', function ($id) {
    $a = store::get('applications', urldecode($id));
    if (!$a) deny('Application not found.');
    if ($a['status'] === 'Approved') deny('Already approved.');
    if (users::byEmail($a['email'])) deny('An account with this email already exists.');
    if (!store::get('programs', $a['program'])) deny('The applied program no longer exists. Edit the application program first.');
    store::tx(function () use ($a) {
      users::create($a['email'], $a['name'], 'student', [], $a['passHash']);
      $sid = next_student_id();
      store::put('students', $sid, ['id' => $sid, 'name' => $a['name'], 'email' => $a['email'], 'program' => $a['program'], 'progress' => 0, 'attendance' => 100, 'score' => 0,
        'city' => $a['city'] ?? '', 'college' => $a['college'] ?? '', 'phone' => $a['phone'] ?? '', 'resume' => $a['resume'] ?? '', 'resumeId' => $a['resumeId'] ?? '',
        'joined' => day(0), 'status' => 'Active', 'dyn' => true, 'feeStatus' => 'Pending', 'feeRef' => '']);
      store::put('applications', $a['id'], array_merge($a, ['status' => 'Approved', 'reason' => '']));
    });
    out(['ok' => true]);
  });
  route('POST', '/admin/certs', function () {
    $s = student_of(strtolower(strt(B('email'), 200)));
    if (!$s) deny('Student not found.');
    $certs = store::all('certs');
    foreach ($certs as $c) if (($c['email'] ?? null) === $s['email']) deny('A certificate was already issued to this student.');
    $n = 0; foreach ($certs as $c) { $p = explode('-', (string)$c['id']); $n = max($n, (int)($p[2] ?? 0)); } $n++;
    $cert = ['id' => sprintf('FSC-%s-%04d', gmdate('Y'), $n), 'email' => $s['email'], 'name' => $s['name'], 'pid' => $s['program'], 'date' => day(0), 'score' => clamp((int)round((float)num(B('score'))))];
    store::tx(function () use ($cert, $s) { store::put('certs', $cert['id'], $cert); store::del('certReq', $s['email']); });
    out(['cert' => $cert]);
  });
  route('GET', '/admin/backup', function () {
    $o = ['exported' => gmdate('c'), 'docs' => new stdClass, 'users' => array_map(function ($u) { unset($u['pass']); return $u; }, users::all())];
    foreach (store::colls() as $c) $o['docs']->$c = array_map(fn($d) => outbound($c, $d), store::all($c));
    header('Content-Disposition: attachment; filename="finsang-backup-' . day(0) . '.json"');
    out($o);
  });
}

fail('Not found.', 404);
