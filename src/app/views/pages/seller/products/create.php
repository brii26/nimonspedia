<div class="container mt-4">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card product-form-card">
                <div class="card-header">
                    <h3>Add New Product</h3>
                </div>
                <div class="card-body">
                    <?php if (isset($error)): ?>
                        <div class="alert alert-danger"><?= View::escape($error) ?></div>
                    <?php endif; ?>

                    <form action="/seller/products/store" method="POST" enctype="multipart/form-data">
                        <input type="hidden" name="csrf_token" value="<?= View::csrf() ?>">

                        <div class="row">
                            
                            <div class="col-md-7"> 
                                
                                <div class="row mb-3 align-items-center">
                                    <label for="product_name" class="col-md-3 col-form-label">Product Name</label>
                                    <div class="col-md-9">
                                        <input type="text" id="product_name" name="product_name" class="form-control" value="<?= View::escape($old['product_name'] ?? '') ?>" required maxlength="200">
                                        <?php if (isset($errors['product_name'])): ?>
                                            <small class="text-danger"><?= View::escape($errors['product_name']) ?></small>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <div class="row mb-3 align-items-center">
                                    <label for="price" class="col-md-3 col-form-label">Price</label>
                                    <div class="col-md-9">
                                        <input type="number" id="price" name="price" class="form-control" value="<?= View::escape($old['price'] ?? '') ?>" required min="1000">
                                        <?php if (isset($errors['price'])): ?>
                                            <small class="text-danger"><?= View::escape($errors['price']) ?></small>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <div class="row mb-3 align-items-center">
                                    <label for="stock" class="col-md-3 col-form-label">Stock</label>
                                    <div class="col-md-9">
                                        <input type="number" id="stock" name="stock" class="form-control" value="<?= View::escape($old['stock'] ?? '') ?>" required min="0">
                                        <?php if (isset($errors['stock'])): ?>
                                            <small class="text-danger"><?= View::escape($errors['stock']) ?></small>
                                        <?php endif; ?>
                                    </div>
                                </div>

								<div class="row mb-3 align-items-center">
									<label for="category_id" class="col-md-3 col-form-label">Category</label>
									<div class="col-md-9">
										<select id="category_id" name="category_ids[]" class="form-select" required multiple>
											<?php
											$selectedValues = $old['category_ids'] ?? [];
											foreach ($categories as $cat):
											?>
												<option value="<?= View::escape($cat['category_id']) ?>"
													<?= in_array($cat['category_id'], $selectedValues) ? 'selected' : '' ?>>
													<?= View::escape($cat['name']) ?>
												</option>
											<?php endforeach; ?>
										</select>
									</div>
								</div>

								<div class="row mb-3 align-items-center">
								<label for="input_file" class="col-md-3 col-form-label">Product Image</label>
									<div class="col-md-9">
										<input type="file" id="input_file" name="product_image" class="form-control" accept="image/*">
										<?php if (isset($errors['product_image'])): ?>
											<small class="text-danger"><?= View::escape($errors['product_image']) ?></small>
										<?php endif; ?>
										<small id="image-error" class="text-danger"></small>
									</div>
								</div>
                                
                            </div>

                            <div class="col-md-5">
                                <div class="mb-3" id="preview-wrapper">
                                    <img id="image-preview" src="#" alt="Image preview">
                                </div>
                            </div>

						</div>
                            

						<div class="mb-4">
							<label for="product-description" class="col-form-label">Description</label>
							<div id="editor"><?= $old['product-description'] ?? '' ?></div>
							<input type="hidden" name="product-description" id="product-description">
							<?php if (isset($errors['description_plain_text'])): ?>
								<small class="text-danger"><?= View::escape($errors['description_plain_text']) ?></small>
							<?php endif; ?>
							<small id="description-error" class="text-danger"></small>
						</div>

                        <div class="btn-container d-flex justify-content-end">
                            <a href="/seller/products" class="btn btn-secondary">Cancel</a>
                            <button type="submit" class="btn btn-primary">Save Product</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    </div>
</div>