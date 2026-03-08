<?php
/**
 * upload_to_yandex.php — загрузка файлов на Яндекс.Диск.
 * Структура: top / (1 смена|2 смена|3 смена) / ФИО / файлы.
 * Требуется переменная окружения YANDEX_OAUTH_TOKEN (OAuth-токен приложения).
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

$token = getenv('YANDEX_OAUTH_TOKEN');
if ($token === false || $token === '') {
    // Попытка прочитать из файла рядом (не коммитить токен в репозиторий)
    $tokenFile = __DIR__ . '/.yandex_oauth_token';
    if (is_file($tokenFile) && is_readable($tokenFile)) {
        $token = trim(file_get_contents($tokenFile));
    }
}
if ($token === false || $token === '') {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'Яндекс.Диск не настроен (нет OAuth-токена)']);
    exit;
}

$shift = isset($_POST['shift']) ? trim((string) $_POST['shift']) : '';
$fullName = isset($_POST['fullName']) ? trim((string) $_POST['fullName']) : '';
if (!in_array($shift, ['1', '2', '3'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Укажите смену (1, 2 или 3)']);
    exit;
}
if ($fullName === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Укажите ФИО']);
    exit;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx'];

function isAllowedExtension(string $filename): bool {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return in_array($ext, ALLOWED_EXTENSIONS, true);
}

function safeFilename(string $filename): string {
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    $base = pathinfo($filename, PATHINFO_FILENAME);
    $base = preg_replace('/[^a-zA-Z0-9_\-\p{L}]/u', '_', $base);
    $base = mb_substr($base, 0, 100);
    return $base . '.' . strtolower($ext);
}

/** Санитизация ФИО для имени папки на Диске */
function sanitizeFolderName(string $name): string {
    $name = preg_replace('/[\\\\\/:*?"<>|]/u', '_', $name);
    $name = trim($name);
    return $name !== '' ? $name : 'Без_имени';
}

$shiftLabels = ['1' => '1 смена', '2' => '2 смена', '3' => '3 смена'];
$shiftLabel = $shiftLabels[$shift];
$folderFio = sanitizeFolderName($fullName);

$apiBase = 'https://cloud-api.yandex.net/v1/disk';
$authHeader = 'OAuth ' . $token;

function yandexRequest(string $method, string $url, string $authHeader, ?string $body = null, ?string $contentType = null): array {
    $ctx = [
        'http' => [
            'method' => $method,
            'header' => "Authorization: $authHeader\r\nAccept: application/json",
            'ignore_errors' => true,
        ],
    ];
    if ($body !== null) {
        $ctx['http']['content'] = $body;
        $ctx['http']['header'] .= "\r\nContent-Type: " . ($contentType ?? 'application/json');
    }
    $resp = @file_get_contents($url, false, stream_context_create($ctx));
    $code = 0;
    if (isset($http_response_header)) {
        preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $m);
        $code = (int) ($m[1] ?? 0);
    }
    return ['code' => $code, 'body' => $resp];
}

function yandexPutFile(string $uploadHref, string $tmpPath): int {
    $content = @file_get_contents($tmpPath);
    if ($content === false) {
        return 0;
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'PUT',
            'header' => 'Content-Type: application/octet-stream',
            'content' => $content,
            'ignore_errors' => true,
        ],
    ]);
    @file_get_contents($uploadHref, false, $ctx);
    if (isset($http_response_header) && count($http_response_header) > 0) {
        preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $m);
        return (int) ($m[1] ?? 0);
    }
    return 0;
}

// Создание папок по порядку: /top, /top/1 смена, /top/1 смена/ФИО
$folders = ['/top', '/top/' . $shiftLabel, '/top/' . $shiftLabel . '/' . $folderFio];
foreach ($folders as $path) {
    $url = $apiBase . '/resources?path=' . rawurlencode($path);
    $r = yandexRequest('PUT', $url, $authHeader);
    if ($r['code'] !== 201 && $r['code'] !== 409) {
        $err = json_decode($r['body'] ?? '{}', true);
        $msg = $err['description'] ?? $r['body'] ?? 'Ошибка создания папки';
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Яндекс.Диск: ' . $msg]);
        exit;
    }
}

// Загрузка файлов
$files = $_FILES['files'] ?? null;
if (!$files || empty($files['name']) || (is_array($files['name']) && count(array_filter($files['name'])) === 0)) {
    echo json_encode(['success' => true, 'results' => []]);
    exit;
}

$count = is_array($files['name']) ? count($files['name']) : 1;
$results = [];
$hasError = false;
$diskDirPath = '/top/' . $shiftLabel . '/' . $folderFio;
$logicalPrefix = 'top/' . $shiftLabel . '/' . $folderFio . '/';

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
        $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Недопустимое расширение'];
        $hasError = true;
        continue;
    }
    if ($size > MAX_FILE_SIZE) {
        $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Файл слишком большой'];
        $hasError = true;
        continue;
    }

    $targetName = safeFilename($name);
    $diskPath = $diskDirPath . '/' . $targetName;
    $uploadUrl = $apiBase . '/resources/upload?path=' . rawurlencode($diskPath) . '&overwrite=true';

    $r = yandexRequest('GET', $uploadUrl, $authHeader);
    if ($r['code'] !== 200) {
        $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Не удалось получить URL загрузки'];
        $hasError = true;
        continue;
    }
    $data = json_decode($r['body'], true);
    $href = $data['href'] ?? null;
    if (!$href) {
        $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Некорректный ответ API'];
        $hasError = true;
        continue;
    }

    $putCode = yandexPutFile($href, $tmp);
    if ($putCode === 201 || $putCode === 202) {
        $logicalPath = $logicalPrefix . $targetName;
        $results[] = ['originalName' => $name, 'saved' => true, 'path' => $logicalPath];
    } else {
        $results[] = ['originalName' => $name, 'saved' => false, 'error' => 'Ошибка загрузки на Диск'];
        $hasError = true;
    }
}

echo json_encode([
    'success' => !$hasError,
    'results' => $results,
]);
