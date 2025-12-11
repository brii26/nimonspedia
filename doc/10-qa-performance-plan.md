# QA & Performance Engineering Plan: Product Image Optimization

**Date:** 2025-12-10
**Status:** Implemented
**Objective:** Optimize product list loading performance to meet Google Lighthouse standards (>80 Performance Score) for high-traffic pages.

## 1. Problem Statement
The product listing page (`/products` or Search/Filter results) previously loaded full-resolution images (up to 1920x1080) for every item in the grid. 
*   **Impact:** Massive payload size (e.g., 20 products * 500KB = 10MB), causing slow LCP (Largest Contentful Paint) and high TBT (Total Blocking Time).
*   **Risk:** Failing load tests and poor user experience on mobile networks.

## 2. Solution Architecture
We implemented a **Server-Side Preview Generation** strategy with **Client-Side Fallback**.

### A. Backend (PHP)
*   **Service Update (`FileService.php`):** Enabled `generatePreview` for `product_image` type.
    *   **Config:** Max Width/Height: 300px.
    *   **Quality:** 80%.
    *   **Naming:** `${filename}_preview.${ext}`.
*   **Migration Script (`src/scripts/generate_product_previews.php`):** A CLI utility to batch-process existing images in `storage/product_images` and generate missing previews.

### B. Frontend (PHP View)
*   **Component:** `src/app/views/components/product-list.php`
*   **Logic:** 
    1.  Construct the expected preview path (e.g., `image_preview.jpg`) from the main image path.
    2.  Set `src` to the preview path.
    3.  Add `loading="lazy"` attribute to defer off-screen images.
    4.  Add `onerror` handler: `this.src='original_path'` to seamlessly fallback if the preview is missing (404).

## 3. Implementation Details

### File Service Configuration
```php
'product_image' => [
    'maxWidth' => 1920,
    'maxHeight' => 1080,
    'quality' => 80,
    'generatePreview' => true, // ENABLED
    'previewWidth' => 300,
    'previewHeight' => 300,
],
```

### Frontend Rendering Logic
```html
<img src="/storage/path/to/image_preview.jpg" 
     loading="lazy"
     onerror="this.onerror=null;this.src='/storage/path/to/image.jpg';">
```

## 4. QA Verification Steps

### Functional Testing
1.  **Upload New Product:** Create a product with a high-res image.
    *   **Verify:** Check `storage/product_images` to ensure both original and `_preview` files are created.
2.  **View Product List:** Go to `/products`.
    *   **Verify:** Inspect the image element. `src` should point to `..._preview.ext`.
    *   **Verify:** Network tab should show a 200 OK for the preview image.
3.  **Fallback Test:** Manually delete a `_preview` file from storage.
    *   **Verify:** Reload the page. The image should still load (fallback to original). Network tab will show 404 for preview, followed by 200 for original.

### Load Testing (Performance)
*   **Scenario:** 100 concurrent users browsing page 1 of products.
*   **Expected Result:** 
    *   **Bandwidth:** Reduced by ~80-90% (300px vs 1920px).
    *   **LCP:** Significantly faster.
    *   **Server Load:** Negligible increase (static file serving is cheap).

## 5. Deployment Instructions
1.  Deploy the code changes.
2.  **CRITICAL:** Run the migration script to generate previews for existing data:
    ```bash
    # Inside the PHP container
    php src/scripts/generate_product_previews.php
    ```
