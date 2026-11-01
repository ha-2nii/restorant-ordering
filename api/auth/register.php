<?php
/**
 * User Registration Endpoint
 * Location: habesha-bites/api/auth/register.php
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

$name     = trim($input['name'] ?? '');
$email    = trim($input['email'] ?? '');
$phone    = trim($input['phone'] ?? '');
$city     = trim($input['city'] ?? 'Addis Ababa, Ethiopia');
$password = $input['password'] ?? '';

// Validation
if (empty($name) || empty($email) || empty($phone) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long.']);
    exit();
}

try {
    // Check if email already registered
    $stmt = $pdo->prepare("SELECT id FROM user WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
        exit();
    }

    // Hash password securely with Bcrypt
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    $insert = $pdo->prepare("
        INSERT INTO user (name, email, phone, city, password_hash, role)
        VALUES (?, ?, ?, ?, ?, 'customer')
    ");
    $insert->execute([$name, $email, $phone, $city, $password_hash]);

    $userId = $pdo->lastInsertId();

    $userData = [
        'id'    => (int)$userId,
        'name'  => $name,
        'email' => $email,
        'phone' => $phone,
        'city'  => $city,
        'role'  => 'customer'
    ];

    $_SESSION['user_id'] = $userId;
    $_SESSION['user'] = $userData;

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully! Welcome to Habesha Bites.',
        'user'    => $userData
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
}
