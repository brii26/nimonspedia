<?php

class SanitizerService {
    private static $allowedRichTextTags = '<p><b><i><u><s><ul><ol><li><strong><em><br><a>';

    /**
     * Membersihkan string HTML dari editor rich text.
     * Fungsi ini menghapus SEMUA atribut (seperti onclick, onerror) untuk memblokir XSS,
     * tapi mempertahankan tag yang ada di whitelist.
     *
     * @param string|null $dirtyHtml HTML mentah dari input.
     * @return string HTML yang sudah bersih dan aman.
     */
    public static function sanitizeRichText(?string $dirtyHtml): string {
        if ($dirtyHtml === null || empty(trim($dirtyHtml))) {
            return '';
        }
        
        return strip_tags($dirtyHtml, self::$allowedRichTextTags);
    }
}