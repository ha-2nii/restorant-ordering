<?php
/**
 * Create Order Endpoint
 * Location: habesha-bites/api/orders/create.php
 */

require_once __DIR__ . '/../config/db.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit();
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;

$userId          = $input['user_id'] ?? $_SESSION['user_id'] ?? null;
$totalAmount     = floatval($input['total_amount'] ?? 0);
$deliveryAddress = trim($input['delivery_address'] ?? 'Addis Ababa, Ethiopia');
$contactPhone    = trim($input['contact_phone'] ?? '+251 91 123 4567');
$items           = $input['items'] ?? [];

if ($totalAmount <= 0 || empty($items)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Cart cannot be empty.']);
    exit();
}

try {
    $pdo->beginTransaction();

    // Generate unique order number (e.g. ET-8492)
    $orderNumber = 'ET-' . rand(1000, 9999);

    $stmt = $pdo->prepare("
        INSERT INTO orders (user_id, order_number, total_amount, delivery_address, contact_phone, status)
        VALUES (?, ?, ?, ?, ?, 'on_the_way')
    ");
    $stmt->execute([$userId, $orderNumber, $totalAmount, $deliveryAddress, $contactPhone]);
    $orderId = $pdo->lastInsertId();

    // Insert order items
    $itemStmt = $pdo->prepare("
        INSERT INTO order_items (order_id, item_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?)
    ");

    foreach ($items as $item) {
        $name     = $item['item_name'] ?? $item['name'] ?? $item['dish_name'] ?? 'Meal Item';
        $price    = floatval($item['unitPrice'] ?? $item['price'] ?? 0);
        $qty      = intval($item['quantity'] ?? 1);
        $subtotal = $price * $qty;
        $itemStmt->execute([$orderId, $name, $price, $qty, $subtotal]);
    }

    $pdo->commit();

    echo json_encode([
        'success'      => true,
        'message'      => 'Order placed successfully!',
        'order_id'     => (int)$orderId,
        'order_number' => $orderNumber,
        'total'        => $totalAmount,
        'status'       => 'on_the_way',
        'eta'          => '20-30 mins'
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to place order: ' . $e->getMessage()]);
}
