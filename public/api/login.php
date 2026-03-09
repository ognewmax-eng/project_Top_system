<?php
/**
 * login.php — вход пользователя.
 * POST JSON: { email, password }
 * Возвращает { success, token, user }.
 */

require_once __DIR__ . '/db_config.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Метод не разрешён'], 405);
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    jsonResponse(['success' => false, 'error' => 'Некорректный JSON'], 400);
}

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($email === '' || $password === '') {
    jsonResponse(['success' => false, 'error' => 'Email и пароль обязательны'], 400);
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['success' => false, 'error' => 'Неверный email или пароль'], 401);
    }

    $token = bin2hex(random_bytes(32));
    $upd = $pdo->prepare('UPDATE users SET auth_token = :token WHERE id = :id');
    $upd->execute(['token' => $token, 'id' => $user['id']]);

    jsonResponse([
        'success' => true,
        'token'   => $token,
        'user'    => [
            'id'              => (int) $user['id'],
            'email'           => $user['email'],
            'fullName'        => $user['full_name'],
            'birthDate'       => $user['birth_date'],
            'passportSeries'  => $user['passport_series'],
            'passportNumber'  => $user['passport_number'],
            'address'         => $user['address'],
            'school'          => $user['school'],
            'grade'           => $user['grade'],
            'phone'           => $user['phone'],
            'shift'           => $user['shift'],
            'benefits'        => $user['benefits'],
        ],
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}
