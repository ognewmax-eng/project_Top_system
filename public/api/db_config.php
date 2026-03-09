<?php
/**
 * db_config.php — подключение к MySQL.
 * Параметры берутся из переменных окружения или файла .db_credentials.
 *
 * Формат .db_credentials (4 строки):
 *   хост
 *   имя_базы
 *   пользователь
 *   пароль
 */

function getDbConnection(): PDO {
    $host = getenv('DB_HOST');
    $name = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');

    if (!$host || !$name || !$user) {
        $credsFile = __DIR__ . '/.db_credentials';
        if (is_file($credsFile) && is_readable($credsFile)) {
            $lines = array_map('trim', file($credsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
            $host = $host ?: ($lines[0] ?? '');
            $name = $name ?: ($lines[1] ?? '');
            $user = $user ?: ($lines[2] ?? '');
            $pass = ($pass !== false && $pass !== '') ? $pass : ($lines[3] ?? '');
        }
    }

    if (!$host || !$name || !$user) {
        throw new RuntimeException('Не заданы параметры БД (DB_HOST / DB_NAME / DB_USER). Создайте api/.db_credentials');
    }

    $dsn = "mysql:host=$host;dbname=$name;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function handleCors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Проверяет auth_token из заголовка Authorization: Bearer <token>.
 * Возвращает массив user или null.
 */
function authenticateUser(PDO $pdo): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        $token = $m[1];
        $stmt = $pdo->prepare('SELECT * FROM users WHERE auth_token = :token LIMIT 1');
        $stmt->execute(['token' => $token]);
        $user = $stmt->fetch();
        return $user ?: null;
    }
    return null;
}
