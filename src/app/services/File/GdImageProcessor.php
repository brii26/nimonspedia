<?php

namespace App\Services\File;

/**
 * GD-based image processor implementation
 * Handles metadata stripping, scaling, and preview generation
 */
class GdImageProcessor implements ImageProcessorInterface
{
    private const SUPPORTED_MIMES = [
        'image/jpeg' => 'jpeg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    private const DEFAULT_OPTIONS = [
        'maxWidth' => 1920,
        'maxHeight' => 1080,
        'quality' => 80,
        'generatePreview' => false,
        'previewWidth' => 300,
        'previewHeight' => 300,
        'previewQuality' => 80,
    ];

    /**
     * {@inheritdoc}
     */
    public function isAvailable(): bool
    {
        return extension_loaded('gd');
    }

    /**
     * {@inheritdoc}
     */
    public function process(string $sourcePath, array $options = []): array
    {
        $options = array_merge(self::DEFAULT_OPTIONS, $options);
        
        $result = [
            'path' => $sourcePath,
            'preview_path' => null,
        ];

        if (!$this->isAvailable()) {
            return $result;
        }

        // Step 1: Strip metadata (re-encodes the image)
        $this->stripMetadata($sourcePath, null, $options['quality']);

        // Step 2: Scale if needed
        $this->scale(
            $sourcePath,
            $options['maxWidth'],
            $options['maxHeight'],
            null,
            $options['quality']
        );

        // Step 3: Generate preview if requested
        if ($options['generatePreview']) {
            $pathInfo = pathinfo($sourcePath);
            $previewPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_preview.' . $pathInfo['extension'];
            
            if ($this->generatePreview(
                $sourcePath,
                $previewPath,
                $options['previewWidth'],
                $options['previewHeight'],
                $options['previewQuality']
            )) {
                $result['preview_path'] = $previewPath;
            }
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function stripMetadata(string $sourcePath, ?string $destinationPath = null, int $quality = 80): bool
    {
        if (!$this->isAvailable()) {
            return false;
        }

        $imageInfo = @getimagesize($sourcePath);
        if ($imageInfo === false) {
            return false;
        }

        $mime = $imageInfo['mime'];
        if (!isset(self::SUPPORTED_MIMES[$mime])) {
            return false;
        }

        $image = $this->createImageFromFile($sourcePath, $mime);
        if (!$image) {
            return false;
        }

        $destination = $destinationPath ?? $sourcePath;
        $success = $this->saveImage($image, $destination, $mime, $quality);
        
        imagedestroy($image);
        
        return $success;
    }

    /**
     * {@inheritdoc}
     */
    public function scale(string $sourcePath, int $maxWidth, int $maxHeight, ?string $destinationPath = null, int $quality = 80): bool
    {
        if (!$this->isAvailable()) {
            return false;
        }

        $imageInfo = @getimagesize($sourcePath);
        if ($imageInfo === false) {
            return false;
        }

        [$originalWidth, $originalHeight] = $imageInfo;
        $mime = $imageInfo['mime'];

        if (!isset(self::SUPPORTED_MIMES[$mime])) {
            return false;
        }

        // Check if scaling is needed
        if ($originalWidth <= $maxWidth && $originalHeight <= $maxHeight) {
            // No scaling needed, but copy if destination is different
            if ($destinationPath !== null && $destinationPath !== $sourcePath) {
                return copy($sourcePath, $destinationPath);
            }
            return true;
        }

        // Calculate new dimensions maintaining aspect ratio
        $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
        $newWidth = (int) round($originalWidth * $ratio);
        $newHeight = (int) round($originalHeight * $ratio);

        $sourceImage = $this->createImageFromFile($sourcePath, $mime);
        if (!$sourceImage) {
            return false;
        }

        $scaledImage = imagecreatetruecolor($newWidth, $newHeight);
        if (!$scaledImage) {
            imagedestroy($sourceImage);
            return false;
        }

        // Preserve transparency for PNG and WebP
        $this->preserveTransparency($scaledImage, $mime);

        // High-quality resampling
        imagecopyresampled(
            $scaledImage,
            $sourceImage,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );

        $destination = $destinationPath ?? $sourcePath;
        $success = $this->saveImage($scaledImage, $destination, $mime, $quality);

        imagedestroy($sourceImage);
        imagedestroy($scaledImage);

        return $success;
    }

    /**
     * {@inheritdoc}
     */
    public function generatePreview(string $sourcePath, string $destinationPath, int $width = 300, int $height = 300, int $quality = 80): bool
    {
        if (!$this->isAvailable()) {
            return false;
        }

        $imageInfo = @getimagesize($sourcePath);
        if ($imageInfo === false) {
            return false;
        }

        [$originalWidth, $originalHeight] = $imageInfo;
        $mime = $imageInfo['mime'];

        if (!isset(self::SUPPORTED_MIMES[$mime])) {
            return false;
        }

        $sourceImage = $this->createImageFromFile($sourcePath, $mime);
        if (!$sourceImage) {
            return false;
        }

        // Calculate crop dimensions for center crop (square preview)
        $sourceRatio = $originalWidth / $originalHeight;
        $targetRatio = $width / $height;

        if ($sourceRatio > $targetRatio) {
            // Source is wider, crop sides
            $cropHeight = $originalHeight;
            $cropWidth = (int) round($originalHeight * $targetRatio);
            $cropX = (int) round(($originalWidth - $cropWidth) / 2);
            $cropY = 0;
        } else {
            // Source is taller, crop top/bottom
            $cropWidth = $originalWidth;
            $cropHeight = (int) round($originalWidth / $targetRatio);
            $cropX = 0;
            $cropY = (int) round(($originalHeight - $cropHeight) / 2);
        }

        $previewImage = imagecreatetruecolor($width, $height);
        if (!$previewImage) {
            imagedestroy($sourceImage);
            return false;
        }

        $this->preserveTransparency($previewImage, $mime);

        // Crop and resize
        imagecopyresampled(
            $previewImage,
            $sourceImage,
            0, 0,
            $cropX, $cropY,
            $width, $height,
            $cropWidth, $cropHeight
        );

        $success = $this->saveImage($previewImage, $destinationPath, $mime, $quality);

        imagedestroy($sourceImage);
        imagedestroy($previewImage);

        return $success;
    }

    /**
     * Create GD image resource from file
     */
    private function createImageFromFile(string $path, string $mime): ?\GdImage
    {
        switch ($mime) {
            case 'image/jpeg':
                return @imagecreatefromjpeg($path) ?: null;
            case 'image/png':
                return @imagecreatefrompng($path) ?: null;
            case 'image/webp':
                return @imagecreatefromwebp($path) ?: null;
            case 'image/gif':
                return @imagecreatefromgif($path) ?: null;
            default:
                return null;
        }
    }

    /**
     * Save GD image to file
     */
    private function saveImage(\GdImage $image, string $path, string $mime, int $quality): bool
    {
        switch ($mime) {
            case 'image/jpeg':
                return imagejpeg($image, $path, $quality);
            case 'image/png':
                // PNG compression level is 0-9 (inverse of quality percentage)
                $compression = (int) round((100 - $quality) / 100 * 9);
                imagesavealpha($image, true);
                return imagepng($image, $path, $compression);
            case 'image/webp':
                return imagewebp($image, $path, $quality);
            case 'image/gif':
                return imagegif($image, $path);
            default:
                return false;
        }
    }

    /**
     * Preserve transparency for PNG and WebP images
     */
    private function preserveTransparency(\GdImage $image, string $mime): void
    {
        if ($mime === 'image/png' || $mime === 'image/webp' || $mime === 'image/gif') {
            imagealphablending($image, false);
            imagesavealpha($image, true);
            $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
            imagefilledrectangle($image, 0, 0, imagesx($image), imagesy($image), $transparent);
            imagealphablending($image, true);
        }
    }
}
