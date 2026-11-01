<?php
/**
 * Admin Customers List Endpoint
 * Location: habesha-bites/api/admin/customers.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_check.php';

try {
    $stmt = $pdo->query("
        SELECT 
            u.id,
            u.name,
            u.email,
            u.phone,
            u.city,
            u.role,
            u.created_at,
            COUNT(o.id) AS total_orders,
            COALESCE(SUM(o.total_amount), 0) AS total_spent
        FROM user u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer'
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ");
    $customers = $stmt->fetchAll();

    echo json_encode([
        'success'   => true,
        'count'     => count($customers),
        'customers' => $customers
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

