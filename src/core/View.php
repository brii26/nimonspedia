<?php

class View {
    /**
     * Render a template with data
     */
    public static function render($template, $data = []) {
        extract($data);
        
        ob_start();
        
        $templatePath = self::getTemplatePath($template);
        if (file_exists($templatePath)) {
            include $templatePath;
        } else {
            throw new Exception("Template not found: {$template}");
        }
        
        return ob_get_clean();
    }
    
    /**
     * Render a component
     */
    public static function component($component, $data = []) {
        return self::render("components/{$component}", $data);
    }
    
    /**
     * Render a page
     */
    public static function page($page, $data = []) {
        return self::render("pages/{$page}", $data);
    }
    
    /**
     * Get template path
     */
    private static function getTemplatePath($template) {
        return __DIR__ . '/../app/views/' . $template . '.php';
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    public static function escape($string) {
        return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Get CSRF token for forms
     */
    public static function csrf() {
        return Auth::csrfToken();
    }
    
    /**
     * Format currency (Indonesian Rupiah)
     */
    public static function currency($amount) {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
    
    /**
     * Format date
     */
    public static function date($date, $format = 'd M Y H:i') {
        return date($format, strtotime($date));
    }
    
    /**
     * Create pagination links
     */
    public static function pagination($currentPage, $totalPages, $baseUrl) {
        $html = '<div class="pagination">';
        
        // Previous button
        if ($currentPage > 1) {
            $prevPage = $currentPage - 1;
            $html .= "<a href='{$baseUrl}?page={$prevPage}' class='page-btn'>← Previous</a>";
        }
        
        // Page numbers
        $start = max(1, $currentPage - 2);
        $end = min($totalPages, $currentPage + 2);
        
        if ($start > 1) {
            $html .= "<a href='{$baseUrl}?page=1' class='page-num'>1</a>";
            if ($start > 2) {
                $html .= "<span class='page-dots'>...</span>";
            }
        }
        
        for ($i = $start; $i <= $end; $i++) {
            $active = ($i === $currentPage) ? 'active' : '';
            $html .= "<a href='{$baseUrl}?page={$i}' class='page-num {$active}'>{$i}</a>";
        }
        
        if ($end < $totalPages) {
            if ($end < $totalPages - 1) {
                $html .= "<span class='page-dots'>...</span>";
            }
            $html .= "<a href='{$baseUrl}?page={$totalPages}' class='page-num'>{$totalPages}</a>";
        }
        
        // Next button
        if ($currentPage < $totalPages) {
            $nextPage = $currentPage + 1;
            $html .= "<a href='{$baseUrl}?page={$nextPage}' class='page-btn'>Next →</a>";
        }
        
        $html .= '</div>';
        return $html;
    }
    
    /**
     * Include layout with content
     */
    public static function layout($layoutName, $content, $data = []) {
        $data['content'] = $content;
        return self::render("layouts/{$layoutName}", $data);
    }
}