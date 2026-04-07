<?php
/**
 * admin_set_user_password.php — смена пароля пользователя администратором.
 * POST JSON: { admin_password, user_id, new_password }
 */

require_once __DIR__ . '/db_config.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Метод не разрешён'], 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    jsonResponse(['success' => false, 'error' => 'Некорректный JSON'], 400);
}

$adminPw = $data['admin_password'] ?? '';
$userId = (int) ($data['user_id'] ?? 0);
$newPassword = (string) ($data['new_password'] ?? '');

if ($userId <= 0 || $newPassword === '') {
    jsonResponse(['success' => false, 'error' => 'Укажите user_id и новый пароль'], 400);
}
if (strlen($newPassword) < 6) {
    jsonResponse(['success' => false, 'error' => 'Пароль не короче 6 символов'], 400);
}

$adminPwExpected = getenv('ADMIN_PASSWORD');
if ($adminPwExpected === false || $adminPwExpected === '') {
    $credsFile = __DIR__ . '/.admin_password';
    if (is_file($credsFile) && is_readable($credsFile)) {
        $adminPwExpected = trim(file_get_contents($credsFile));
    }
}
if ($adminPwExpected === '' || $adminPwExpected === false) {
    $adminPwExpected = 'admin123';
}
if ($adminPw !== $adminPwExpected) {
    jsonResponse(['success' => false, 'error' => 'Неверный пароль администратора'], 403);
}

try {
    $pdo = getDbConnection();
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('UPDATE users SET password_hash = :h, auth_token = :t WHERE id = :id');
    $stmt->execute(['h' => $hash, 't' => $token, 'id' => $userId]);
    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'Пользователь не найден'], 404);
    }
    jsonResponse(['success' => true, 'message' => 'Пароль обновлён']);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}
