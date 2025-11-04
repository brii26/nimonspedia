<?php
require_once __DIR__ . '/../src/core/Application.php';

try {
    $app = new Application();
    $app->run();
} catch (Exception $e) {
    echo "<h1>Application Error</h1>";
    echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>File: " . $e->getFile() . " (Line: " . $e->getLine() . ")</p>";
    
    if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
}