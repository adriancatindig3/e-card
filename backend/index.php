<?php

$distDir = __DIR__ . '/dist';

// --- API routing: keep your existing API endpoints untouched ---
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Example: forward /upload.php to the actual upload script
if ($requestUri === '/upload.php') {
    require __DIR__ . '/upload.php';
    exit;
}

// Add more API endpoints here as needed:
// if ($requestUri === '/api/something') { require __DIR__ . '/something.php'; exit; }

// --- Serve the React app ---

// Strip query string and leading slash
$path = ltrim($requestUri, '/');
$filePath = $distDir . '/' . $path;

// If the file exists in dist (JS, CSS, images, fonts, etc.), serve it directly
if ($path !== '' && file_exists($filePath) && is_file($filePath)) {
    $mime = getMimeType($filePath);
    header('Content-Type: ' . $mime);

    // Cache static assets aggressively (Vite hashes filenames)
    if (preg_match('/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/', $path)) {
        header('Cache-Control: public, max-age=31536000, immutable');
    }

    readfile($filePath);
    exit;
}

// For everything else (React routes), serve index.html
$indexFile = $distDir . '/index.html';

if (!file_exists($indexFile)) {
    http_response_code(503);
    echo '<h1>503 – dist/index.html not found</h1>';
    echo '<p>Make sure you ran <code>npm run build</code> and the <code>dist/</code> folder is next to this file.</p>';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTML should not be cached
readfile($indexFile);
exit;

// --- Helper: basic MIME type resolver ---
function getMimeType(string $filePath): string {
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $map = [
        'html'  => 'text/html; charset=UTF-8',
        'js'    => 'application/javascript',
        'mjs'   => 'application/javascript',
        'css'   => 'text/css',
        'json'  => 'application/json',
        'svg'   => 'image/svg+xml',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'webp'  => 'image/webp',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'eot'   => 'application/vnd.ms-fontobject',
        'txt'   => 'text/plain',
        'xml'   => 'application/xml',
        'pdf'   => 'application/pdf',
        'mp4'   => 'video/mp4',
        'webm'  => 'video/webm',
    ];
    return $map[$ext] ?? 'application/octet-stream';
}