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
                </div>
            </div>
        </div>
    </div>
</div>