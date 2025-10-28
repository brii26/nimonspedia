<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Add New Product</title>
	<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
	<link href="/css/products.css" rel="stylesheet">
</head>
<body>
    <?php // View::render('partials/seller_navbar'); ?>

    <div class="container mt-4">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h3>Add New Product</h3>
                    </div>
                    <div class="card-body">
                        <?php if (isset($error)): ?>
                            <div class="alert alert-danger"><?= View::escape($error) ?></div>
                        <?php endif; ?>

                        <form action="/seller/products/store" method="POST" enctype="multipart/form-data">
                            <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">
                            
                            <div class="form-group mb-3">
                                <label for="product_name">Product Name</label>
                                <input type="text" id="product_name" name="product_name" class="form-control" value="<?= View::escape($old['product_name'] ?? '') ?>">
                                <?php if (isset($errors['product_name'])): ?>
                                    <small class="text-danger"><?= View::escape($errors['product_name']) ?></small>
                                <?php endif; ?>
                            </div>

                            <div class="form-group mb-3">
                                <label for="price">Price</label>
                                <input type="number" id="price" name="price" class="form-control" value="<?= View::escape($old['price'] ?? '') ?>">
                                <?php if (isset($errors['price'])): ?>
                                    <small class="text-danger"><?= View::escape($errors['price']) ?></small>
                                <?php endif; ?>
                            </div>

                            <div class="form-group mb-3">
                                <label for="stock">Stock</label>
                                <input type="number" id="stock" name="stock" class="form-control" value="<?= View::escape($old['stock'] ?? '') ?>">
                                <?php if (isset($errors['stock'])): ?>
                                    <small class="text-danger"><?= View::escape($errors['stock']) ?></small>
                                <?php endif; ?>
                            </div>

							<div class="form-group" style ="margin-bottom: 15px;">
								<label for="input_file">Input Logo:</label>
								<input type="file" id="input_file" name="product_image" accept="image/*">
							</div>

                            <div class="form-group mb-3">
                                <label for="description">Description</label>
								<div id="editor">
									<?= $old['description'] ?? '' ?>
								</div>
								<input type="hidden" name="description" id="description">
                            </div>

                            <button type="submit" class="btn btn-primary">Save Product</button>
                            <a href="/seller/products" class="btn btn-secondary">Cancel</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

	<script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
	<script src="/js/utils/quill-setup.js"></script>
	<script src="/js/pages/seller/products.js"></script>
</body>
</html>