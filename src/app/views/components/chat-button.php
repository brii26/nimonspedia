<?php
/**
 * Chat Button Component
 * 
 * Menampilkan tombol untuk memulai chat dengan penjual
 * Redirect ke halaman chat React dengan query parameter untuk inisiasi chat
 * 
 * Required props:
 * - $storeId: ID toko untuk chat
 * - $storeName: Nama toko (opsional, untuk accessibility)
 * 
 * Optional props:
 * - $variant: 'primary' | 'secondary' | 'outline' (default: 'primary')
 * - $size: 'sm' | 'md' | 'lg' (default: 'md')
 * - $fullWidth: boolean (default: false)
 * - $className: additional CSS classes
 */

$storeId = $storeId ?? null;
$storeName = $storeName ?? 'Seller';
$variant = $variant ?? 'primary';
$size = $size ?? 'md';
$fullWidth = $fullWidth ?? false;
$className = $className ?? '';

// Validasi storeId
if (!$storeId) {
    return; // Jangan render jika tidak ada storeId
}

// Build chat URL dengan query parameter untuk inisiasi
// Format sesuai React Router: /chat?init_store_id={id}
$chatUrl = "/chat?init_store_id=" . urlencode($storeId);

// Build button classes
$btnClasses = ['btn', 'btn-chat'];
$btnClasses[] = 'btn-' . $variant;
$btnClasses[] = 'btn-' . $size;
if ($fullWidth) $btnClasses[] = 'btn-full-width';
if ($className) $btnClasses[] = $className;

$btnClass = implode(' ', $btnClasses);
?>

<a href="<?= View::escape($chatUrl) ?>" 
   class="<?= $btnClass ?>" 
   aria-label="Chat dengan <?= View::escape($storeName) ?>"
   title="Chat dengan <?= View::escape($storeName) ?>">
    <svg xmlns="http://www.w3.org/2000/svg" 
         width="18" 
         height="18" 
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="currentColor" 
         stroke-width="2" 
         stroke-linecap="round" 
         stroke-linejoin="round" 
         class="chat-icon">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span>Chat Seller</span>
</a>

<style>
/* Chat Button Styles */
.btn-chat {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    cursor: pointer;
}

.btn-chat:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-chat:active {
    transform: translateY(0);
}

/* Sizes */
.btn-chat.btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
}

.btn-chat.btn-md {
    padding: 0.6rem 1.2rem;
    font-size: 0.938rem;
}

.btn-chat.btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
}

/* Variants */
.btn-chat.btn-primary {
    background-color: #10b981;
    color: white;
    border-color: #10b981;
}

.btn-chat.btn-primary:hover {
    background-color: #059669;
    border-color: #059669;
}

.btn-chat.btn-secondary {
    background-color: #6b7280;
    color: white;
    border-color: #6b7280;
}

.btn-chat.btn-secondary:hover {
    background-color: #4b5563;
    border-color: #4b5563;
}

.btn-chat.btn-outline {
    background-color: transparent;
    color: #10b981;
    border-color: #10b981;
}

.btn-chat.btn-outline:hover {
    background-color: #f0fdf4;
    color: #059669;
    border-color: #059669;
}

/* Full width */
.btn-chat.btn-full-width {
    width: 100%;
    justify-content: center;
}

/* Icon */
.btn-chat .chat-icon {
    flex-shrink: 0;
}

/* Responsive */
@media (max-width: 640px) {
    .btn-chat span {
        display: none;
    }
    
    .btn-chat {
        padding: 0.6rem;
    }
    
    .btn-chat .chat-icon {
        width: 20px;
        height: 20px;
    }
}
</style>
