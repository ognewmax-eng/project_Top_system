<?php
/**
 * upload.php — приём загружаемых файлов от фронтенда.
 * Проверяет тип и размер, сохраняет в папку uploads/.
 * При переходе на S3: заменить блок сохранения в файл на вызов S3 API (см. комментарии ниже).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не разрешён']);
    exit;
}

// Настройки
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 МБ на файл (согласовано с api/.user.ini)
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx'];
// MIME-типы для дополнительной проверки (расширение проверяется в первую очередь)
const ALLOWED_MIMES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Проверка расширения файла (безопасный белый список).
 */
function isAllowedExtension(string $filename): bool {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return in_array($ext, ALLOWED_EXTENSIONS, true);
}

/**
 * Безопасное имя файла: только буквы, цифры, точка, дефис, подчёркивание.
 */
function safeFilename(string $filename): string {
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    $base = pathinfo($filename, PATHINFO_FILENAME);
    $base = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $base);
    $base = substr($base, 0, 100);
    return $base . '.' . strtolower($ext);
}

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Не удалось создать папку uploads']);
        exit;
    }
}

// Несколько файлов в поле "files" (files[])
if (isset($_FILES['files']) && !empty($_FILES['files']['name']) && (is_array($_FILES['files']['name']) ? count($_FILES['files']['name']) > 0 : true)) {
    $files = $_FILES['files'];
    $count = is_array($files['name']) ? count($files['name']) : 1;
    $results = [];
    $hasError = false;
    for ($i = 0; $i < $count; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        if ($error !== UPLOAD_ERR_OK) {
            $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Ошибка загрузки'];
            $hasError = true;
            continue;
        }
        if (!isAllowedExtension($name)) {
            $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Недопустимое расширение файла'];
            $hasError = true;
            continue;
        }
        if ($size > MAX_FILE_SIZE) {
            $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Файл слишком большой'];
            $hasError = true;
            continue;
        }
        $targetName = uniqid('f_', true) . '_' . safeFilename($name);
        $targetPath = $uploadDir . '/' . $targetName;
        if (file_exists($targetPath)) {
            $targetName = uniqid('f_', true) . '_' . safeFilename($name);
            $targetPath = $uploadDir . '/' . $targetName;
        }
        if (move_uploaded_file($tmp, $targetPath)) {
            // --- При переходе на S3: здесь вместо move_uploaded_file вызвать API S3
            // и сохранить в $results URL загруженного файла (и при необходимости локальную копию не сохранять).
            $results[] = ['originalName' => $name, 'saved' => true, 'path' => 'uploads/' . $targetName];
        } else {
            $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Не удалось сохранить файл'];
            $hasError = true;
        }
    }
    echo json_encode([
        'success' => !$hasError,
        'results' => $results,
    ]);
    exit;
}

// Один файл в поле "file"
if (!isset($_FILES['file']) || empty($_FILES['file']['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Файл не передан']);
    exit;
}
$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ошибка загрузки файла']);
    exit;
}
if (!isAllowedExtension($file['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Недопустимое расширение файла. Разрешены: ' . implode(', ', ALLOWED_EXTENSIONS)]);
    exit;
}
if ($file['size'] > MAX_FILE_SIZE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Файл слишком большой (макс. ' . (MAX_FILE_SIZE / 1024 / 1024) . ' МБ)']);
    exit;
}

$targetName = uniqid('f_', true) . '_' . safeFilename($file['name']);
$targetPath = $uploadDir . '/' . $targetName;
if (file_exists($targetPath)) {
    $targetName = uniqid('f_', true) . '_' . safeFilename($file['name']);
    $targetPath = $uploadDir . '/' . $targetName;
}

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // --- При переходе на S3: здесь загрузить файл в бакет и вернуть url вместо path
    echo json_encode([
        'success' => true,
        'path' => 'uploads/' . $targetName,
        'originalName' => $file['name'],
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Не удалось сохранить файл']);
}
