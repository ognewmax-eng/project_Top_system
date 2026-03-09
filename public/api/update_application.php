<?php
/**
 * update_application.php — обновление заявки (статус, данные).
 *
 * POST JSON для админа:
 *   { admin_password, application_id (числовой dbId), status, revision_comment? }
 *
 * POST JSON для пользователя (доработка):
 *   Authorization: Bearer <token>
 *   { ...обновлённые поля заявки }
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

try {
    $pdo = getDbConnection();

    if (isset($data['admin_password'])) {
        $adminPw = $data['admin_password'];
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

        $appId = (int) ($data['application_id'] ?? 0);
        $status = $data['status'] ?? '';
        if ($appId <= 0 || !in_array($status, ['review', 'approved', 'rejected', 'revision', 'reserve'], true)) {
            jsonResponse(['success' => false, 'error' => 'Неверные параметры (application_id, status)'], 400);
        }

        $comment = $data['revision_comment'] ?? '';

        $editableFields = [];
        $editParams = ['id' => $appId];
        $fieldMap = [
            'fullName'       => 'full_name',
            'birthDate'      => 'birth_date',
            'passportSeries' => 'passport_series',
            'passportNumber' => 'passport_number',
            'address'        => 'address',
            'school'         => 'school',
            'grade'          => 'grade',
            'phone'          => 'phone',
            'email'          => 'email',
            'shift'          => 'shift',
            'benefits'       => 'benefits',
            'attachments'    => 'attachments',
        ];
        foreach ($fieldMap as $jsKey => $dbCol) {
            if (isset($data[$jsKey]) && $data[$jsKey] !== '') {
                $editableFields[] = "$dbCol = :$dbCol";
                $editParams[$dbCol] = $data[$jsKey];
            }
        }

        $editableFields[] = 'status = :status';
        $editableFields[] = 'revision_comment = :comment';
        $editParams['status'] = $status;
        $editParams['comment'] = $comment;

        $sql = 'UPDATE applications SET ' . implode(', ', $editableFields) . ' WHERE id = :id';
        $pdo->prepare($sql)->execute($editParams);

        jsonResponse(['success' => true, 'message' => 'Заявка обновлена']);
    }

    $user = authenticateUser($pdo);
    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'Не авторизован'], 401);
    }

    $stmt = $pdo->prepare('SELECT id FROM applications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 1');
    $stmt->execute(['uid' => $user['id']]);
    $app = $stmt->fetch();
    if (!$app) {
        jsonResponse(['success' => false, 'error' => 'Заявка не найдена'], 404);
    }

    $fields = [
        'full_name'       => trim($data['fullName'] ?? ''),
        'birth_date'      => $data['birthDate'] ?? '',
        'passport_series' => $data['passportSeries'] ?? '',
        'passport_number' => $data['passportNumber'] ?? '',
        'address'         => $data['address'] ?? '',
        'school'          => $data['school'] ?? '',
        'grade'           => $data['grade'] ?? '',
        'phone'           => $data['phone'] ?? '',
        'email'           => trim($data['email'] ?? $user['email']),
        'shift'           => $data['shift'] ?? '',
        'benefits'        => $data['benefits'] ?? '[]',
        'attachments'     => $data['attachments'] ?? '[]',
        'status'          => 'review',
        'revision_comment' => '',
    ];

    $sets = [];
    $params = ['id' => $app['id']];
    foreach ($fields as $col => $val) {
        $sets[] = "$col = :$col";
        $params[$col] = $val;
    }
    $sql = 'UPDATE applications SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $pdo->prepare($sql)->execute($params);

    $userFields = [
        'full_name'       => $fields['full_name'],
        'birth_date'      => $fields['birth_date'],
        'passport_series' => $fields['passport_series'],
        'passport_number' => $fields['passport_number'],
        'address'         => $fields['address'],
        'school'          => $fields['school'],
        'grade'           => $fields['grade'],
        'phone'           => $fields['phone'],
        'shift'           => $fields['shift'],
        'benefits'        => $fields['benefits'],
    ];
    $uSets = [];
    $uParams = ['uid' => $user['id']];
    foreach ($userFields as $col => $val) {
        $uSets[] = "$col = :$col";
        $uParams[$col] = $val;
    }
    $pdo->prepare('UPDATE users SET ' . implode(', ', $uSets) . ' WHERE id = :uid')->execute($uParams);

    jsonResponse(['success' => true, 'message' => 'Заявка обновлена']);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}
