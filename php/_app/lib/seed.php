<?php
/* First-run seeding (programs, settings, admin) and optional demo data. Content comes from seed/*.json (exported from the Node edition). */
require_once __DIR__ . '/auth.php';

function seed_base(string $adminEmail, string $adminPass, string $adminName = 'Administrator'): void {
  $base = jdec(file_get_contents(dirname(__DIR__) . '/seed/base.json'));
  if (store::count('programs') === 0) foreach ($base['programs'] as $p) store::put('programs', $p['id'], $p);
  if (!store::get('settings', 'site')) store::put('settings', 'site', ['id' => 'site', 'fee' => 17999, 'email' => 'info@finsang.example', 'phone' => '+91 00000 00000', 'address' => 'Address to be updated, India', 'applicationsOpen' => true]);
  if (!store::get('settings', 'criteria')) store::put('settings', 'criteria', ['id' => 'criteria', 'progress' => 80, 'score' => 60, 'attendance' => 75]);
  if (users::countRole('admin') === 0) users::create(strtolower($adminEmail), $adminName, 'admin', [], hash_password($adminPass));
}

function seed_demo(): void {
  $d = jdec(file_get_contents(dirname(__DIR__) . '/seed/demo.json'));
  $demoHash = hash_password('demo123'); $dayShift = null;
  foreach ($d['users'] as [$email, $name, $role, $pw, $programs]) if (!users::byEmail($email)) users::create($email, $name, $role, $programs, hash_password($pw));
  foreach ($d['docs'] as $coll => $docs) foreach ($docs as $doc) {
    if (($doc['passHash'] ?? '') === '__DEMO__') $doc['passHash'] = $demoHash;
    if (!store::get($coll, $doc['id'])) store::put($coll, $doc['id'], $doc);
  }
}
