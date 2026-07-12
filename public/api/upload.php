<?php
// Enable CORS for frontend requests (especially from localhost testing)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Pasta onde os arquivos serão salvos na Hostinger
$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// 70MB limit in bytes
$maxFileSize = 70 * 1024 * 1024;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Acesso negado ou erro no upload. Código: ' . $file['error']]);
        exit();
    }
    
    if ($file['size'] > $maxFileSize) {
        http_response_code(400);
        echo json_encode(['error' => 'O arquivo excede o limite de 70MB.']);
        exit();
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!function_exists('mime_content_type')) {
        // Fallback if mime_content_type is disabled on the server
        $fileMimeType = file_type($file['tmp_name']);
    } else {
        $fileMimeType = mime_content_type($file['tmp_name']);
    }

    if (!in_array($fileMimeType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de arquivo não suportado. Apenas Imagens e Vídeos MP4/WebM. Detectado: ' . $fileMimeType]);
        exit();
    }
    
    // Create unique filename to avoid overwriting
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFileName = uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . $fileExtension;
    $destination = $uploadDir . $newFileName;
    
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        // Build the public URL (ensure HTTPS is used if your Hostinger has SSL)
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
        $domain = $_SERVER['HTTP_HOST'];
        // Remove /api from the relative path since we went up a directory
        $publicUrl = $protocol . $domain . '/uploads/' . $newFileName;
        
        http_response_code(200);
        echo json_encode(['success' => true, 'url' => $publicUrl]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao salvar o arquivo no servidor.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhum arquivo enviado.']);
}
?>
