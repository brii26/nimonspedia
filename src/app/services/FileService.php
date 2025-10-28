<?php

class FileService
{
    private static string $basePath = __DIR__ . '/../../../storage';
    private static array $map = [
        'store_logo'    => 'store_logos',
        'product_image' => 'product_images'
    ];

    public static function saveUploadedImage(array $file, string $type): string
    {
        if (!isset(self::$map[$type])) {
            throw new InvalidArgumentException("Unknown type '{$type}'. Allowed: " . implode(', ', array_keys(self::$map)));
        }

        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('File upload error. Code: ' . ($file['error'] ?? 'unknown'));
        }

        $originalName = basename($file['name']);
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $nameOnly) ?: 'file';
        $finalFilename = time() . '_' . bin2hex(random_bytes(4)) . '_' . $safeName . '.' . $ext;

        $subfolder = self::$map[$type];
        $destinationDir = rtrim(self::$basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $subfolder;
        $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . $finalFilename;

        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            throw new RuntimeException('Failed to move uploaded file to destination.');
        }

        $relative = $subfolder . '/' . $finalFilename;
        return $relative;
    }
}
