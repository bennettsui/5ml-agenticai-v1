<?php
/**
 * POST /admin/api/auth.php
 * Body: { "password": "..." }
 * Returns: { "ok": true, "token": "..." } or 401
 */
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';

if ($password === ADMIN_PASS) {
    jsonResponse(['ok' => true, 'token' => ADMIN_PASS]);
} else {
    jsonResponse(['error' => 'Incorrect password'], 401);
}
