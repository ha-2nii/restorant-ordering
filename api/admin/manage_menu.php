<?php
/**
 * Admin Menu Management (CRUD) Endpoint
 * Location: habesha-bites/api/admin/manage_menu.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_check.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $category = $_GET['category'] ?? 'all';
        $sql = "SELECT * FROM menu_items WHERE 1=1";
        $params = [];

        if ($category !== 'all' && !empty($category)) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'count'   => count($items),
            'items'   => $items
        ]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit();
    }
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: $_POST;
    $action = $input['action'] ?? 'create';

    try {
        // 1. Toggle Availability
        if ($action === 'toggle') {
            $id = (int)($input['id'] ?? 0);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing dish ID.']);
                exit();
            }

            // Get current status
            $checkStmt = $pdo->prepare("SELECT is_available FROM menu_items WHERE id = ?");
            $checkStmt->execute([$id]);
            $current = $checkStmt->fetch();

            if (!$current) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Dish not found.']);
                exit();
            }

            $newStatus = $current['is_available'] ? 0 : 1;
            $updateStmt = $pdo->prepare("UPDATE menu_items SET is_available = ? WHERE id = ?");
            $updateStmt->execute([$newStatus, $id]);

            echo json_encode([
                'success'      => true,
                'message'      => 'Availability toggled successfully.',
                'id'           => $id,
                'is_available' => $newStatus
            ]);
            exit();
        }

        // 2. Delete Dish
        if ($action === 'delete') {
            $id = (int)($input['id'] ?? 0);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing dish ID.']);
                exit();
            }

            $delStmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
            $delStmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Dish deleted successfully.',
                'id'      => $id
            ]);
            exit();
        }

        // 3. Update Existing Dish
        if ($action === 'update') {
            $id          = (int)($input['id'] ?? 0);
            $name        = trim($input['name'] ?? '');
            $category    = trim($input['category'] ?? 'Habesha');
            $price       = floatval($input['price'] ?? 0);
            $description = trim($input['description'] ?? '');
            $image       = trim($input['image'] ?? '');
            $available   = isset($input['is_available']) ? (int)$input['is_available'] : 1;

            if (!$id || empty($name) || $price <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Valid ID, Name, and Price are required.']);
                exit();
            }

            $stmt = $pdo->prepare("
                UPDATE menu_items 
                SET name = ?, category = ?, price = ?, description = ?, image = ?, is_available = ?
                WHERE id = ?
            ");
            $stmt->execute([$name, $category, $price, $description, $image, $available, $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Dish updated successfully.',
                'dish'    => [
                    'id'           => $id,
                    'name'         => $name,
                    'category'     => $category,
                    'price'        => $price,
                    'description'  => $description,
                    'image'        => $image,
                    'is_available' => $available
                ]
            ]);
            exit();
        }

        // 4. Create New Dish
        if ($action === 'create') {
            $name        = trim($input['name'] ?? '');
            $category    = trim($input['category'] ?? 'Habesha');
            $price       = floatval($input['price'] ?? 0);
            $description = trim($input['description'] ?? '');
            $image       = trim($input['image'] ?? 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80');
            $available   = isset($input['is_available']) ? (int)$input['is_available'] : 1;

            if (empty($name) || $price <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Name and a valid positive Price are required.']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO menu_items (name, category, price, description, image, is_available)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $category, $price, $description, $image, $available]);
            $newId = (int)$pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'New dish added to menu successfully!',
                'dish'    => [
                    'id'           => $newId,
                    'name'         => $name,
                    'category'     => $category,
                    'price'        => $price,
                    'description'  => $description,
                    'image'        => $image,
                    'is_available' => $available
                ]
            ]);
            exit();
        }

        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

