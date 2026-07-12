<?php
// hostinger_upload.php
// Place this file in your Hostinger public_html directory (or a subfolder like /api)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// 1. Handle Delete Action
if (isset($_POST['action']) && $_POST['action'] === 'delete') {
    if (!isset($_POST['filename'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No filename provided']);
        exit;
    }

    $filename = basename($_POST['filename']); // Security: prevents directory traversal
    $targetPath = $uploadDir . $filename;

    if (file_exists($targetPath)) {
        if (unlink($targetPath)) {
            echo json_encode(['success' => true, 'message' => 'File deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete file']);
        }
    } else {
        // Even if file doesn't exist, we return success so the DB can be cleaned
        echo json_encode(['success' => true, 'message' => 'File not found on server, assuming deleted']);
    }
    exit;
}

// 2. Handle Upload (Existing Logic)
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
// ... (rest of the upload logic)
if (move_uploaded_file($file['tmp_name'], $destination)) {
    // ...
    echo json_encode(['success' => true, 'url' => $url]);
} else {
    // ...
}
?>
