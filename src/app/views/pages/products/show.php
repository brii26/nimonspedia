<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= View::escape($product['product_name']) ?> - Nimonspedia</title>
</head>
<body>
    <?php // View::render('partials/navbar'); ?>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h3><?= View::escape($product['product_name']) ?></h3>
                    </div>
                    <div class="card-body">
                        <h4 class="card-title text-primary"><?= View::currency($product['price']) ?></h4>
                        <p><strong>Store:</strong> <?= View::escape($product['store_name']) ?></p>
                        <p><strong>Categories:</strong> <?= View::escape($product['categories']) ?></p>
                        <hr>
                        <h5>Description</h5>
                        <p><?= nl2br(View::escape($product['description'])) ?></p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <p><strong>Stock:</strong> <?= View::escape($product['stock']) ?></p>
                        <hr>
                            <form id="addToCartForm" class="add-to-cart-form">
                                <input type="hidden" name="product_id" value="<?= View::escape($product['product_id']) ?>">
                                <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                <div class="form-group mb-2">
                                    <label for="quantity">Quantity</label>
                                    <input type="number" name="quantity" class="form-control" value="1" min="1" 
                                        max="<?= View::escape($product['stock']) ?>" 
                                        <?= ($product['stock'] <= 0) ? 'disabled' : '' ?>>
                                </div>
                                <button type="submit" class="btn btn-primary w-100" <?= ($product['stock'] <= 0) ? 'disabled' : '' ?>>
                                    <?= ($product['stock'] > 0) ? 'Add to Cart' : 'Out of Stock' ?>
                                </button>
                            </form>

                            <script>
                            document.getElementById('addToCartForm').addEventListener('submit', async function(e) {
                                e.preventDefault();
                                const form = this;
                                const button = form.querySelector('button[type="submit"]');
                                const originalText = button.textContent;
                            
                                try {
                                    button.disabled = true;
                                    button.textContent = 'Adding...';

                                    const response = await fetch('/cart/add', {
                                        method: 'POST',
                                        credentials: 'same-origin',
                                        headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                        },
                                        body: new URLSearchParams(new FormData(form))
                                    });

                                    const result = await response.json();

                                    if (!response.ok) {
                                        throw new Error(result.error || 'Failed to add to cart');
                                    }

                                    // Update cart badge if it exists
                                    const badge = document.querySelector('.cart-badge');
                                    if (badge && result.data?.uniqueCount) {
                                        badge.textContent = result.data.uniqueCount;
                                        badge.style.display = 'flex';
                                    }

                                    // Show success message
                                    alert('Item added to cart successfully!');
                                
                                } catch (error) {
                                    console.error('Error:', error);
                                    alert(error.message || 'Failed to add item to cart');
                                } finally {
                                    button.disabled = false;
                                    button.textContent = originalText;
                                }
                            });
                            </script>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>