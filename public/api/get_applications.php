<?php
/**
 * get_applications.php — получение заявок.
 *
 * GET ?mode=all          — все заявки (для админа, требует ?admin_password=...)
 * GET ?mode=my           — заявка текущего пользователя (требует Authorization: Bearer <token>)
 */

require_once __DIR__ . '/db_config.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Метод не разрешён'], 405);
}

$mode = $_GET['mode'] ?? 'my';

try {
    $pdo = getDbConnection();

    if ($mode === 'all') {
        $adminPw = $_GET['admin_password'] ?? '';
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

        $stmt = $pdo->query('SELECT * FROM applications ORDER BY created_at DESC');
        $apps = $stmt->fetchAll();

        $result = array_map(function ($a) {
            return mapApplication($a);
        }, $apps);

        jsonResponse(['success' => true, 'applications' => $result]);
    }

    if ($mode === 'my') {
        $user = authenticateUser($pdo);
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Не авторизован'], 401);
        }

        $stmt = $pdo->prepare('SELECT * FROM applications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 1');
        $stmt->execute(['uid' => $user['id']]);
        $app = $stmt->fetch();

        jsonResponse([
            'success'     => true,
            'application' => $app ? mapApplication($app) : null,
        ]);
    }

    jsonResponse(['success' => false, 'error' => 'Неизвестный mode'], 400);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}

function mapApplication(array $a): array {
    return [
        'id'              => 'app_' . $a['id'],
        'dbId'            => (int) $a['id'],
        'userId'          => (int) $a['user_id'],
        'fullName'        => $a['full_name'],
        'birthDate'       => $a['birth_date'],
        'passportSeries'  => $a['passport_series'],
        'passportNumber'  => $a['passport_number'],
        'address'         => $a['address'],
        'school'          => $a['school'],
        'grade'           => $a['grade'],
        'phone'           => $a['phone'],
        'email'           => $a['email'],
        'shift'           => $a['shift'],
        'benefits'        => json_decode($a['benefits'] ?? '[]', true) ?: [],
        'attachments'     => $a['attachments'] ?? '[]',
        'status'          => $a['status'],
        'revisionComment' => $a['revision_comment'] ?? '',
        'createdAt'       => $a['created_at'],
        'updatedAt'       => $a['updated_at'] ?? $a['created_at'],
    ];
}
