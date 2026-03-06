<?php
/**
 * save_data.php — приём JSON-данных анкет участников и сохранение в локальный JSON.
 * Вариант для Shared-хостинга без MySQL. При переносе на VPS можно заменить на запись в SQLite/MySQL.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не разрешён']);
    exit;
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Тело запроса пусто']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Некорректный JSON']);
    exit;
}

// Папка для хранения данных (в корне api/)
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Не удалось создать папку data']);
        exit;
    }
}

$file = $dataDir . '/applications.json';
$list = [];
if (file_exists($file)) {
    $content = file_get_contents($file);
    if ($content !== false) {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $list = $decoded;
        }
    }
}

// Добавляем метаданные к заявке
$data['id'] = 'app_' . (string) (time() . '_' . bin2hex(random_bytes(4)));
$data['status'] = $data['status'] ?? 'review';
$data['createdAt'] = date('Y-m-d H:i:s');

$list[] = $data;

$json = json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
if ($json === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка сериализации']);
    exit;
}

if (file_put_contents($file, $json) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Не удалось записать файл']);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $data['id'],
    'message' => 'Заявка сохранена',
]);
