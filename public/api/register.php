<?php
/**
 * register.php — регистрация пользователя + создание заявки.
 * POST JSON: все поля анкеты + password.
 * Возвращает { success, token, user, applicationId }.
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

$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($email === '' || $password === '') {
    jsonResponse(['success' => false, 'error' => 'Email и пароль обязательны'], 400);
}

try {
    $pdo = getDbConnection();

    $existing = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $existing->execute(['email' => $email]);
    if ($existing->fetch()) {
        jsonResponse(['success' => false, 'error' => 'Пользователь с таким email уже существует'], 409);
    }

    $token = bin2hex(random_bytes(32));
    $hash  = password_hash($password, PASSWORD_BCRYPT);

    $benefitsRaw = $data['benefits'] ?? '[]';

    $stmt = $pdo->prepare('
        INSERT INTO users (email, password_hash, full_name, birth_date, passport_series, passport_number, address, school, grade, phone, shift, benefits, auth_token)
        VALUES (:email, :password_hash, :full_name, :birth_date, :passport_series, :passport_number, :address, :school, :grade, :phone, :shift, :benefits, :auth_token)
    ');
    $stmt->execute([
        'email'           => $email,
        'password_hash'   => $hash,
        'full_name'       => trim($data['fullName'] ?? ''),
        'birth_date'      => $data['birthDate'] ?? '',
        'passport_series' => $data['passportSeries'] ?? '',
        'passport_number' => $data['passportNumber'] ?? '',
        'address'         => $data['address'] ?? '',
        'school'          => $data['school'] ?? '',
        'grade'           => $data['grade'] ?? '',
        'phone'           => $data['phone'] ?? '',
        'shift'           => $data['shift'] ?? '',
        'benefits'        => $benefitsRaw,
        'auth_token'      => $token,
    ]);
    $userId = (int) $pdo->lastInsertId();

    $attachments = $data['attachments'] ?? '[]';

    $appStmt = $pdo->prepare('
        INSERT INTO applications (user_id, full_name, birth_date, passport_series, passport_number, address, school, grade, phone, email, shift, benefits, attachments, status)
        VALUES (:user_id, :full_name, :birth_date, :passport_series, :passport_number, :address, :school, :grade, :phone, :email, :shift, :benefits, :attachments, :status)
    ');
    $appStmt->execute([
        'user_id'         => $userId,
        'full_name'       => trim($data['fullName'] ?? ''),
        'birth_date'      => $data['birthDate'] ?? '',
        'passport_series' => $data['passportSeries'] ?? '',
        'passport_number' => $data['passportNumber'] ?? '',
        'address'         => $data['address'] ?? '',
        'school'          => $data['school'] ?? '',
        'grade'           => $data['grade'] ?? '',
        'phone'           => $data['phone'] ?? '',
        'email'           => $email,
        'shift'           => $data['shift'] ?? '',
        'benefits'        => $benefitsRaw,
        'attachments'     => $attachments,
        'status'          => 'review',
    ]);
    $appId = (int) $pdo->lastInsertId();

    jsonResponse([
        'success'       => true,
        'token'         => $token,
        'applicationId' => $appId,
        'user'          => [
            'id'              => $userId,
            'email'           => $email,
            'fullName'        => trim($data['fullName'] ?? ''),
            'birthDate'       => $data['birthDate'] ?? '',
            'passportSeries'  => $data['passportSeries'] ?? '',
            'passportNumber'  => $data['passportNumber'] ?? '',
            'address'         => $data['address'] ?? '',
            'school'          => $data['school'] ?? '',
            'grade'           => $data['grade'] ?? '',
            'phone'           => $data['phone'] ?? '',
            'shift'           => $data['shift'] ?? '',
            'benefits'        => $benefitsRaw,
        ],
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}
