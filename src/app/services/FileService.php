<?php

class FileService
{
    private static string $basePath = __DIR__ . '/../../../storage';
    private static array $map = [
        'store_logo'    => 'store_logos',
        'product_image' => 'product_images'
    ];

	private static function reencodeWithoutMetadata(string $path): void {
    if (!extension_loaded('gd')) return;

    $info = getimagesize($path);
    if ($info === false) return;
    $mime = $info['mime'];

    switch ($mime) {
        case 'image/jpeg':
            $img = @imagecreatefromjpeg($path);
            break;
        case 'image/png':
            $img = @imagecreatefrompng($path);
            break;
		case 'image/webp':
			$img = @imagecreatefromwebp($path);
			break;
        default:
            return; 
    }

    if (!$img) return;
    switch ($mime) {
        case 'image/jpeg':
            imagejpeg($img, $path, 70);
            break;
        case 'image/png':
            imagesavealpha($img, true);
            imagepng($img, $path, 3);
            break;
		case 'image/webp':
			imagewebp($img, $path, 70); 
			break;
    }

    imagedestroy($img);
}

    public static function saveUploadedImage(array $file, string $type, string $oldFile = ''){
        if (!isset(self::$map[$type])) {
            throw new InvalidArgumentException("Unknown type '{$type}'. Allowed: " . implode(', ', array_keys(self::$map)));
        }

        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
			if ($file['error'] === UPLOAD_ERR_NO_FILE) {
				return $oldFile;
			}else {
				throw new RuntimeException('Upload error. Code: ' . $file['error']);
			}
        }

        $originalName = basename($file['name']);
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $nameOnly) ?: 'file';
        $finalFilename = bin2hex(random_bytes(4)) . '_' . $safeName . '.' . $ext;

        $subfolder = self::$map[$type];
        $destinationDir = rtrim(self::$basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $subfolder;
        $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . $finalFilename;

        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            throw new RuntimeException('Failed to move uploaded file to destination.');
        }

		self::reencodeWithoutMetadata($destinationPath);

        $relative = $subfolder . '/' . $finalFilename;
        return $relative;
    }

    public static function deleteFile(string $relativePath): void 
    {
        $fullPath = rtrim(self::$basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $relativePath;
        
        if (!file_exists($fullPath)) {
            return;
        }
    }
}
