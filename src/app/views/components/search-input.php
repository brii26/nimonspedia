<?php
/**
 * Search Input Component
 * Reusable search input with icon
 * 
 * Expected props:
 * - $id: string - Input ID (default: 'search-input')
 * - $name: string - Input name attribute (default: 'search')
 * - $value: string - Current search value (default: '')
 * - $placeholder: string - Placeholder text (default: 'Cari...')
 * - $label: string|null - Optional label text
 * - $showButton: bool - Show submit button (default: false, uses icon only)
 */

$id = $id ?? 'search-input';
$name = $name ?? 'search';
$value = $value ?? '';
$placeholder = $placeholder ?? 'Cari...';
$label = $label ?? null;
$showButton = $showButton ?? false;
?>

<?php if ($label): ?>
    <label for="<?= View::escape($id) ?>"><?= View::escape($label) ?></label>
<?php endif; ?>

<div class="search-input-wrapper">
    <input type="text" 
           id="<?= View::escape($id) ?>" 
           name="<?= View::escape($name) ?>" 
           value="<?= View::escape($value) ?>" 
           placeholder="<?= View::escape($placeholder) ?>"
           class="search-input">
    <?php if ($showButton): ?>
        <button type="submit" class="btn btn-search" aria-label="Cari">
            <svg xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                class="lucide lucide-search-icon lucide-search">
                <path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>
            </svg>
        </button>
    <?php else: ?>
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>
    <?php endif; ?>
</div>
