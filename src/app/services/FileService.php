<?php

class FileService
{
    private static string $basePath = __DIR__ . '/../../../storage';
    private static array $map = [
        'store_logo'    => 'store_logos',
        'product_image' => 'product_images'
    ];

    public static function validateImageMime(array $file, array $allowedMimes): ?string
    {
        $fileName = $file['name'] ?? '';
        
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedMimes)) {
            return "File type is invalid. Allowed types: " . implode(', ', $allowedMimes);
        }

        if (extension_loaded('fileinfo')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo === false) {
                 return null;
            }
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            $mimeToExtMap = [
                'image/jpeg' => 'jpeg', 'image/png' => 'png', 
                'image/gif' => 'gif', 'image/webp' => 'webp',
                'image/pjpeg' => 'jpeg' 
            ];

            $detectedExt = $mimeToExtMap[$mimeType] ?? null;
            if (!in_array($detectedExt, $allowedMimes)) {
                return "File content type is not supported.";
            }
        }
        return null;
    }

    public static function validateImageSize(array $file, int $maxSizeBytes): ?string
    {
        if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
            $maxMB = round($maxSizeBytes / 1024 / 1024);
            return "File size exceeds the server limit (max {$maxMB} MB).";
        }
        
        if ($file['size'] > $maxSizeBytes) {
            $maxMB = round($maxSizeBytes / 1024 / 1024);
            return "File size must not exceed {$maxMB} MB.";
        }
        
        return null;
    }


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
            imagejpeg($img, $path, 30);
            break;
        case 'image/png':
            imagesavealpha($img, true);
            imagepng($img, $path, 7);
            break;
		case 'image/webp':
			imagewebp($img, $path, 30); 
			break;
    }

    imagedestroy($img);
}

    public static function saveUploadedImage(array $file, string $type, ?string $oldFile = ''){
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

		if ($oldFile) {
			    self::deleteFile($oldFile);
			}

        $relative = $subfolder . '/' . $finalFilename;
        return $relative;
    }

    public static function deleteFile(?string $relativePath): void 
    {
        $fullPath = rtrim(self::$basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $relativePath;
        
        if (!file_exists($fullPath)) {
            return;
        }

		@unlink($fullPath);
    }
}
