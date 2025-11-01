<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>Your Products</h3>
        <a href="/seller/products/create" class="btn btn-success">Add New Product</a>
    </div>
    
    <div class="card">
        <div class="card-body">
            <table class="table">
                <thead>
                    <tr>
                        <th>Pict</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($productsData['data'] as $product): ?>
                        <tr>
							<td>
								<?php
									$productPath = $product['main_image_path'] ?? null;
									if ($productPath) {
										$imageUrl = '/storage/' . View::escape($productPath);
									} else {
										$imageUrl = '/storage/' .'product_images/default-product.png'; 
									}
								?>
								<img src="<?= $imageUrl ?>" alt="<?= View::escape($product['product_name']) ?> Image"  class="product-thumb">
							</td>
                            <td><?= View::escape($product['product_name']) ?></td>
                            <td><?= View::currency($product['price']) ?></td>
                            <td><?= View::escape($product['stock']) ?></td>
                            <td>
                                <a href="/seller/products/edit?id=<?= $product['product_id'] ?>" class="btn btn-sm btn-warning">Edit</a>
                                <form action="/seller/products/delete" method="POST" style="display:inline;">
                                    <input type="hidden" name="product_id" value="<?= $product['product_id'] ?>">
                                    <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                                    <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <button type="button" class="btn go-back">Back</button>
        </div>
    </div>
</div>