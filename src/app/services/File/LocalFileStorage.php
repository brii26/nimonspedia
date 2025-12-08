<?php

namespace App\Services\File;

/**
 * Local filesystem storage implementation
 */
class LocalFileStorage implements FileStorageInterface
{
    private string $basePath;

    /**
     * @param string|null $basePath Base storage path (defaults to project storage folder)
     */
    public function __construct(?string $basePath = null)
    {
        $this->basePath = $basePath ?? realpath(__DIR__ . '/../../../../storage') ?: __DIR__ . '/../../../../storage';
    }

    /**
     * {@inheritdoc}
     */
    public function save(string $sourcePath, string $folder, ?string $filename = null): string
    {
        $this->ensureFolder($folder);
        
        if ($filename === null) {
            $filename = $this->generateFilename(basename($sourcePath));
        }

        $relativePath = $folder . '/' . $filename;
        $destinationPath = $this->getFullPath($relativePath);

        if (!rename($sourcePath, $destinationPath)) {
            throw new \RuntimeException("Failed to move file to {$destinationPath}");
        }

        return $relativePath;
    }

    /**
     * {@inheritdoc}
     */
    public function delete(string $relativePath): bool
    {
        if (empty($relativePath)) {
            return false;
        }

        $fullPath = $this->getFullPath($relativePath);
        
        if (!file_exists($fullPath)) {
            return true; // Already deleted
        }

        return @unlink($fullPath);
    }

    /**
     * {@inheritdoc}
     */
    public function exists(string $relativePath): bool
    {
        return file_exists($this->getFullPath($relativePath));
    }

    /**
     * {@inheritdoc}
     */
    public function getFullPath(string $relativePath): string
    {
        return rtrim($this->basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . ltrim($relativePath, DIRECTORY_SEPARATOR);
    }

    /**
     * {@inheritdoc}
     */
    public function getBasePath(): string
    {
        return $this->basePath;
    }

    /**
     * {@inheritdoc}
     */
    public function ensureFolder(string $folder): bool
    {
        $fullPath = $this->getFullPath($folder);
        
        if (is_dir($fullPath)) {
            return true;
        }

        return mkdir($fullPath, 0755, true);
    }

    /**
     * {@inheritdoc}
     */
    public function generateFilename(string $originalName, ?string $prefix = null): string
    {
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $nameOnly = pathinfo($originalName, PATHINFO_FILENAME);
        
        // Sanitize filename
        $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $nameOnly) ?: 'file';
        
        // Generate unique prefix
        $uniquePrefix = $prefix ?? bin2hex(random_bytes(4));
        
        return $uniquePrefix . '_' . $safeName . '.' . $ext;
    }
}
