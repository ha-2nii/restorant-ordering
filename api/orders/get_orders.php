<?php
/**
 * Fetch User Orders Endpoint
 * Location: habesha-bites/api/orders/get_orders.php
 */

require_once __DIR__ . '/../config/db.php';

session_start();

$userId = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;

try {
    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT * FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
    } else {
        // Return recent orders if no user filter specified
        $stmt = $pdo->query("
            SELECT * FROM orders 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
    }

    $orders = $stmt->fetchAll();

    // Attach items to each order
    $itemStmt = $pdo->prepare("
        SELECT * FROM order_items 
        WHERE order_id = ?
    ");

    foreach ($orders as &$order) {
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll();
    }

    echo json_encode([
        'success' => true,
        'count'   => count($orders),
        'orders'  => $orders
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
