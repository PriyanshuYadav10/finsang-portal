<?php
/* Role-based access rules for the document collections (port of server/acl.js).
   The browser keeps a copy of the data it may see and syncs changes through /api/sync; every change is re-validated here. */
require_once __DIR__ . '/db.php';

const COLLS = ['programs', 'students', 'applications', 'submissions', 'results', 'certs', 'jobApps', 'interviews',
  'attendanceLog', 'jobs', 'announcements', 'employers', 'messages', 'documents'];
const DOC_TYPES = ['ID proof', 'Photograph', '10th marksheet', '12th marksheet', 'Graduation / diploma marksheet', 'Resume / CV', 'Other document'];

function in_prog(array $u, $pid): bool { return in_array($pid, arr($u['programs'] ?? []), true); }
function student_of(string $email): ?array { foreach (store::all('students') as $s) if (($s['email'] ?? null) === $email) return $s; return null; }
function get_s(array $d, string $k) { return $d[$k] ?? null; }

function can_read(?array $user, string $coll, array $d): bool {
  if (!$user) return $coll === 'programs' && ($d['published'] ?? true) !== false;
  if ($user['role'] === 'admin') return true;
  if ($user['role'] === 'trainer') {
    if (in_array($coll, ['programs', 'jobs', 'announcements'], true)) return true;
    if ($coll === 'students') return in_prog($user, $d['program'] ?? null);
    if (in_array($coll, ['submissions', 'results', 'attendanceLog'], true)) return in_prog($user, $d['pid'] ?? null);
    return false;
  }
  if ($coll === 'programs') return ($d['published'] ?? true) !== false;
  if (in_array($coll, ['jobs', 'announcements'], true)) return true;
  if (in_array($coll, ['students', 'submissions', 'results', 'jobApps', 'interviews', 'certs', 'documents'], true)) return ($d['email'] ?? null) === $user['email'];
  return false;
}
function outbound(string $coll, array $d): array {
  if ($coll === 'applications') unset($d['passHash']);
  return $d;
}

/* ---------- program validation ---------- */
function clean_program(array $p, ?array $old): array {
  $p['id'] = str($p['id'] ?? '', 80);
  if (!preg_match('/^[a-z0-9][a-z0-9-]{1,60}$/', $p['id'])) deny('Program id must be lowercase letters, numbers and dashes.');
  if ($old && $old['id'] !== $p['id']) deny('Program id cannot change.');
  $or = fn($v, $d) => (isset($v) && $v !== '' && $v !== false) ? $v : $d;
  $o = [
    'id' => $p['id'], 'name' => str($p['name'] ?? '', 160), 'icon' => str($or($p['icon'] ?? null, '🎓'), 8), 'color' => str($or($p['color'] ?? null, '#e8eefe'), 20),
    'cat' => str($p['cat'] ?? '', 60), 'months' => max(1, min(24, num($p['months'] ?? null, 3))), 'mode' => str($p['mode'] ?? '', 30),
    'partner' => str($or($p['partner'] ?? null, 'finsang'), 30), 'mentor' => str($p['mentor'] ?? '', 120), 'short' => str($p['short'] ?? '', 600),
    'overview' => str($p['overview'] ?? '', 4000), 'live' => str($p['live'] ?? '', 3000), 'published' => ($p['published'] ?? true) !== false, 'order' => num($p['order'] ?? null, 0),
  ];
  if ($o['name'] === '') deny('Program name is required.');
  foreach (['skills', 'careers', 'topics', 'outcomes', 'assess', 'eligibility'] as $k)
    $o[$k] = array_values(array_filter(array_map(fn($x) => str($x, 300), arr($p[$k] ?? null)), fn($x) => $x !== ''));
  $o['roadmap'] = array_map(fn($m) => array_values(array_filter(array_map(fn($x) => str($x, 300), arr($m)), fn($x) => $x !== '')), arr($p['roadmap'] ?? null));
  $o['links'] = array_values(array_filter(array_map(fn($l) => [str($l[0] ?? '', 200), str($l[1] ?? '', 500)], array_filter(arr($p['links'] ?? null), 'is_array')),
    fn($l) => $l[0] !== '' && is_http($l[1])));
  $o['faqs'] = array_values(array_filter(array_map(fn($l) => [str($l[0] ?? '', 300), str($l[1] ?? '', 1500)], array_filter(arr($p['faqs'] ?? null), 'is_array')), fn($l) => $l[0] !== ''));
  return array_merge($o, clean_content($p));
}
function clean_content(array $p): array {
  $ids = [];
  $uniq = function ($x) use (&$ids) { $x = str($x, 80); if ($x === '' || isset($ids[$x])) deny('Content items need unique ids.'); $ids[$x] = 1; return $x; };
  $url = function ($u) { $u = str($u, 800); return ($u === '' || is_http($u)) ? $u : ''; };
  $rows = fn($k) => array_filter(arr($p[$k] ?? null), 'is_array');
  $modules = array_values(array_map(function ($m) use ($uniq, $url) {
    return [
      'id' => $uniq($m['id'] ?? ''), 'title' => str($m['title'] ?? '', 200),
      'videos' => array_values(array_map(fn($v) => ['id' => $uniq($v['id'] ?? ''), 'title' => str($v['title'] ?? '', 200), 'url' => $url($v['url'] ?? ''),
        'dur' => max(1, num($v['dur'] ?? null, 10)), 'desc' => str($v['desc'] ?? '', 1000)], array_filter(arr($m['videos'] ?? null), 'is_array'))),
      'docs' => array_values(array_map(fn($d) => ['id' => $uniq($d['id'] ?? ''), 'title' => str($d['title'] ?? '', 200),
        'type' => in_array($d['type'] ?? null, ['PDF', 'PPT', 'DOC', 'ZIP', 'LINK'], true) ? $d['type'] : 'PDF', 'fileId' => str($d['fileId'] ?? '', 80), 'url' => $url($d['url'] ?? '')],
        array_filter(arr($m['docs'] ?? null), 'is_array'))),
    ];
  }, $rows('modules')));
  $assignments = array_values(array_map(fn($a) => ['id' => $uniq($a['id'] ?? ''), 'title' => str($a['title'] ?? '', 200), 'desc' => str($a['desc'] ?? '', 3000),
    'due' => str($a['due'] ?? '', 10), 'marks' => max(1, num($a['marks'] ?? null, 25)), 'fileId' => str($a['fileId'] ?? '', 80)], $rows('assignments')));
  $quiz = array_values(array_map(function ($x) use ($uniq) {
    $opts = array_map(fn($o) => str($o, 300), arr($x['opts'] ?? null)); $a = num($x['a'] ?? null, 0);
    if (count($opts) < 2 || $a < 0 || $a >= count($opts)) deny('Each MCQ needs 2+ options and a valid correct answer.');
    return ['id' => $uniq($x['id'] ?? ''), 'mid' => str($x['mid'] ?? '', 80), 'q' => str($x['q'] ?? '', 1000), 'opts' => $opts, 'a' => $a];
  }, $rows('quiz')));
  $papers = array_values(array_map(fn($x) => ['id' => $uniq($x['id'] ?? ''), 'title' => str($x['title'] ?? '', 200), 'type' => str($x['type'] ?? '', 40),
    'q' => max(1, num($x['q'] ?? null, 20)), 'mins' => max(1, num($x['mins'] ?? null, 30)), 'fileId' => str($x['fileId'] ?? '', 80)], $rows('papers')));
  return ['modules' => $modules, 'assignments' => $assignments, 'quiz' => $quiz, 'papers' => $papers];
}

function pick(array $o, array $ks): array {
  $r = [];
  foreach ($ks as $k) if (array_key_exists($k, $o)) $r[$k] = is_string($o[$k]) ? str($o[$k], 300) : $o[$k];
  return $r;
}

/* ---------- write rules: return the sanitised doc to store ---------- */
function writer(string $role, string $coll): ?callable {
  static $W = null;
  if ($W === null) $W = [
    'admin' => [
      'programs' => fn($nd, $od) => clean_program($nd, $od),
      'students' => function ($nd, $od) {
        if (!$od) deny('Create students from the Students page.');
        $r = array_merge($od, pick($nd, ['name', 'city', 'college', 'program', 'status', 'attendance', 'progress', 'score', 'feeStatus', 'feeRef', 'phone']));
        foreach (['progress', 'score'] as $k) if (isset($r[$k])) $r[$k] = clamp(num($r[$k], $od[$k] ?? 0));
        $r['attendance'] = clamp(num($nd['attendance'] ?? null, $od['attendance'] ?? 0));
        $r['email'] = $od['email']; $r['id'] = $od['id'];
        return $r;
      },
      'applications' => function ($nd, $od) {
        if (!$od) deny('Applications are created by applicants only.');
        $st = $nd['status'] ?? null;
        if (!in_array($st, ['Pending', 'Under Review', 'Approved', 'Rejected'], true)) deny('Invalid status.');
        if ($st === 'Approved' && $od['status'] !== 'Approved') deny('Use the Approve action to create the account.');
        return array_merge($od, ['status' => $st, 'reason' => str($nd['reason'] ?? '', 500), 'notes' => str($nd['notes'] ?? '', 1000)]);
      },
      'submissions' => function ($nd, $od) {
        if (!$od) deny('Not allowed.');
        return array_merge($od, ['marks' => ($nd['marks'] ?? null) === null ? null : num($nd['marks']), 'feedback' => str($nd['feedback'] ?? '', 3000),
          'status' => ($nd['status'] ?? null) === 'Evaluated' ? 'Evaluated' : 'Submitted']);
      },
      'results' => function ($nd, $od) { if ($od) deny('Results are immutable.'); return $nd; },
      'certs' => function ($nd, $od) { if (!$od) deny('Use the Generate action.'); return $od; },
      'jobApps' => function ($nd, $od) { if (!$od) deny('Not allowed.'); return array_merge($od, ['status' => str($nd['status'] ?? '', 40)]); },
      'interviews' => fn($nd) => ['id' => str($nd['id'], 40), 'email' => str($nd['email'] ?? '', 200), 'jobId' => str($nd['jobId'] ?? '', 40), 'date' => str($nd['date'] ?? '', 10), 'time' => str($nd['time'] ?? '', 20), 'mode' => str($nd['mode'] ?? '', 30)],
      'attendanceLog' => fn($nd) => ['id' => str($nd['id'], 40), 'pid' => str($nd['pid'] ?? '', 80), 'date' => str($nd['date'] ?? '', 10),
        'present' => array_map('strval', arr($nd['present'] ?? null)), 'absent' => array_map('strval', arr($nd['absent'] ?? null))],
      'jobs' => function ($nd) {
        $j = ['id' => str($nd['id'], 40), 'title' => str($nd['title'] ?? '', 200), 'company' => str($nd['company'] ?? '', 200), 'org' => str(($nd['org'] ?? '') ?: 'finsang', 30),
          'type' => ($nd['type'] ?? null) === 'Internship' ? 'Internship' : 'Job', 'loc' => str($nd['loc'] ?? '', 200), 'prog' => str(($nd['prog'] ?? '') ?: 'any', 80),
          'min' => clamp(num($nd['min'] ?? null, 60)), 'desc' => str($nd['desc'] ?? '', 3000),
          'elig' => array_values(array_filter(array_map(fn($x) => str($x, 300), arr($nd['elig'] ?? null)), fn($x) => $x !== ''))];
        if ($j['title'] === '') deny('Job title is required.');
        return $j;
      },
      'announcements' => function ($nd, $od) {
        $a = ['id' => str($nd['id'], 40), 'type' => str($nd['type'] ?? '', 40), 'title' => str($nd['title'] ?? '', 200), 'body' => str($nd['body'] ?? '', 3000),
          'date' => str($nd['date'] ?? '', 10), 'prog' => str(($nd['prog'] ?? '') ?: 'all', 80), 'by' => $od ? $od['by'] : 'admin'];
        if ($a['title'] === '') deny('Title is required.');
        return $a;
      },
      'employers' => fn($nd) => ['id' => str($nd['id'], 40), 'name' => str($nd['name'] ?? '', 200), 'contact' => str($nd['contact'] ?? '', 200), 'phone' => str($nd['phone'] ?? '', 40), 'notes' => str($nd['notes'] ?? '', 1000)],
      'messages' => function ($nd, $od) { if (!$od) deny('Not allowed.'); return array_merge($od, ['read' => !empty($nd['read'])]); },
      'documents' => function ($nd, $od) {
        if (!$od) deny('Documents are uploaded by students.');
        if (!in_array($nd['status'] ?? null, ['Pending review', 'Verified', 'Rejected'], true)) deny('Invalid status.');
        return array_merge($od, ['status' => $nd['status'], 'note' => str($nd['note'] ?? '', 300)]);
      },
    ],
    'trainer' => [
      'programs' => function ($nd, $od, $u) {
        if (!$od || !in_prog($u, $od['id'])) deny('You can only edit your assigned programs.');
        $links = clean_program(array_merge($od, ['links' => $nd['links'] ?? []]), $od)['links'];
        return array_merge($od, clean_content($nd), ['links' => $links]);
      },
      'submissions' => function ($nd, $od, $u) {
        if (!$od || !in_prog($u, $od['pid'])) deny('Not your student.');
        return array_merge($od, ['marks' => ($nd['marks'] ?? null) === null ? null : num($nd['marks']), 'feedback' => str($nd['feedback'] ?? '', 3000),
          'status' => ($nd['status'] ?? null) === 'Evaluated' ? 'Evaluated' : $od['status']]);
      },
      'students' => function ($nd, $od, $u) {
        if (!$od || !in_prog($u, $od['program'])) deny('Not your student.');
        return array_merge($od, ['attendance' => clamp(num($nd['attendance'] ?? null, $od['attendance'] ?? 0))]);
      },
      'attendanceLog' => function ($nd, $od, $u) {
        if ($od) deny('Attendance records cannot be edited.');
        if (!in_prog($u, $nd['pid'] ?? null)) deny('Not your program.');
        return ['id' => str($nd['id'], 40), 'pid' => $nd['pid'], 'date' => str($nd['date'] ?? '', 10), 'present' => array_map('strval', arr($nd['present'] ?? null)), 'absent' => array_map('strval', arr($nd['absent'] ?? null))];
      },
      'announcements' => function ($nd, $od, $u) {
        if ($od) deny('Only admins can edit announcements.');
        $pr = $nd['prog'] ?? null;
        if ($pr !== 'all' && !in_prog($u, $pr)) deny('Not your program.');
        return ['id' => str($nd['id'], 40), 'type' => str($nd['type'] ?? '', 40), 'title' => str($nd['title'] ?? '', 200), 'body' => str($nd['body'] ?? '', 3000),
          'date' => str($nd['date'] ?? '', 10), 'prog' => str($pr, 80), 'by' => $u['email']];
      },
    ],
    'student' => [
      'submissions' => function ($nd, $od, $u) {
        $me = student_of($u['email']); if (!$me) deny('No enrollment.');
        if ($od && (($od['email'] ?? null) !== $u['email'] || ($od['status'] ?? null) === 'Evaluated')) deny('Cannot change this submission.');
        $prog = store::get('programs', $me['program']); $a = null;
        if ($prog) foreach (arr($prog['assignments'] ?? null) as $x) if (($x['id'] ?? null) === ($nd['aid'] ?? null)) { $a = $x; break; }
        if (!$a) deny('Unknown assignment.');
        $link = is_string($nd['link'] ?? null) && is_http($nd['link']) ? str($nd['link'], 800) : '';
        return ['id' => str($nd['id'], 40), 'email' => $u['email'], 'name' => $u['name'], 'pid' => $me['program'], 'aid' => $a['id'], 'title' => $a['title'], 'link' => $link,
          'file' => str($nd['file'] ?? '', 200), 'fileId' => str($nd['fileId'] ?? '', 80), 'note' => str($nd['note'] ?? '', 2000), 'date' => str($nd['date'] ?? '', 10),
          'status' => 'Submitted', 'marks' => null, 'feedback' => ''];
      },
      'results' => function ($nd, $od, $u) {
        if ($od) deny('Results are immutable.');
        $total = max(1, num($nd['total'] ?? null, 1)); $score = max(0, min($total, num($nd['score'] ?? null, 0)));
        return ['id' => str($nd['id'], 40), 'email' => $u['email'], 'pid' => str($nd['pid'] ?? '', 80), 'title' => str($nd['title'] ?? '', 200), 'score' => $score, 'total' => $total,
          'date' => str($nd['date'] ?? '', 10), 'mode' => str($nd['mode'] ?? '', 20)];
      },
      'jobApps' => function ($nd, $od, $u) {
        if ($od) deny('Cannot change an application.');
        $jid = $nd['jobId'] ?? null;
        if (!is_string($jid) || !store::get('jobs', $jid)) deny('Unknown job.');
        foreach (store::all('jobApps') as $a) if (($a['email'] ?? null) === $u['email'] && ($a['jobId'] ?? null) === $jid) deny('Already applied.');
        return ['id' => str($nd['id'], 40), 'email' => $u['email'], 'name' => $u['name'], 'jobId' => $jid, 'date' => str($nd['date'] ?? '', 10), 'status' => 'Applied'];
      },
      'documents' => function ($nd, $od, $u) {
        if ($od) {
          if (($od['email'] ?? null) !== $u['email']) deny('Not allowed.');
          if (($od['status'] ?? null) === 'Verified') deny('Verified documents cannot be changed.');
          return array_merge($od, ['title' => str($nd['title'] ?? '', 120)]);
        }
        if (!student_of($u['email'])) deny('No enrollment.');
        if (!in_array($nd['type'] ?? null, DOC_TYPES, true)) deny('Choose a document type.');
        $f = q('SELECT * FROM files WHERE id=?', [str($nd['fileId'] ?? '', 80)])->fetch();
        if (!$f || $f['kind'] !== 'document' || $f['owner'] !== $u['email']) deny('Upload the file first.');
        $n = 0; foreach (store::all('documents') as $d) if (($d['email'] ?? null) === $u['email']) $n++;
        if ($n >= 30) deny('You can keep up to 30 documents.');
        $title = str($nd['title'] ?? '', 120);
        return ['id' => str($nd['id'], 40), 'email' => $u['email'], 'name' => $u['name'], 'type' => $nd['type'], 'title' => $title !== '' ? $title : $f['name'], 'fileId' => $f['id'], 'fileName' => $f['name'], 'size' => (int)$f['size'], 'date' => str($nd['date'] ?? '', 10), 'status' => 'Pending review', 'note' => ''];
      },
      'students' => function ($nd, $od, $u) {
        if (!$od || ($od['email'] ?? null) !== $u['email']) deny('Not allowed.');
        $pg = $nd['program'] ?? null;
        if (!is_string($pg) || !store::get('programs', $pg)) deny('Unknown program.');
        return array_merge($od, ['program' => $pg, 'resume' => str($nd['resume'] ?? '', 200), 'resumeId' => str($nd['resumeId'] ?? '', 80)]);
      },
    ],
  ];
  return $W[$role][$coll] ?? null;
}

function validate_write(?array $user, string $coll, $nd, ?array $od): array {
  if (!$user) deny('Not logged in.');
  if (!in_array($coll, COLLS, true)) deny('Unknown collection.');
  $w = writer($user['role'], $coll);
  if (!$w) deny('You are not allowed to change ' . $coll . '.');
  if (!is_array($nd) || empty($nd['id']) || !is_scalar($nd['id'])) deny('Invalid record.');
  if ($od && !($user['role'] === 'admin' || can_read($user, $coll, $od))) deny('Not allowed.');
  return $w($nd, $od, $user);
}

function validate_delete(array $user, string $coll, ?array $od): void {
  if (!$od) return;
  if ($user['role'] === 'student' && $coll === 'documents') {
    if (($od['email'] ?? null) !== $user['email']) deny('Not allowed.');
    if (($od['status'] ?? null) === 'Verified') deny('Verified documents cannot be deleted.');
    return;
  }
  if ($user['role'] !== 'admin') deny('Only admins can delete records.');
  if ($coll === 'programs') foreach (store::all('students') as $s) if (($s['program'] ?? null) === $od['id']) deny('Cannot delete a program that has enrolled students. Move them first or unpublish it.');
  if ($coll === 'students') deny('Delete students from the Students page.');
  if (in_array($coll, ['applications', 'jobs', 'announcements', 'messages', 'employers', 'certs', 'documents', 'jobApps', 'interviews', 'submissions', 'results', 'attendanceLog', 'programs'], true)) return;
  deny('Not allowed.');
}

/* ---------- editable website content (see server/acl.js cleanSiteContent) ---------- */
function clean_site_content($c): array {
  $c = is_array($c) && !array_is_list($c) ? $c : [];
  $t = fn($v, $m) => trim(str($v, $m));
  $lst = fn($v, $n, $m) => array_values(array_filter(array_map(fn($x) => $t($x, $m), array_slice(arr($v), 0, $n)), fn($x) => $x !== ''));
  $pairs = fn($v, $n, $a, $b) => array_values(array_filter(array_map(function ($x) use ($t, $a, $b) { $x = arr($x); return [$t($x[0] ?? '', $a), $t($x[1] ?? '', $b)]; }, array_slice(arr($v), 0, $n)), fn($x) => $x[0] !== ''));
  $g = fn($a, $k) => is_array($a) ? ($a[$k] ?? null) : null;
  $o = [];
  if (!empty($c['announcement']) && is_array($c['announcement'])) { $a = $c['announcement']; $o['announcement'] = ['enabled' => ($a['enabled'] ?? true) !== false, 'text' => $t($a['text'] ?? '', 200), 'cta' => $t($a['cta'] ?? '', 40)]; }
  if (!empty($c['hero']) && is_array($c['hero'])) { $h = $c['hero']; $o['hero'] = ['eyebrow' => $t($h['eyebrow'] ?? '', 120), 'title' => $t($h['title'] ?? '', 120), 'highlight' => $t($h['highlight'] ?? '', 80), 'lead' => $t($h['lead'] ?? '', 600)]; }
  if (!empty($c['home']) && is_array($c['home'])) { $h = $c['home']; $o['home'] = ['progTitle' => $t($h['progTitle'] ?? '', 140), 'progSub' => $t($h['progSub'] ?? '', 240), 'whyTitle' => $t($h['whyTitle'] ?? '', 140), 'ctaTitle' => $t($h['ctaTitle'] ?? '', 140), 'ctaText' => $t($h['ctaText'] ?? '', 240)]; }
  if (!empty($c['programsPage']) && is_array($c['programsPage'])) { $h = $c['programsPage']; $o['programsPage'] = ['title' => $t($h['title'] ?? '', 100), 'sub' => $t($h['sub'] ?? '', 240)]; }
  if (!empty($c['about']) && is_array($c['about'])) { $a = $c['about'];
    $o['about'] = ['sub' => $t($a['sub'] ?? '', 240), 'intro' => $t($a['intro'] ?? '', 1500),
      'cards' => array_values(array_filter(array_map(fn($x) => ['icon' => $t($g($x, 'icon'), 8), 'h' => $t($g($x, 'h'), 80), 'p' => $t($g($x, 'p'), 400)], array_slice(arr($a['cards'] ?? null), 0, 6)), fn($x) => $x['h'] !== ''))]; }
  if (!empty($c['pricing']) && is_array($c['pricing'])) { $p = $c['pricing']; $o['pricing'] = ['title' => $t($p['title'] ?? '', 140), 'sub' => $t($p['sub'] ?? '', 240), 'includes' => $lst($p['includes'] ?? null, 14, 200), 'note' => $t($p['note'] ?? '', 80)]; }
  if (isset($c['partners']) && is_array($c['partners'])) {
    $seen = []; $out = [];
    foreach (array_slice(array_values($c['partners']), 0, 8) as $p) {
      if (!is_array($p)) continue;
      $id = preg_replace('/[^a-z0-9-]/', '', strtolower($t($p['id'] ?? '', 30)));
      $name = $t($p['name'] ?? '', 120);
      if ($id === '' || $name === '' || isset($seen[$id])) continue;
      $seen[$id] = 1;
      $out[] = ['id' => $id, 'name' => $name, 'short' => $t($p['short'] ?? '', 40), 'mono' => $t($p['mono'] ?? '', 4),
        'color' => (is_string($p['color'] ?? null) && preg_match('/^#[0-9a-f]{6}$/i', $p['color'])) ? $p['color'] : '#9a7a2e',
        'role' => $t($p['role'] ?? '', 80), 'desc' => $t($p['desc'] ?? '', 500), 'contrib' => $lst($p['contrib'] ?? null, 8, 200)];
    }
    if ($out) $o['partners'] = $out;
  }
  if (isset($c['faqs']) && is_array($c['faqs'])) $o['faqs'] = $pairs($c['faqs'], 40, 300, 1500);
  if (!empty($c['contact']) && is_array($c['contact'])) { $h = $c['contact']; $o['contact'] = ['sub' => $t($h['sub'] ?? '', 240), 'hours' => $t($h['hours'] ?? '', 120), 'note' => $t($h['note'] ?? '', 240)]; }
  if (!empty($c['legal']) && is_array($c['legal'])) { $l = $c['legal']; $o['legal'] = ['privacy' => $pairs($l['privacy'] ?? null, 20, 120, 1500), 'terms' => $pairs($l['terms'] ?? null, 20, 120, 1500)]; }
  if (!empty($c['footer']) && is_array($c['footer'])) $o['footer'] = ['about' => $t($c['footer']['about'] ?? '', 320)];
  return $o;
}
