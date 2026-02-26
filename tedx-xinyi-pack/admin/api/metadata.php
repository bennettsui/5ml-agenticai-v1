<?php
/**
 * POST /admin/api/metadata.php
 * Body: { "key": "filename.webp", "alt": "description text" }
 */
require_once __DIR__ . '/../config.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$key = $input['key'] ?? '';
if (!$key) {
    jsonResponse(['error' => 'key is required'], 400);
}

$meta = loadMetadata();

if (!isset($meta[$key])) {
    $meta[$key] = [];
}
if (isset($input['alt'])) {
    $meta[$key]['alt'] = $input['alt'];
}
if (isset($input['customName'])) {
    $meta[$key]['customName'] = $input['customName'];
}

saveMetadata($meta);

jsonResponse(['ok' => true, 'key' => $key]);
