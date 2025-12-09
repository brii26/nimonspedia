<?php

namespace App\Services\File;

/**
 * Interface for image processing operations
 * Handles metadata stripping, scaling, and preview generation
 */
interface ImageProcessorInterface
{
    /**
     * Process an image file: strip metadata, scale, generate preview
     * 
     * @param string $sourcePath Path to the source image
     * @param array $options Processing options
     *   - maxWidth: int Maximum width for scaling (default: 1920)
     *   - maxHeight: int Maximum height for scaling (default: 1080)
     *   - quality: int Quality for JPEG/WebP (default: 80)
     *   - generatePreview: bool Whether to generate preview (default: false)
     *   - previewWidth: int Preview width (default: 300)
     *   - previewHeight: int Preview height (default: 300)
     * @return array Processed image info ['path' => string, 'preview_path' => string|null]
     */
    public function process(string $sourcePath, array $options = []): array;

    /**
     * Strip metadata from an image (EXIF, etc.)
     * 
     * @param string $sourcePath Path to the image
     * @param string|null $destinationPath Optional destination (overwrites source if null)
     * @param int $quality Quality for re-encoding (0-100)
     * @return bool Success status
     */
    public function stripMetadata(string $sourcePath, ?string $destinationPath = null, int $quality = 80): bool;

    /**
     * Scale an image to fit within max dimensions while maintaining aspect ratio
     * 
     * @param string $sourcePath Path to the image
     * @param int $maxWidth Maximum width
     * @param int $maxHeight Maximum height
     * @param string|null $destinationPath Optional destination (overwrites source if null)
     * @param int $quality Quality for output (0-100)
     * @return bool Success status
     */
    public function scale(string $sourcePath, int $maxWidth, int $maxHeight, ?string $destinationPath = null, int $quality = 80): bool;

    /**
     * Generate a thumbnail/preview of an image
     * 
     * @param string $sourcePath Path to the source image
     * @param string $destinationPath Path for the preview
     * @param int $width Preview width
     * @param int $height Preview height
     * @param int $quality Quality for output (0-100)
     * @return bool Success status
     */
    public function generatePreview(string $sourcePath, string $destinationPath, int $width = 300, int $height = 300, int $quality = 80): bool;

    /**
     * Check if GD extension is available
     * 
     * @return bool
     */
    public function isAvailable(): bool;
}
