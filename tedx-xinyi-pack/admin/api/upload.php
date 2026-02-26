<?php
/**
 * POST /admin/api/upload.php
 * Body: { "data": "data:image/...;base64,...", "filename": "name.jpg", "folder": "", "alt": "" }
 */
require_once __DIR__ . '/../config.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Increase limits for base64 image upload
ini_set('post_max_size', '30M');
ini_set('upload_max_filesize', '30M');

$input = json_decode(file_get_contents('php://input'), true);
$dataUrl = $input['data'] ?? '';
$filename = $input['filename'] ?? '';
$folder = $input['folder'] ?? '';
$alt = $input['alt'] ?? '';

if (!$dataUrl || !preg_match('/^data:image\/(jpeg|png|webp|gif);base64,/', $dataUrl, $m)) {
    jsonResponse(['error' => 'Invalid image data'], 400);
}

$mimeType = $m[1];
$rawData = base64_decode(preg_replace('/^data:image\/[^;]+;base64,/', '', $dataUrl));
if (!$rawData) {
    jsonResponse(['error' => 'Failed to decode image'], 400);
}

$originalSize = strlen($rawData);

// Determine filename
if (!$filename) {
    $filename = 'upload-' . time() . '.' . ($mimeType === 'jpeg' ? 'jpg' : $mimeType);
}
// Sanitize filename
$filename = preg_replace('/[^a-zA-Z0-9._-]/', '-', $filename);

// Determine save directory
$saveDir = IMAGES_DIR;
if ($folder && preg_match('/^[a-zA-Z0-9_-]+$/', $folder)) {
    $saveDir = IMAGES_DIR . '/' . $folder;
    if (!is_dir($saveDir)) mkdir($saveDir, 0755, true);
}

// Resize and compress using GD
$compressedData = compressImage($rawData, $filename, $folder === 'speakers');
$savePath = $saveDir . '/' . $filename;
file_put_contents($savePath, $compressedData);

$compressedSize = strlen($compressedData);
$savings = $originalSize > 0 ? round((1 - $compressedSize / $originalSize) * 100) : 0;

// Save alt text metadata
if ($alt) {
    $key = $folder ? $folder . '/' . $filename : $filename;
    $meta = loadMetadata();
    if (!isset($meta[$key])) $meta[$key] = [];
    $meta[$key]['alt'] = $alt;
    saveMetadata($meta);
}

$key = $folder ? $folder . '/' . $filename : $filename;
jsonResponse([
    'success'  => true,
    'filename' => $filename,
    'path'     => 'images/' . $key,
    'originalSize'   => $originalSize,
    'compressedSize' => $compressedSize,
    'savings'  => $savings . '%',
]);

/**
 * Resize and compress image using GD.
 */
function compressImage($rawData, $filename, $isSpeaker = false) {
    $img = @imagecreatefromstring($rawData);
    if (!$img) return $rawData; // GD can't handle it, return as-is

    $w = imagesx($img);
    $h = imagesy($img);
    $maxWidth = $isSpeaker ? MAX_WIDTH_SPEAKER : MAX_WIDTH_HERO;

    // Resize if needed
    if ($w > $maxWidth) {
        $newH = intval($h * $maxWidth / $w);
        $resized = imagecreatetruecolor($maxWidth, $newH);
        // Preserve transparency for PNG/WebP
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $img, 0, 0, 0, 0, $maxWidth, $newH, $w, $h);
        imagedestroy($img);
        $img = $resized;
    }

    // Determine output format by extension
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

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
