<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Cloudinary\Cloudinary;

// Load .env file manually
$env = parse_ini_file(__DIR__ . '/../.env');

$cloudinary = new Cloudinary([
    'cloud' => [
        'cloud_name' => $env['CLOUDINARY_CLOUD_NAME'],
        'api_key'    => $env['CLOUDINARY_API_KEY'],
        'api_secret' => $env['CLOUDINARY_API_SECRET'],
    ],
]);

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}