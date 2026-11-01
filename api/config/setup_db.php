<?php
/**
 * Database Migration & Seeder Script
 * Location: habesha-bites/api/config/setup_db.php
 */

require_once __DIR__ . '/db.php';

try {
    // Drop existing empty tables to ensure clean keys and types
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("DROP TABLE IF EXISTS order_items;");
    $pdo->exec("DROP TABLE IF EXISTS orders;");
    $pdo->exec("DROP TABLE IF EXISTS saved_addresses;");
    $pdo->exec("DROP TABLE IF EXISTS menu_items;");
    $pdo->exec("DROP TABLE IF EXISTS user;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 1. User Table
    $pdo->exec("
        CREATE TABLE user (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(30) NOT NULL,
            city VARCHAR(100) DEFAULT 'Addis Ababa, Ethiopia',
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 2. Menu Items Table
    $pdo->exec("
        CREATE TABLE menu_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            category VARCHAR(50) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            description TEXT,
            image TEXT,
            is_available TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 3. Orders Table
    $pdo->exec("
        CREATE TABLE orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            order_number VARCHAR(50) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            delivery_address TEXT NOT NULL,
            contact_phone VARCHAR(30) NOT NULL,
            status VARCHAR(50) DEFAULT 'on_the_way',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 4. Order Items Table
    $pdo->exec("
        CREATE TABLE order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            item_name VARCHAR(150) NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            subtotal DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 5. Saved Addresses Table
    $pdo->exec("
        CREATE TABLE saved_addresses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            label VARCHAR(50) NOT NULL,
            street_address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            is_default TINYINT(1) DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 6. Seed Admin & Demo Customer (Menu is left empty for Admin management)
    $adminPass = password_hash('admin123', PASSWORD_DEFAULT);
    $custPass  = password_hash('customer123', PASSWORD_DEFAULT);

    $userStmt = $pdo->prepare("INSERT INTO user (name, email, phone, city, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)");
    $userStmt->execute(['Habesha Bites Admin', 'admin@habeshabites.com', '+251 91 100 0000', 'Bole Sub-City, Addis Ababa', $adminPass, 'admin']);
    $adminId = $pdo->lastInsertId();

    $userStmt->execute(['Almaz Bekele', 'customer@habeshabites.com', '+251 91 234 5678', 'Kazanchis, Addis Ababa', $custPass, 'customer']);
    $custId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Database tables created with correct keys/types. Admin and customer accounts initialized. Menu is clean and ready for your custom dishes!'
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Setup error: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
