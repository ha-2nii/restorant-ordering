<?php
/**
 * User Login Endpoint
 * Location: habesha-bites/api/auth/login.php
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

$identifier = trim($input['identifier'] ?? $input['email'] ?? '');
$password   = $input['password'] ?? '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email/Phone and password are required.']);
    exit();
}

try {
    // Find user by email or phone
    $stmt = $pdo->prepare("SELECT * FROM user WHERE email = ? OR phone = ? LIMIT 1");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email/phone or password.']);
        exit();
    }

    $userData = [
        'id'    => (int)$user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'city'  => $user['city'],
        'role'  => $user['role']
    ];

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user'] = $userData;

    echo json_encode([
        'success' => true,
        'message' => 'Welcome back, ' . htmlspecialchars($user['name']) . '!',
        'user'    => $userData
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Login error: ' . $e->getMessage()]);
}
