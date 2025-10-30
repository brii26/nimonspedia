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
                            document.addEventListener('DOMContentLoaded', function() {
                                document.getElementById('addToCartForm').addEventListener('submit', function(e) {
                                    e.preventDefault();
                                    const form = this;
                                    const button = form.querySelector('button[type="submit"]');
                                    const originalText = button.textContent;
                                    
                                    button.disabled = true;
                                    button.textContent = 'Adding...';

                                    const xhr = new XMLHttpRequest();
                                    xhr.open('POST', '/cart/add', true);
                                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                                    
                                    xhr.onload = function() {
                                        if (xhr.status === 200) {
                                            const result = JSON.parse(xhr.responseText);
                                            const badge = document.querySelector('.cart-badge');
                                            if (badge && result.data?.uniqueCount) {
                                                badge.textContent = result.data.uniqueCount;
                                                badge.style.display = 'flex';
                                            }
                                            alert('Item added to cart successfully!');
                                        } else {
                                            const result = JSON.parse(xhr.responseText);
                                            alert(result.error || 'Failed to add item to cart');
                                        }
                                        button.disabled = false;
                                        button.textContent = originalText;
                                    };
                                    
                                    xhr.onerror = function() {
                                        console.error('Error adding to cart');
                                        alert('Failed to add item to cart');
                                        button.disabled = false;
                                        button.textContent = originalText;
                                    };
                                    
                                    xhr.send(new URLSearchParams(new FormData(form)));
                                });
                            });
                            </script>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>