<?php
/**
 * TEDxXinyi Admin — Configuration
 */

// Admin password (override via environment variable)
define('ADMIN_PASS', getenv('TEDX_ADMIN_PASS') ?: '5milesLab01@');

// Paths (relative to this file)
define('IMAGES_DIR', realpath(__DIR__ . '/../images') ?: __DIR__ . '/../images');
define('METADATA_FILE', IMAGES_DIR . '/.media-metadata.json');

// Expected visuals (for showing "missing" cards)
define('VISUALS', [
    ['filename' => 'hero-home.webp',            'description' => 'Home hero — dark galaxy distance cinematic banner'],
    ['filename' => 'hero-about.webp',            'description' => 'About hero — creative gathering space Xinyi'],
    ['filename' => 'hero-speakers.webp',         'description' => 'Speakers hero — stage atmosphere warm light'],
    ['filename' => 'hero-sustainability.webp',   'description' => 'Sustainability hero — 3D printed stage materials'],
    ['filename' => 'hero-community.webp',        'description' => 'Community hero — circle gathering warmth'],
    ['filename' => 'salon-teaser.webp',          'description' => 'Salon teaser — moody lecture hall atmosphere'],
    ['filename' => 'salon-hero.webp',            'description' => 'Salon hero — bold galaxy poster background'],
    ['filename' => 'poster-dark.webp',           'description' => 'Poster — full dark event poster layout'],
    ['filename' => 'salon-galaxy.webp',          'description' => 'Salon galaxy — swirling cosmos background'],
    ['filename' => 'salon-curiosity.webp',       'description' => 'Salon curiosity — abstract curiosity visual'],
]);

// Image processing settings
define('MAX_WIDTH_HERO', 1920);
define('MAX_WIDTH_SPEAKER', 800);
define('WEBP_QUALITY', 80);
define('JPEG_QUALITY', 80);
define('PNG_QUALITY', 8); // 0-9 compression level

/**
 * Verify admin token from request header.
 * Sends 401 and exits if invalid.
 */
function requireAuth() {
    $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    if ($token !== ADMIN_PASS) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

/**
 * Send JSON response.
 */
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Read metadata file.
 */
function loadMetadata() {
    if (!file_exists(METADATA_FILE)) return [];
    $raw = file_get_contents(METADATA_FILE);
    return json_decode($raw, true) ?: [];
}

/**
 * Write metadata file (with file locking).
 */
function saveMetadata($meta) {
    $dir = dirname(METADATA_FILE);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $fp = fopen(METADATA_FILE, 'c');
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}
