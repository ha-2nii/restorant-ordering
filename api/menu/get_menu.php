<?php
/**
 * Fetch Menu Items Endpoint
 * Location: habesha-bites/api/menu/get_menu.php
 */

require_once __DIR__ . '/../config/db.php';

$category = $_GET['category'] ?? 'all';
$search   = trim($_GET['search'] ?? '');

try {
    $sql = "SELECT * FROM menu_items WHERE is_available = 1";
    $params = [];

    if ($category !== 'all' && !empty($category)) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }

    if (!empty($search)) {
        $sql .= " AND (name LIKE ? OR description LIKE ? OR category LIKE ?)";
        $wildcard = "%{$search}%";
        $params[] = $wildcard;
        $params[] = $wildcard;
        $params[] = $wildcard;
    }

    $sql .= " ORDER BY id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count'   => count($items),
        'items'   => $items
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
