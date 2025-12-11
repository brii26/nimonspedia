<?php

// CLI script to generate product image previews

require_once __DIR__ . '/../app/services/FileService.php';

use App\Services\File\GdImageProcessor;

echo "Starting product image preview generation...\n";

$storagePath = __DIR__ . '/../../storage/product_images';

if (!is_dir($storagePath)) {
    die("Error: Storage directory not found at $storagePath\n");
}

$processor = new GdImageProcessor();
if (!$processor->isAvailable()) {
    die("Error: GD extension is not available.\n");
}

$files = scandir($storagePath);
$count = 0;
$skipped = 0;
$errors = 0;

foreach ($files as $file) {
    if ($file === '.' || $file === '..') {
        continue;
    }

    // Skip gitkeep or other non-image files if necessary, 
    // but primarily we want to skip existing previews
    if (strpos($file, '_preview.') !== false) {
        continue;
    }

    $sourcePath = $storagePath . '/' . $file;
    
    // valid image extensions
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        continue;
    }

    $filename = pathinfo($file, PATHINFO_FILENAME);
    $previewPath = $storagePath . '/' . $filename . '_preview.' . $ext;

    if (file_exists($previewPath)) {
        $skipped++;
        continue;
    }

    echo "Generating preview for: $file... ";

    try {
        // Use default preview settings from FileService (300x300)
        if ($processor->generatePreview($sourcePath, $previewPath, 300, 300, 80)) {
            echo "OK\n";
            $count++;
        } else {
            echo "FAILED\n";
            $errors++;
        }
    } catch (Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\nSummary:\n";
echo "Generated: $count\n";
echo "Skipped (already exists): $skipped\n";
echo "Errors: $errors\n";
echo "Done.\n";


