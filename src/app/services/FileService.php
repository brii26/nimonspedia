<?php

require_once __DIR__ . '/File/ImageProcessorInterface.php';
require_once __DIR__ . '/File/GdImageProcessor.php';
require_once __DIR__ . '/File/FileStorageInterface.php';
require_once __DIR__ . '/File/LocalFileStorage.php';

use App\Services\File\ImageProcessorInterface;
use App\Services\File\GdImageProcessor;
use App\Services\File\FileStorageInterface;
use App\Services\File\LocalFileStorage;

/**
 * File service for handling image uploads
 * 
 * Refactored to use DI pattern internally while preserving backward-compatible static methods
 * 
 * New flow: upload -> validate -> save -> strip metadata -> scale -> (optional) preview generation
 */
class FileService
{
    // ========================================
    // Static properties for backward compatibility
    // ========================================
    
    private static string $basePath = __DIR__ . '/../../../storage';
    
    private static array $map = [
        'store_logo'    => 'store_logos',
        'product_image' => 'product_images',
        'review_image'  => 'review_images',
    ];

    private static array $typeConfig = [
        'store_logo' => [
            'maxWidth' => 500,
            'maxHeight' => 500,
            'quality' => 85,
            'generatePreview' => false,
        ],
        'product_image' => [
            'maxWidth' => 1920,
            'maxHeight' => 1080,
            'quality' => 80,
            'generatePreview' => false,
        ],
        'review_image' => [
            'maxWidth' => 1200,
            'maxHeight' => 1200,
            'quality' => 80,
            'generatePreview' => true,
            'previewWidth' => 150,
            'previewHeight' => 150,
        ],
    ];

    // ========================================
    // Instance properties for DI pattern
    // ========================================
    
    private FileStorageInterface $storage;
    private ImageProcessorInterface $imageProcessor;

    /**
     * Create a new FileService instance with DI
     */
    public function __construct(
        ?FileStorageInterface $storage = null,
        ?ImageProcessorInterface $imageProcessor = null
    ) {
        $this->storage = $storage ?? new LocalFileStorage();
        $this->imageProcessor = $imageProcessor ?? new GdImageProcessor();
    }

    // ========================================
    // Static methods (backward compatibility)
    // ========================================

    /**
     * Get singleton instance for internal use
     */
    private static function getInstance(): self
    {
        static $instance = null;
        if ($instance === null) {
            $instance = new self();
        }
        return $instance;
    }

    /**
     * Validate image MIME type
     * @deprecated Use instance method validateMime() instead
     */
    public static function validateImageMime(array $file, array $allowedMimes): ?string
    {
        $fileName = $file['name'] ?? '';
        
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        // Allow 'jpg' as alias for 'jpeg'
        if ($ext === 'jpg') {
            $ext = 'jpeg';
        }
        
        $normalizedAllowed = array_map(function($m) {
            return $m === 'jpg' ? 'jpeg' : $m;
        }, $allowedMimes);
        
        if (!in_array($ext, $normalizedAllowed)) {
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
                'image/jpeg' => 'jpeg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
                'image/pjpeg' => 'jpeg',
            ];

            $detectedExt = $mimeToExtMap[$mimeType] ?? null;
            if (!in_array($detectedExt, $normalizedAllowed)) {
                return "File content type is not supported.";
            }
        }
        return null;
    }

    /**
     * Validate image file size
     * @deprecated Use instance method validateSize() instead
     */
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

    /**
     * Save uploaded image (backward compatible)
     * Now internally uses the new DI-based processing pipeline
     */
    public static function saveUploadedImage(array $file, string $type, ?string $oldFile = ''): string
    {
        return self::getInstance()->saveImage($file, $type, $oldFile);
    }

    /**
     * Delete a file (backward compatible)
     */
    public static function deleteFile(?string $relativePath): void
    {
        if (empty($relativePath)) {
            return;
        }
        self::getInstance()->delete($relativePath);
    }

    // ========================================
    // Instance methods (new DI-based API)
    // ========================================

    /**
     * Save an uploaded image with full processing pipeline
     * 
     * @param array $file $_FILES array element
     * @param string $type Image type (store_logo, product_image, review_image)
     * @param string|null $oldFile Previous file to delete after successful upload
     * @param array $options Override default processing options
     * @return string Relative path to saved image
     * @throws InvalidArgumentException If type is unknown
     * @throws RuntimeException If upload fails
     */
    public function saveImage(array $file, string $type, ?string $oldFile = '', array $options = []): string
    {
        // Validate type
        if (!isset(self::$map[$type])) {
            throw new InvalidArgumentException(
                "Unknown type '{$type}'. Allowed: " . implode(', ', array_keys(self::$map))
            );
        }

        // Handle no file uploaded
        if (!isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
            return $oldFile ?? '';
        }

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload error. Code: ' . $file['error']);
        }

        $folder = self::$map[$type];
        $processingOptions = array_merge(self::$typeConfig[$type] ?? [], $options);

        // Generate unique filename
        $filename = $this->storage->generateFilename($file['name']);

        // Ensure folder exists
        $this->storage->ensureFolder($folder);

        // Move uploaded file to storage
        $destinationPath = $this->storage->getFullPath($folder . '/' . $filename);
        
        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            throw new RuntimeException('Failed to move uploaded file to destination.');
        }

        // Process image (strip metadata, scale, generate preview)
        $result = $this->imageProcessor->process($destinationPath, $processingOptions);

        // Delete old file if provided
        if (!empty($oldFile)) {
            $this->delete($oldFile);
            
            // Also delete old preview if it exists
            $oldPreviewPath = $this->getPreviewPath($oldFile);
            if ($this->storage->exists($oldPreviewPath)) {
                $this->delete($oldPreviewPath);
            }
        }

        return $folder . '/' . $filename;
    }

    /**
     * Save multiple uploaded images
     * 
     * @param array $files $_FILES array with multiple files
     * @param string $type Image type
     * @param int $maxCount Maximum number of files to save
     * @param array $options Processing options
     * @return array Array of relative paths to saved images
     */
    public function saveMultipleImages(array $files, string $type, int $maxCount = 3, array $options = []): array
    {
        $savedPaths = [];
        $count = 0;

        // Handle both single file and multiple files array format
        if (isset($files['tmp_name']) && is_array($files['tmp_name'])) {
            // Multiple files format: $_FILES['images']['tmp_name'][0], [1], etc.
            foreach ($files['tmp_name'] as $key => $tmpName) {
                if ($count >= $maxCount) break;
                if ($files['error'][$key] !== UPLOAD_ERR_OK) continue;
                if (empty($tmpName)) continue;

                $singleFile = [
                    'name' => $files['name'][$key],
                    'tmp_name' => $tmpName,
                    'error' => $files['error'][$key],
                    'size' => $files['size'][$key],
                    'type' => $files['type'][$key] ?? '',
                ];

                try {
                    $path = $this->saveImage($singleFile, $type, null, $options);
                    if ($path) {
                        $savedPaths[] = $path;
                        $count++;
                    }
                } catch (Exception $e) {
                    error_log("Failed to save image: " . $e->getMessage());
                }
            }
        } else {
            try {
                $path = $this->saveImage($files, $type, null, $options);
                if ($path) {
                    $savedPaths[] = $path;
                }
            } catch (Exception $e) {
                error_log("Failed to save image: " . $e->getMessage());
            }
        }

        return $savedPaths;
    }

    /**
     * Delete a file from storage
     */
    public function delete(string $relativePath): bool
    {
        return $this->storage->delete($relativePath);
    }

    /**
     * Check if a file exists
     */
    public function exists(string $relativePath): bool
    {
        return $this->storage->exists($relativePath);
    }

    /**
     * Get full path for a relative path
     */
    public function getFullPath(string $relativePath): string
    {
        return $this->storage->getFullPath($relativePath);
    }

    /**
     * Get the preview path for an image
     */
    public function getPreviewPath(string $relativePath): string
    {
        $pathInfo = pathinfo($relativePath);
        return $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_preview.' . ($pathInfo['extension'] ?? 'jpg');
    }

    /**
     * Get the storage interface (for testing/mocking)
     */
    public function getStorage(): FileStorageInterface
    {
        return $this->storage;
    }

    /**
     * Get the image processor interface (for testing/mocking)
     */
    public function getImageProcessor(): ImageProcessorInterface
    {
        return $this->imageProcessor;
    }

    /**
     * Get folder name for a type
     */
    public static function getFolderForType(string $type): string
    {
        return self::$map[$type] ?? throw new InvalidArgumentException("Unknown type: {$type}");
    }

    /**
     * Get processing config for a type
     */
    public static function getConfigForType(string $type): array
    {
        return self::$typeConfig[$type] ?? [];
    }
}
