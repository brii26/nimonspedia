<?php
// public/test_session.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Terapkan fix yang sama seperti di Application.php
$redisHost = getenv('REDIS_HOST') ?: 'redis';
$redisPort = getenv('REDIS_PORT') ?: '6379';
ini_set('session.save_path', "tcp://$redisHost:$redisPort");

// Explicitly set cookie params to debug Incognito issue
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => null, // Removed: Let browser decide default for localhost
    'secure' => false,
    'httponly' => true,
    // 'samesite' => 'Lax' // Removed: Let browser decide default, or try "None" with secure true.
]);

session_start();

if (!isset($_SESSION['count'])) {
    $_SESSION['count'] = 0;
    echo "Session Baru. Count = 0<br>";
} else {
    $_SESSION['count']++;
    echo "Session Lama. Count = " . $_SESSION['count'] . "<br>";
}

echo "Session ID: " . session_id() . "<br>";
echo "Save Path: " . ini_get('session.save_path') . "<br>";
echo "Save Handler: " . ini_get('session.save_handler') . "<br>";
echo "Cookie Params: " . json_encode(session_get_cookie_params()) . "<br>";
?>