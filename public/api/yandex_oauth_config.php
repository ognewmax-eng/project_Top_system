<?php
/**
 * yandex_oauth_config.php — возвращает URL для старта OAuth (без client_secret).
 * Нужен YANDEX_CLIENT_ID (или файл .yandex_app_credentials — первая строка = client_id).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$clientId = getenv('YANDEX_CLIENT_ID');
if ($clientId === false || $clientId === '') {
    $credsFile = __DIR__ . '/.yandex_app_credentials';
    if (is_file($credsFile) && is_readable($credsFile)) {
        $lines = array_map('trim', file($credsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
        $clientId = $lines[0] ?? '';
    }
}

if ($clientId === '') {
    echo json_encode(['error' => 'OAuth приложение не настроено (нет YANDEX_CLIENT_ID или .yandex_app_credentials)']);
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$redirectUri = $scheme . '://' . $host . '/api/yandex_oauth_callback.php';
$authUrl = 'https://oauth.yandex.com/authorize?' . http_build_query([
    'response_type' => 'code',
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'force_confirm' => 'yes',
]);

echo json_encode(['authUrl' => $authUrl]);
