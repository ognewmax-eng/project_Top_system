<?php
/**
 * get_stats.php — публичная статистика по заявкам (без авторизации).
 * GET → { success, total, approved, byShift: { "1": { submitted, approved }, ... } }
 */

require_once __DIR__ . '/db_config.php';
handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Метод не разрешён'], 405);
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("
        SELECT
            COALESCE(shift, '1') AS shift,
            COUNT(*) AS submitted,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
        FROM applications
        GROUP BY COALESCE(shift, '1')
    ");
    $rows = $stmt->fetchAll();

    $byShift = [
        '1' => ['submitted' => 0, 'approved' => 0],
        '2' => ['submitted' => 0, 'approved' => 0],
        '3' => ['submitted' => 0, 'approved' => 0],
    ];
    $total = 0;
    $totalApproved = 0;

    foreach ($rows as $row) {
        $sid = in_array($row['shift'], ['1', '2', '3'], true) ? $row['shift'] : '1';
        $byShift[$sid]['submitted'] += (int) $row['submitted'];
        $byShift[$sid]['approved']  += (int) $row['approved'];
        $total         += (int) $row['submitted'];
        $totalApproved += (int) $row['approved'];
    }

    jsonResponse([
        'success'  => true,
        'total'    => $total,
        'approved' => $totalApproved,
        'byShift'  => $byShift,
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Ошибка БД: ' . $e->getMessage()], 500);
}
