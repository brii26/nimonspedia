<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Products - Nimonspedia</title>
</head>
<body>
    <?php // View::render('partials/seller_navbar'); ?>

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
							<th>Path</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($productsData['data'] as $product): ?>
                            <tr>
								<td><strong><?= View::escape($product['main_image_path']) ?></strong></td>
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
				<button type="button" class="btn go-back" onclick="window.location.href='/dashboard'">Back</button>
            </div>
        </div>
    </div>
</body>
</html>