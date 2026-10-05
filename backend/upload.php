<?php
require_once __DIR__ . '/config/cloudinary.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if file was sent
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No image provided']);
        exit;
    }

    try {
        // Get folder from request
        $folder = isset($_POST['folder']) ? $_POST['folder'] : 'users/profile-photos';
        
        // Upload to Cloudinary
        $result = $cloudinary->uploadApi()->upload(
            $_FILES['image']['tmp_name'],
            [
                'folder' => $folder,
                'upload_preset' => 'ccc-digital-card' // Optional: use preset or remove
            ]
        );
        
        echo json_encode([
            'success' => true,
            'url' => $result['secure_url'],
            'public_id' => $result['public_id']
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}