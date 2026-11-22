<?php
/* Password hashing, sessions, rate limiting */
require_once __DIR__ . '/db.php';

const COOKIE = 'fs_sid';
const SESSION_S = 7 * 24 * 3600;

function hash_password(string $pw): string { return password_hash($pw, PASSWORD_DEFAULT); }
function verify_password(string $pw, ?string $stored): bool { return $stored && password_verify($pw, $stored); }

function is_https(): bool {
  return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') || cfg('cookie_secure') === true;
}
function set_cookie_val(string $v, int $ttl) {
  setcookie(COOKIE, $v, ['expires' => $ttl > 0 ? time() + $ttl : time() - 3600, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Strict']);
}
function create_session(int $userId): void {
  $t = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
  q('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)', [sha($t), $userId, now_ms() + SESSION_S * 1000]);
  set_cookie_val($t, SESSION_S);
}
function destroy_session(): void {
  $t = $_COOKIE[COOKIE] ?? null;
  if ($t) q('DELETE FROM sessions WHERE token=?', [sha($t)]);
  set_cookie_val('', 0);
}
function load_user(): ?array {
  $t = $_COOKIE[COOKIE] ?? null;
  if (!$t || !is_string($t)) return null;
  $s = q('SELECT user_id,expires FROM sessions WHERE token=?', [sha($t)])->fetch();
  if (!$s) return null;
  if ((int)$s['expires'] > now_ms()) return users::byId((int)$s['user_id']);
  q('DELETE FROM sessions WHERE token=?', [sha($t)]);
  return null;
}
function require_user(?array $u): array { if (!$u) fail('Please log in.', 401); return $u; }
function require_role(?array $u, string ...$roles): array {
  if (!$u) fail('Please log in.', 401);
  if (!in_array($u['role'], $roles, true)) fail('Not allowed.', 403);
  return $u;
}

/* fixed-window limiter keyed by ip+name, stored in MySQL */
function limit(string $name, int $max, int $windowMs): void {
  $k = substr($name . ':' . ($_SERVER['REMOTE_ADDR'] ?? '?'), 0, 120); $now = now_ms();
  q('INSERT INTO ratelimit(k,n,reset_at) VALUES(?,1,?) ON DUPLICATE KEY UPDATE
       n = IF(reset_at < ?, 1, n + 1), reset_at = IF(reset_at < ?, ?, reset_at)', [$k, $now + $windowMs, $now, $now, $now + $windowMs]);
  $r = q('SELECT n FROM ratelimit WHERE k=?', [$k])->fetch();
  if ($r && (int)$r['n'] > $max) fail('Too many attempts. Please try again later.', 429);
  if (random_int(1, 50) === 1) { // housekeeping
    q('DELETE FROM ratelimit WHERE reset_at<?', [$now]); q('DELETE FROM sessions WHERE expires<?', [$now]); q('DELETE FROM resets WHERE expires<?', [$now]);
  }
}
