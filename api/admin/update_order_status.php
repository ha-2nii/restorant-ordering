<?php
/**
 * Admin Update Order Status Endpoint
 * Location: habesha-bites/api/admin/update_order_status.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit();
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: $_POST;

$orderId = isset($input['order_id']) ? (int)$input['order_id'] : 0;
$status  = trim($input['status'] ?? '');

$allowedStatuses = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled'];

if (!$orderId || !in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Valid order_id and status are required. Allowed: ' . implode(', ', $allowedStatuses)
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $orderId]);

    if ($stmt->rowCount() > 0 || true) {
        echo json_encode([
            'success'   => true,
            'message'   => "Order status updated to '{$status}' successfully.",
            'order_id'  => $orderId,
            'new_status'=> $status
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

