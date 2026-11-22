<?php
/* Small helpers shared by the API (JS-like string/number coercion so the ported rules behave identically). */

class Deny extends Exception {}
function deny(string $m) { throw new Deny($m); }

function jenc($v): string { return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR); }
function jdec(?string $s) { $r = json_decode((string)$s, true); return $r; }

function now_ms(): int { return (int)floor(microtime(true) * 1000); }
function day(int $n = 0): string { return gmdate('Y-m-d', time() + $n * 86400); }
function sha(string $s): string { return hash('sha256', $s); }
function rand_hex(int $bytes): string { return strtoupper(bin2hex(random_bytes($bytes))); }
function uid(string $p): string { return $p . rand_hex(4); }

/* str(v, max): String(v == null ? '' : v).slice(0, max) */
function str($v, int $max = 5000): string {
  if ($v === null) return '';
  if (is_bool($v)) $s = $v ? 'true' : 'false';
  elseif (is_array($v)) $s = implode(',', array_map(fn($x) => is_array($x) ? '' : (string)$x, $v));
  elseif (is_float($v) && floor($v) == $v && abs($v) < 1e15) $s = (string)(int)$v;
  else $s = (string)$v;
  return mb_substr($s, 0, $max);
}
function strt($v, int $max = 300): string { return trim(str($v, $max)); }

/* num(v, d): Number.isFinite(+v) ? +v : d */
function num($v, $d = 0) {
  if ($v === null || $v === '') return 0;
  if (is_bool($v)) return $v ? 1 : 0;
  if (is_int($v) || is_float($v)) { if (is_nan((float)$v) || is_infinite((float)$v)) return $d; return (is_float($v) && floor($v) == $v && abs($v) < 1e15) ? (int)$v : $v; }
  if (is_string($v) && is_numeric(trim($v))) { $f = (float)trim($v); return (floor($f) == $f && abs($f) < 1e15) ? (int)$f : $f; }
  return $d;
}
function arr($v): array { return is_array($v) ? array_values($v) : []; }
function clamp($n): int|float { return max(0, min(100, $n)); }
function emailOk(string $e): bool { return strlen($e) <= 190 && (bool)preg_match('/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,150}\.[A-Za-z]{2,}$/', $e); }
function is_http(string $u): bool { return (bool)preg_match('#^https?://#i', $u); }
function is_list(array $a): bool { return array_is_list($a); }

/* ---------- response helpers ---------- */
function send_headers() {
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: DENY');
  header('Referrer-Policy: same-origin');
  header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");
}
function out($data, int $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo jenc($data);
  exit;
}
function fail(string $msg, int $status = 400, array $extra = []) { out(array_merge(['error' => $msg], $extra), $status); }
