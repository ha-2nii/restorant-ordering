<?php
/**
 * Safe Seeder Script: Admin Account & Sample Orders
 * Location: habesha-bites/api/config/seed_admin.php
 * 
 * Does NOT drop tables. Safely inserts/updates the admin user and creates realistic test orders.
 */

require_once __DIR__ . '/db.php';

try {
    // 1. Insert/Update Admin User
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $adminEmail = 'admin@habeshabites.com';

    $checkAdmin = $pdo->prepare("SELECT id FROM user WHERE email = ? LIMIT 1");
    $checkAdmin->execute([$adminEmail]);
    $adminId = $checkAdmin->fetchColumn();

    if (!$adminId) {
        $insertAdmin = $pdo->prepare("
            INSERT INTO user (name, email, phone, city, password_hash, role)
            VALUES (?, ?, ?, ?, ?, 'admin')
        ");
        $insertAdmin->execute([
            'Habesha Bites Admin',
            $adminEmail,
            '+251 91 100 0000',
            'Bole Sub-City, Addis Ababa',
            $adminPassword
        ]);
        $adminId = $pdo->lastInsertId();
    } else {
        $updateAdmin = $pdo->prepare("UPDATE user SET role = 'admin', password_hash = ? WHERE id = ?");
        $updateAdmin->execute([$adminPassword, $adminId]);
    }

    // 2. Insert/Update Demo Customer
    $custPassword = password_hash('customer123', PASSWORD_DEFAULT);
    $custEmail = 'customer@habeshabites.com';

    $checkCust = $pdo->prepare("SELECT id FROM user WHERE email = ? LIMIT 1");
    $checkCust->execute([$custEmail]);
    $custId = $checkCust->fetchColumn();

    if (!$custId) {
        $insertCust = $pdo->prepare("
            INSERT INTO user (name, email, phone, city, password_hash, role)
            VALUES (?, ?, ?, ?, ?, 'customer')
        ");
        $insertCust->execute([
            'Almaz Bekele',
            $custEmail,
            '+251 91 234 5678',
            'Kazanchis, Addis Ababa',
            $custPassword
        ]);
        $custId = $pdo->lastInsertId();
    }

    // 3. Seed Realistic Orders if fewer than 3 orders exist
    $ordersCount = (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
    if ($ordersCount < 3) {
        $sampleOrders = [
            [
                'number' => 'ET-9182',
                'amount' => 46.50,
                'address' => 'Kazanchis, Near ECA Building, Addis Ababa',
                'phone' => '+251 91 234 5678',
                'status' => 'pending',
                'items' => [
                    ['Special Sizzling Ribeye Tibs', 24.50, 1, 24.50],
                    ['Grand Doro Wat with Ayib', 22.00, 1, 22.00]
                ]
            ],
            [
                'number' => 'ET-8721',
                'amount' => 38.49,
                'address' => 'Bole Medhanialem, Atlas Road, Addis Ababa',
                'phone' => '+251 92 888 1234',
                'status' => 'preparing',
                'items' => [
                    ['Royal Beyaynetu Vegan Platter', 19.50, 1, 19.50],
                    ['Black Truffle Pizza Margherita', 18.99, 1, 18.99]
                ]
            ],
            [
                'number' => 'ET-7319',
                'amount' => 54.00,
                'address' => 'Sarbet, Old Airport area, Addis Ababa',
                'phone' => '+251 93 456 7890',
                'status' => 'on_the_way',
                'items' => [
                    ['Special Kitfo with Kocho', 23.50, 2, 47.00],
                    ['Crispy Falafel Mezze Platter', 14.50, 1, 14.50]
                ]
            ],
            [
                'number' => 'ET-6104',
                'amount' => 38.49,
                'address' => 'CMC Michael, Addis Ababa',
                'phone' => '+251 91 555 4321',
                'status' => 'delivered',
                'items' => [
                    ['Tokyo Spicy Tonkotsu Ramen', 16.50, 1, 16.50],
                    ['Lemon Herb Grilled Salmon', 21.99, 1, 21.99]
                ]
            ]
        ];

        foreach ($sampleOrders as $ord) {
            $ordStmt = $pdo->prepare("
                INSERT INTO orders (user_id, order_number, total_amount, delivery_address, contact_phone, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $ordStmt->execute([$custId, $ord['number'], $ord['amount'], $ord['address'], $ord['phone'], $ord['status']]);
            $newOrdId = $pdo->lastInsertId();

            $itemStmt = $pdo->prepare("
                INSERT INTO order_items (order_id, item_name, unit_price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?)
            ");
            foreach ($ord['items'] as $it) {
                $itemStmt->execute([$newOrdId, $it[0], $it[1], $it[2], $it[3]]);
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Admin user and demo data seeded successfully!',
        'admin_credentials' => [
            'email'    => $adminEmail,
            'password' => 'admin123',
            'role'     => 'admin'
        ],
        'customer_credentials' => [
            'email'    => $custEmail,
            'password' => 'customer123',
            'role'     => 'customer'
        ]
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

