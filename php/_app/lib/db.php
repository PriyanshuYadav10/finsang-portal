<?php
/* MySQL/MariaDB storage via PDO. Domain records are JSON documents in `docs`; accounts, sessions and files have real tables. */
require_once __DIR__ . '/util.php';

$GLOBALS['FS_CFG'] = (function () {
  $f = dirname(__DIR__) . '/config.php';
  if (!is_file($f)) { http_response_code(503); header('Content-Type: application/json'); echo '{"error":"Not installed. Open /install.php first."}'; exit; }
  return require $f;
})();
function cfg(string $k, $d = null) { return $GLOBALS['FS_CFG'][$k] ?? $d; }

function pdo(): PDO {
  static $p = null;
  if ($p) return $p;
  $dsn = 'mysql:host=' . cfg('db_host', 'localhost') . ';' . (cfg('db_port') ? 'port=' . cfg('db_port') . ';' : '') . 'dbname=' . cfg('db_name') . ';charset=utf8mb4';
  $p = new PDO($dsn, cfg('db_user'), cfg('db_pass'), [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $p;
}
function q(string $sql, array $args = []): PDOStatement { $s = pdo()->prepare($sql); $s->execute($args); return $s; }

function install_schema(PDO $db) {
  $t = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
  $db->exec("CREATE TABLE IF NOT EXISTS users(
    id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, name VARCHAR(190) NOT NULL,
    role VARCHAR(10) NOT NULL, programs TEXT NOT NULL, pass VARCHAR(255) NOT NULL, created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) $t");
  $db->exec("CREATE TABLE IF NOT EXISTS sessions(
    token CHAR(64) PRIMARY KEY, user_id INT NOT NULL, expires BIGINT NOT NULL, KEY(user_id), KEY(expires),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) $t");
  $db->exec("CREATE TABLE IF NOT EXISTS resets(
    token CHAR(64) PRIMARY KEY, user_id INT NOT NULL, expires BIGINT NOT NULL, KEY(user_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) $t");
  $db->exec("CREATE TABLE IF NOT EXISTS docs(
    coll VARCHAR(40) COLLATE utf8mb4_bin NOT NULL, id VARCHAR(120) COLLATE utf8mb4_bin NOT NULL, data MEDIUMTEXT NOT NULL,
    seq BIGINT NOT NULL AUTO_INCREMENT, PRIMARY KEY(coll,id), UNIQUE KEY(seq)) $t");
  $db->exec("CREATE TABLE IF NOT EXISTS files(
    id CHAR(24) PRIMARY KEY, name VARCHAR(255) NOT NULL, size BIGINT NOT NULL, kind VARCHAR(20) NOT NULL, owner VARCHAR(190) NOT NULL DEFAULT '',
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) $t");
  $db->exec("CREATE TABLE IF NOT EXISTS ratelimit(
    k VARCHAR(120) PRIMARY KEY, n INT NOT NULL, reset_at BIGINT NOT NULL) $t");
}

/* ---------- document store ---------- */
const STORE_KEEP_EMPTY_OBJ = ['map'];
class store {
  static function all(string $coll): array {
    return array_map(fn($r) => jdec($r['data']), q('SELECT data FROM docs WHERE coll=? ORDER BY seq', [$coll])->fetchAll());
  }
  static function get(string $coll, $id): ?array {
    $r = q('SELECT data FROM docs WHERE coll=? AND id=?', [$coll, (string)$id])->fetch();
    return $r ? jdec($r['data']) : null;
  }
  static function put(string $coll, $id, $obj): void {
    q('INSERT INTO docs(coll,id,data) VALUES(?,?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)', [$coll, (string)$id, jenc($obj)]);
  }
  static function del(string $coll, $id): void { q('DELETE FROM docs WHERE coll=? AND id=?', [$coll, (string)$id]); }
  static function count(string $coll): int { return (int)q('SELECT COUNT(*) n FROM docs WHERE coll=?', [$coll])->fetch()['n']; }
  static function colls(): array { return array_column(q('SELECT DISTINCT coll FROM docs')->fetchAll(), 'coll'); }
  static function tx(callable $fn) {
    $db = pdo(); $db->beginTransaction();
    try { $r = $fn(); $db->commit(); return $r; }
    catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
  }
}

/* ---------- accounts ---------- */
function user_row($r): ?array {
  if (!$r) return null;
  return ['id' => (int)$r['id'], 'email' => $r['email'], 'name' => $r['name'], 'role' => $r['role'],
    'programs' => jdec($r['programs']) ?: [], 'pass' => $r['pass'], 'created' => $r['created']];
}
class users {
  static function byEmail(string $e): ?array { return user_row(q('SELECT * FROM users WHERE email=?', [strtolower(trim($e))])->fetch()); }
  static function byId(int $id): ?array { return user_row(q('SELECT * FROM users WHERE id=?', [$id])->fetch()); }
  static function all(): array { return array_map('user_row', q('SELECT * FROM users ORDER BY id')->fetchAll()); }
  static function create(string $email, string $name, string $role, array $programs, string $pass): int {
    q('INSERT INTO users(email,name,role,programs,pass) VALUES(?,?,?,?,?)', [strtolower(trim($email)), $name, $role, jenc(array_values($programs)), $pass]);
    return (int)pdo()->lastInsertId();
  }
  static function update(int $id, array $f): void {
    $u = self::byId($id); if (!$u) return;
    $n = array_merge($u, $f);
    q('UPDATE users SET email=?,name=?,role=?,programs=?,pass=? WHERE id=?', [$n['email'], $n['name'], $n['role'], jenc(array_values($n['programs'] ?? [])), $n['pass'], $id]);
  }
  static function remove(int $id): void { q('DELETE FROM users WHERE id=?', [$id]); }
  static function countRole(string $role): int { return (int)q('SELECT COUNT(*) n FROM users WHERE role=?', [$role])->fetch()['n']; }
}

function upload_dir(): string {
  $d = cfg('upload_dir') ?: dirname(__DIR__) . '/uploads';
  if (!is_dir($d)) @mkdir($d, 0750, true);
  return $d;
}
