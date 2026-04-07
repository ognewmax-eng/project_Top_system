<?php
/**
 * Общие проверки «уже зарегистрирован» для register.php и check_registration_eligibility.php.
 */

/** Нормализация ФИО ребёнка для сравнения: пробелы, регистр */
function normalizeChildFullName(string $name): string {
    $s = trim(preg_replace('/\s+/u', ' ', $name));
    if ($s === '') {
        return '';
    }
    return function_exists('mb_strtolower')
        ? mb_strtolower($s, 'UTF-8')
        : strtolower($s);
}

/**
 * @return array|null null если конфликта нет; иначе тело ответа с success=false для HTTP 409
 */
function registrationDuplicateConflict(PDO $pdo, string $email, array $data): ?array {
    $existing = $pdo->prepare('SELECT shift FROM users WHERE email = :email LIMIT 1');
    $existing->execute(['email' => $email]);
    $existingRow = $existing->fetch(PDO::FETCH_ASSOC);
    if ($existingRow) {
        $shiftVal = trim((string) ($existingRow['shift'] ?? ''));
        if ($shiftVal !== '') {
            $msg = 'Вы уже зарегистрированы в системе на смену № ' . $shiftVal . '.';
        } else {
            $msg = 'Вы уже зарегистрированы в системе. Войдите в личный кабинет, используя email и пароль, указанные при регистрации.';
        }
        return [
            'success'        => false,
            'error'          => $msg,
            'existingShift'  => $shiftVal !== '' ? $shiftVal : null,
            'code'           => 'already_registered',
        ];
    }

    $incomingBirthDate = trim((string) ($data['birthDate'] ?? ''));
    $normName = normalizeChildFullName(trim((string) ($data['fullName'] ?? '')));
    if ($normName !== '' && $incomingBirthDate !== '') {
        $byIdentity = $pdo->prepare('SELECT shift, full_name FROM users WHERE birth_date = :bd');
        $byIdentity->execute(['bd' => $incomingBirthDate]);
        while ($row = $byIdentity->fetch(PDO::FETCH_ASSOC)) {
            if (normalizeChildFullName((string) ($row['full_name'] ?? '')) !== $normName) {
                continue;
            }
            $shiftVal = trim((string) ($row['shift'] ?? ''));
            if ($shiftVal !== '') {
                $msg = 'Ребёнок с такими ФИО и датой рождения уже зарегистрирован в системе на смену № ' . $shiftVal . '.';
            } else {
                $msg = 'Ребёнок с такими ФИО и датой рождения уже зарегистрирован в системе. Для входа используйте email, указанный при первой регистрации.';
            }
            return [
                'success'       => false,
                'error'         => $msg,
                'existingShift' => $shiftVal !== '' ? $shiftVal : null,
                'code'          => 'already_registered_identity',
            ];
        }
    }

    return null;
}
