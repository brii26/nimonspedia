<?php

namespace App\Services\File;

/**
 * Interface for file storage operations
 */
interface FileStorageInterface
{
    /**
     * Save a file to storage
     * 
     * @param string $sourcePath Temporary source path
     * @param string $folder Target folder within storage
     * @param string|null $filename Custom filename (auto-generated if null)
     * @return string Relative path to saved file
     */
    public function save(string $sourcePath, string $folder, ?string $filename = null): string;

    /**
     * Delete a file from storage
     * 
     * @param string $relativePath Relative path to file
     * @return bool Success status
     */
    public function delete(string $relativePath): bool;

    /**
     * Check if a file exists
     * 
     * @param string $relativePath Relative path to file
     * @return bool
     */
    public function exists(string $relativePath): bool;

    /**
     * Get the full absolute path for a relative path
     * 
     * @param string $relativePath Relative path
     * @return string Absolute path
     */
    public function getFullPath(string $relativePath): string;

    /**
     * Get the base storage path
     * 
     * @return string
     */
    public function getBasePath(): string;

    /**
     * Ensure a folder exists within storage
     * 
     * @param string $folder Folder name
     * @return bool Success status
     */
    public function ensureFolder(string $folder): bool;

    /**
     * Generate a unique filename
     * 
     * @param string $originalName Original filename
     * @param string|null $prefix Optional prefix
     * @return string Generated filename
     */
    public function generateFilename(string $originalName, ?string $prefix = null): string;
}
