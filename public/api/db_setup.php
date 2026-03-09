<?php
/**
 * db_setup.php — создание таблиц users и applications.
 * Запускать один раз: https://ваш-домен/api/db_setup.php
 * После успешного выполнения файл можно удалить.
 */

require_once __DIR__ . '/db_config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $pdo = getDbConnection();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            email         VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name     VARCHAR(255) DEFAULT '',
            birth_date    VARCHAR(20)  DEFAULT '',
            passport_series VARCHAR(10) DEFAULT '',
            passport_number VARCHAR(10) DEFAULT '',
            address       TEXT,
            school        VARCHAR(255) DEFAULT '',
            grade         VARCHAR(10)  DEFAULT '',
            phone         VARCHAR(50)  DEFAULT '',
            shift         VARCHAR(5)   DEFAULT '',
            benefits      TEXT,
            auth_token    VARCHAR(64)  DEFAULT NULL,
            created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS applications (
            id               INT AUTO_INCREMENT PRIMARY KEY,
            user_id          INT NOT NULL,
            full_name        VARCHAR(255) DEFAULT '',
            birth_date       VARCHAR(20)  DEFAULT '',
            passport_series  VARCHAR(10)  DEFAULT '',
            passport_number  VARCHAR(10)  DEFAULT '',
            address          TEXT,
            school           VARCHAR(255) DEFAULT '',
            grade            VARCHAR(10)  DEFAULT '',
            phone            VARCHAR(50)  DEFAULT '',
            email            VARCHAR(255) DEFAULT '',
            shift            VARCHAR(5)   DEFAULT '',
            benefits         TEXT,
            attachments      TEXT,
            status           ENUM('review','approved','rejected','revision','reserve') DEFAULT 'review',
            revision_comment TEXT,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        ALTER TABLE applications
        MODIFY COLUMN status ENUM('review','approved','rejected','revision','reserve') DEFAULT 'review'
    ");

    echo '<h2 style="color:green">Таблицы успешно созданы / обновлены!</h2>';
    echo '<p><strong>users</strong> — пользователи (логин/пароль)</p>';
    echo '<p><strong>applications</strong> — заявки участников</p>';
    echo '<p>Колонка <code>status</code> обновлена: добавлен статус <strong>reserve</strong>.</p>';
    echo '<p style="color:#888">Этот файл можно удалить после выполнения.</p>';
} catch (Exception $e) {
    echo '<h2 style="color:red">Ошибка</h2>';
    echo '<pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
}
