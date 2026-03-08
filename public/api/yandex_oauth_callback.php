<?php
/**
 * yandex_oauth_callback.php — OAuth callback: обмен code на токен и сохранение в .yandex_oauth_token.
 * В консоли Яндекса Redirect URI должен быть: https://ВАШ_ДОМЕН/api/yandex_oauth_callback.php
 * Нужны YANDEX_CLIENT_ID и YANDEX_CLIENT_SECRET (или .yandex_app_credentials: 1-я строка client_id, 2-я client_secret).
 */

header('Content-Type: text/html; charset=utf-8');

$code = isset($_GET['code']) ? trim((string) $_GET['code']) : '';
if ($code === '') {
    $redirect = '/yandexouth?error=' . rawurlencode('Код авторизации не получен');
    header('Location: ' . $redirect, true, 302);
    exit;
}

$clientId = getenv('YANDEX_CLIENT_ID');
$clientSecret = getenv('YANDEX_CLIENT_SECRET');
if ($clientId === false || $clientId === '' || $clientSecret === false || $clientSecret === '') {
    $credsFile = __DIR__ . '/.yandex_app_credentials';
    if (is_file($credsFile) && is_readable($credsFile)) {
        $lines = array_map('trim', file($credsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
        $clientId = $clientId ?: ($lines[0] ?? '');
        $clientSecret = $clientSecret ?: ($lines[1] ?? '');
    }
}

if ($clientId === '' || $clientSecret === '') {
    $redirect = '/yandexouth?error=' . rawurlencode('Не настроены client_id или client_secret на сервере');
    header('Location: ' . $redirect, true, 302);
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$redirectUri = $scheme . '://' . $host . '/api/yandex_oauth_callback.php';

$tokenUrl = 'https://oauth.yandex.com/token';
$postData = http_build_query([
    'grant_type' => 'authorization_code',
    'code' => $code,
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri' => $redirectUri,
]);

$ctx = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $postData,
        'ignore_errors' => true,
    ],
]);
$response = @file_get_contents($tokenUrl, false, $ctx);
$httpCode = 0;
if (isset($http_response_header) && count($http_response_header) > 0) {
    preg_match('/HTTP\/\d\.\d\s+(\d+)/', $http_response_header[0], $m);
    $httpCode = (int) ($m[1] ?? 0);
}

if ($httpCode !== 200 || $response === false) {
    $err = $response ? json_decode($response, true) : [];
    $msg = $err['error_description'] ?? $err['error'] ?? 'Ошибка обмена кода на токен';
    $redirect = '/yandexouth?error=' . rawurlencode($msg);
    header('Location: ' . $redirect, true, 302);
    exit;
}

$data = json_decode($response, true);
$accessToken = $data['access_token'] ?? '';
if ($accessToken === '') {
    $redirect = '/yandexouth?error=' . rawurlencode('В ответе Яндекса нет access_token');
    header('Location: ' . $redirect, true, 302);
    exit;
}

$tokenFile = __DIR__ . '/.yandex_oauth_token';
if (file_put_contents($tokenFile, $accessToken, LOCK_EX) === false) {
    $redirect = '/yandexouth?error=' . rawurlencode('Не удалось сохранить токен в .yandex_oauth_token');
    header('Location: ' . $redirect, true, 302);
    exit;
}

@chmod($tokenFile, 0600);

header('Location: /yandexouth?success=1', true, 302);
exit;
