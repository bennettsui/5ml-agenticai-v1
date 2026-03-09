<?php
/**
 * GET /admin/api/media.php
 * Returns JSON list of all images + missing visuals.
 */
require_once __DIR__ . '/../config.php';
requireAuth();

$meta = loadMetadata();
$images = [];
$foundKeys = [];
$imgExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// Scan root images
if (is_dir(IMAGES_DIR)) {
    foreach (scandir(IMAGES_DIR) as $f) {
        if ($f[0] === '.') continue;
        $fullPath = IMAGES_DIR . '/' . $f;
        if (!is_file($fullPath)) continue;
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, $imgExts)) continue;

        $key = $f;
        $foundKeys[] = $key;
        $stat = stat($fullPath);
        $isGenerated = false;
        foreach (VISUALS as $v) {
            if ($v['filename'] === $f) { $isGenerated = true; break; }
        }
        $images[] = [
            'filename' => $f,
            'folder'   => '',
            'size'     => $stat['size'],
            'modified' => date('c', $stat['mtime']),
            'alt'      => $meta[$key]['alt'] ?? '',
            'source'   => $isGenerated ? 'generated' : 'uploaded',
            'missing'  => false,
        ];
    }
}

// Scan subdirectories
if (is_dir(IMAGES_DIR)) {
    foreach (scandir(IMAGES_DIR) as $dir) {
        if ($dir[0] === '.') continue;
        $dirPath = IMAGES_DIR . '/' . $dir;
        if (!is_dir($dirPath)) continue;
        foreach (scandir($dirPath) as $f) {
            if ($f[0] === '.') continue;
            $fullPath = $dirPath . '/' . $f;
            if (!is_file($fullPath)) continue;
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (!in_array($ext, $imgExts)) continue;

            $key = $dir . '/' . $f;
            $foundKeys[] = $key;
            $stat = stat($fullPath);
            $images[] = [
                'filename' => $f,
                'folder'   => $dir,
                'size'     => $stat['size'],
                'modified' => date('c', $stat['mtime']),
                'alt'      => $meta[$key]['alt'] ?? '',
                'source'   => 'uploaded',
                'missing'  => false,
            ];
        }
    }
}

// Add missing visuals
foreach (VISUALS as $v) {
    if (!in_array($v['filename'], $foundKeys)) {
        $images[] = [
            'filename'    => $v['filename'],
            'folder'      => '',
            'size'        => 0,
            'modified'    => null,
            'alt'         => $meta[$v['filename']]['alt'] ?? '',
            'source'      => 'generated',
            'missing'     => true,
            'description' => $v['description'],
        ];
    }
}

jsonResponse(['images' => $images]);
