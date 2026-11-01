<?php
/**
 * Admin Stats & KPI Overview Endpoint
 * Location: habesha-bites/api/admin/stats.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_check.php';

try {
    // 1. Total & Today's Revenue
    $revStmt = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status != 'cancelled'");
    $totalRevenue = (float)$revStmt->fetchColumn();

    $todayStmt = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) AS today_revenue FROM orders WHERE status != 'cancelled' AND DATE(created_at) = CURDATE()");
    $todayRevenue = (float)$todayStmt->fetchColumn();

    // 2. Orders Count by Status
    $totalOrdersStmt = $pdo->query("SELECT COUNT(*) FROM orders");
    $totalOrders = (int)$totalOrdersStmt->fetchColumn();

    $activeOrdersStmt = $pdo->query("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing', 'on_the_way')");
    $activeOrders = (int)$activeOrdersStmt->fetchColumn();

    $deliveredOrdersStmt = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'");
    $deliveredOrders = (int)$deliveredOrdersStmt->fetchColumn();

    // 3. Total Menu Items
    $menuCountStmt = $pdo->query("SELECT COUNT(*) FROM menu_items");
    $totalMenuItems = (int)$menuCountStmt->fetchColumn();

    $availableMenuItemsStmt = $pdo->query("SELECT COUNT(*) FROM menu_items WHERE is_available = 1");
    $availableMenuItems = (int)$availableMenuItemsStmt->fetchColumn();

    // 4. Customers Count
    $customersCountStmt = $pdo->query("SELECT COUNT(*) FROM user WHERE role = 'customer'");
    $totalCustomers = (int)$customersCountStmt->fetchColumn();

    // 5. Recent 5 Orders
    $recentOrdersStmt = $pdo->query("
        SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at, 
               COALESCE(u.name, 'Guest Customer') AS customer_name
        FROM orders o
        LEFT JOIN user u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
    ");
    $recentOrders = $recentOrdersStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_revenue'         => $totalRevenue,
            'today_revenue'         => $todayRevenue,
            'total_orders'          => $totalOrders,
            'active_orders'         => $activeOrders,
            'delivered_orders'      => $deliveredOrders,
            'total_menu_items'      => $totalMenuItems,
            'available_menu_items'  => $availableMenuItems,
            'total_customers'       => $totalCustomers
        ],
        'recent_orders' => $recentOrders
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

