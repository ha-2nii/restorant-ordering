<?php
/**
 * Admin Get All Orders Endpoint
 * Location: habesha-bites/api/admin/get_orders.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_check.php';

$status = trim($_GET['status'] ?? 'all');
$search = trim($_GET['search'] ?? '');

try {
    $sql = "
        SELECT 
            o.id,
            o.user_id,
            o.order_number,
            o.total_amount,
            o.delivery_address,
            o.contact_phone,
            o.status,
            o.created_at,
            COALESCE(u.name, 'Guest Customer') AS customer_name,
            COALESCE(u.email, 'guest@habeshabites.com') AS customer_email
        FROM orders o
        LEFT JOIN user u ON o.user_id = u.id
        WHERE 1=1
    ";
    $params = [];

    if ($status !== 'all' && !empty($status)) {
        $sql .= " AND o.status = ?";
        $params[] = $status;
    }

    if (!empty($search)) {
        $sql .= " AND (o.order_number LIKE ? OR u.name LIKE ? OR o.contact_phone LIKE ?)";
        $wildcard = "%{$search}%";
        $params[] = $wildcard;
        $params[] = $wildcard;
        $params[] = $wildcard;
    }

    $sql .= " ORDER BY o.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    // Attach line items to each order
    $itemStmt = $pdo->prepare("SELECT id, item_name, unit_price, quantity, subtotal FROM order_items WHERE order_id = ?");

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

