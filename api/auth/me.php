<?php
/**
 * Current User Profile & Stats Endpoint
 * Location: habesha-bites/api/auth/me.php
 */

require_once __DIR__ . '/../config/db.php';

session_start();

$userId = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode([
        'success' => false,
        'isLoggedIn' => false,
        'message' => 'No active user session.'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, city, role, created_at FROM user WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit();
    }

    // Get stats
    $orderCountStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ?");
    $orderCountStmt->execute([$userId]);
    $orderCount = (int)$orderCountStmt->fetchColumn();

    $addressCountStmt = $pdo->prepare("SELECT COUNT(*) FROM saved_addresses WHERE user_id = ?");
    $addressCountStmt->execute([$userId]);
    $addressCount = (int)$addressCountStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'isLoggedIn' => true,
        'user' => $user,
        'stats' => [
            'completed_orders' => $orderCount,
            'saved_addresses'  => $addressCount,
            'favorite_dishes'  => 6
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
