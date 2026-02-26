<?php
/**
 * POST /admin/api/compress.php
 * Body: { "key": "filename.webp" } or { "key": "speakers/name.jpg" }
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

// Security: prevent path traversal
if (strpos($key, '..') !== false || $key[0] === '/') {
    jsonResponse(['error' => 'Invalid key'], 400);
}

$filePath = IMAGES_DIR . '/' . $key;
if (!file_exists($filePath)) {
    jsonResponse(['error' => 'File not found'], 404);
}

$rawData = file_get_contents($filePath);
$originalSize = strlen($rawData);

$isSpeaker = strpos($key, 'speakers/') === 0;
$compressedData = compressImageGD($rawData, $key, $isSpeaker);
$compressedSize = strlen($compressedData);

// Only overwrite if actually smaller
if ($compressedSize < $originalSize * 0.95) {
    file_put_contents($filePath, $compressedData);
    $savings = round((1 - $compressedSize / $originalSize) * 100);
    jsonResponse([
        'key'      => $key,
        'before'   => $originalSize,
        'after'    => $compressedSize,
        'savings'  => $savings . '%',
    ]);
} else {
    jsonResponse([
        'key'  => $key,
        'note' => 'Already optimized',
        'before' => $originalSize,
        'after'  => $originalSize,
    ]);
}

/**
 * Resize and compress image using GD.
 */
function compressImageGD($rawData, $key, $isSpeaker = false) {
    $img = @imagecreatefromstring($rawData);
    if (!$img) return $rawData;

    $w = imagesx($img);
    $h = imagesy($img);
    $maxWidth = $isSpeaker ? MAX_WIDTH_SPEAKER : MAX_WIDTH_HERO;

    if ($w > $maxWidth) {
        $newH = intval($h * $maxWidth / $w);
        $resized = imagecreatetruecolor($maxWidth, $newH);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $img, 0, 0, 0, 0, $maxWidth, $newH, $w, $h);
        imagedestroy($img);
        $img = $resized;
    }

    $ext = strtolower(pathinfo($key, PATHINFO_EXTENSION));

    ob_start();
    if ($ext === 'webp' && function_exists('imagewebp')) {
        imagewebp($img, null, WEBP_QUALITY);
    } elseif ($ext === 'png') {
        imagepng($img, null, PNG_QUALITY);
    } else {
        imagejpeg($img, null, JPEG_QUALITY);
    }
    $output = ob_get_clean();
    imagedestroy($img);

    return $output;
}
