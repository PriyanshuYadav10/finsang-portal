<?php
/* Local dev server router that mimics .htaccess:  php -S 127.0.0.1:8080 -t dist/hostinger php/dev-router.php */
$root = $_SERVER['DOCUMENT_ROOT'];
$p = rawurldecode((string)parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (preg_match('#^/_app(/|$)#', $p)) { http_response_code(403); exit('Forbidden'); }
if ($p === '/api' || strncmp($p, '/api/', 5) === 0) { require $root . '/api.php'; return true; }
if ($p === '/install.php') { require $root . '/install.php'; return true; }
$f = $root . $p;
if ($p !== '/' && is_file($f)) return false;
if (is_file($f . '.html')) { readfile($f . '.html'); header('Content-Type: text/html'); return true; }
if ($p === '/') { header('Content-Type: text/html'); readfile($root . '/index.html'); return true; }
http_response_code(404); header('Content-Type: text/html'); readfile($root . '/index.html'); return true;
