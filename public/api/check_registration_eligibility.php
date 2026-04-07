<?php
/**
 * Предпроверка: можно ли зарегистрироваться (email / ФИО+дата рождения не заняты).
 * POST JSON: { email, fullName, birthDate } — без пароля и без файлов.
 */

require_once __DIR__ . '/db_config.php';
require_once __DIR__ . '/registration_checks.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Метод не разрешён'], 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    jsonResponse(['success' => false, 'error' => 'Некорректный JSON'], 400);
}

$email = trim($data['email'] ?? '');
if ($email === '') {
    jsonResponse(['success' => false, 'error' => 'Укажите email'], 400);
}

try {
    $pdo = getDbConnection();
    $conflict = registrationDuplicateConflict($pdo, $email, $data);
    if ($conflict !== null) {
        jsonResponse($conflict, 409);
    }
    jsonResponse(['success' => true, 'eligible' => true]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}
