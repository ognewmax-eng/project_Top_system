<?php
/**
 * get_yandex_file.php — получение ссылки на скачивание файла с Яндекс.Диска и редирект.
 * Query: path — логический путь файла (например top/1 смена/Иванов Иван/document.pdf).
 * Требуется YANDEX_OAUTH_TOKEN.
 */

header('Access-Control-Allow-Origin: *');

$path = isset($_GET['path']) ? trim((string) $_GET['path']) : '';
if ($path === '' || strpos($path, '..') !== false) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Не указан путь']);
    exit;
}

$token = getenv('YANDEX_OAUTH_TOKEN');
if ($token === false || $token === '') {
    $tokenFile = __DIR__ . '/.yandex_oauth_token';
    if (is_file($tokenFile) && is_readable($tokenFile)) {
        $token = trim(file_get_contents($tokenFile));
    }
}
if ($token === false || $token === '') {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Яндекс.Диск не настроен']);
    exit;
}

$diskPath = '/' . ltrim($path, '/');
$url = 'https://cloud-api.yandex.net/v1/disk/resources/download?path=' . rawurlencode($diskPath);

$ctx = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "Authorization: OAuth $token\r\nAccept: application/json",
        'ignore_errors' => true,
    ],
]);
$resp = @file_get_contents($url, false, $ctx);
$code = 0;
if (isset($http_response_header)) {
    preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $m);
    $code = (int) ($m[1] ?? 0);
}

if ($code !== 200) {
    http_response_code($code >= 400 ? $code : 500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Файл не найден или недоступен']);
    exit;
}

$data = json_decode($resp, true);
$href = $data['href'] ?? null;
if (!$href) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Некорректный ответ API']);
    exit;
}

header('Location: ' . $href, true, 302);
exit;
