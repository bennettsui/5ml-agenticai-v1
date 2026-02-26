<?php
/**
 * POST /admin/api/compress-all.php
 * Batch compress all images.
 */
require_once __DIR__ . '/../config.php';
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

set_time_limit(120); // Allow up to 2 minutes

$imgExts = ['jpg', 'jpeg', 'png', 'webp'];
$results = [];
$totalBefore = 0;
$totalAfter = 0;

// Collect all image files
$files = [];
collectImages(IMAGES_DIR, '', $files, $imgExts);

foreach ($files as $entry) {
    $key = $entry['key'];
    $filePath = $entry['path'];
    $rawData = file_get_contents($filePath);
    $originalSize = strlen($rawData);
    $totalBefore += $originalSize;

    $isSpeaker = strpos($key, 'speakers/') === 0;
    $compressed = compressImageBatch($rawData, $key, $isSpeaker);
    $compressedSize = strlen($compressed);

    if ($compressedSize < $originalSize * 0.95) {
        file_put_contents($filePath, $compressed);
        $totalAfter += $compressedSize;
        $results[] = [
            'key'     => $key,
            'before'  => $originalSize,
            'after'   => $compressedSize,
            'savings' => round((1 - $compressedSize / $originalSize) * 100) . '%',
        ];
    } else {
        $totalAfter += $originalSize;
        $results[] = [
            'key'    => $key,
            'before' => $originalSize,
            'after'  => $originalSize,
            'note'   => 'Already optimized',
        ];
    }
}

jsonResponse([
    'results'     => $results,
    'totalBefore' => $totalBefore,
    'totalAfter'  => $totalAfter,
]);

function collectImages($dir, $prefix, &$files, $exts) {
    if (!is_dir($dir)) return;
    foreach (scandir($dir) as $f) {
        if ($f[0] === '.') continue;
        $full = $dir . '/' . $f;
        if (is_dir($full)) {
            collectImages($full, $prefix ? $prefix . '/' . $f : $f, $files, $exts);
        } elseif (is_file($full)) {
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (in_array($ext, $exts)) {
                $key = $prefix ? $prefix . '/' . $f : $f;
                $files[] = ['key' => $key, 'path' => $full];
            }
        }
    }
}

function compressImageBatch($rawData, $key, $isSpeaker = false) {
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
