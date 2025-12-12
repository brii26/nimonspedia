<?php

// CLI Script to Seed Database (Manual Implementation without FakerPHP)
// Usage: php src/scripts/seed_data.php

require_once __DIR__ . '/../core/Database.php';

// Increase limits for heavy seeding
ini_set('memory_limit', '1G');
set_time_limit(0);

echo "Starting Database Seeding (Corrected Schema)...\n";

$db = Database::getInstance();
$conn = $db->getConnection();

$password = password_hash('i23A567@', PASSWORD_DEFAULT);
$now = date('Y-m-d H:i:s');

// --- Helper Functions ---

function getRandomImage($dir) {
    $path = __DIR__ . '/../../storage/' . $dir;
    if (!is_dir($path)) return null;
    $files = array_values(array_diff(scandir($path), ['.', '..', '.gitkeep']));
    $images = array_filter($files, function($f) {
        return preg_match('/\.(jpg|jpeg|png|webp|svg)$/i', $f);
    });
    if (empty($images)) return null;
    return $dir . '/' . $images[array_rand($images)];
}

function generateName() {
    $firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jessica', 'William', 'Ashley', 'Budi', 'Siti', 'Agus', 'Dewi', 'Rina', 'Eko'];
    $lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Santoso', 'Pratama', 'Putri', 'Wijaya', 'Kusuma', 'Siregar', 'Hidayat'];
    return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
}

function generateStoreName() {
    $prefixes = ['Super', 'Mega', 'Ultra', 'Berkah', 'Jaya', 'Abadi', 'Sentosa', 'Makmur', 'Bintang', 'Sukses'];
    $suffixes = ['Store', 'Shop', 'Mart', 'Tech', 'Fashion', 'Elektronik', 'Official', 'Outlet', 'Center', 'Grosir'];
    return $prefixes[array_rand($prefixes)] . ' ' . $suffixes[array_rand($suffixes)] . ' ' . rand(1, 999);
}

function generateProductName($category) {
    $adjectives = ['Premium', 'High Quality', 'Original', 'New', 'Best', 'Cheap', 'Luxury', 'Authentic', 'Durable', 'Exclusive'];
    $nouns = [
        'Electronics' => ['Laptop', 'Smartphone', 'Headphone', 'Mouse', 'Keyboard', 'Monitor', 'Camera', 'Speaker', 'Tablet', 'Charger'],
        'Fashion' => ['T-Shirt', 'Shirt', 'Pants', 'Jacket', 'Shoes', 'Dress', 'Hat', 'Bag', 'Watch', 'Socks'],
        'Food & Beverages' => ['Snack', 'Coffee', 'Tea', 'Noodles', 'Chips', 'Chocolate', 'Cake', 'Biscuits', 'Candy', 'Juice'],
        'Books' => ['Novel', 'Textbook', 'Comic', 'Biography', 'Magazine', 'Guide', 'Encyclopedia', 'Dictionary'],
        'Sports & Outdoor' => ['Ball', 'Racket', 'Jersey', 'Shoes', 'Gloves', 'Mat', 'Dumbbell', 'Bike', 'Helmet'],
        'Health & Beauty' => ['Vitamin', 'Mask', 'Sanitizer', 'Thermometer', 'Supplement', 'Bandage', 'Medicine'],
        'Home & Garden' => ['Chair', 'Table', 'Lamp', 'Sofa', 'Bed', 'Cabinet', 'Curtain', 'Pillow', 'Vase'],
        'Toys & Games' => ['Doll', 'Car', 'Robot', 'Puzzle', 'Lego', 'Card', 'Board Game', 'Plushie'],
        'Automotive' => ['Helmet', 'Oil', 'Tire', 'Gloves', 'Jacket', 'Cover', 'Wiper', 'Battery']
    ];
    
    $nounList = $nouns[$category] ?? ['Item'];
    return $adjectives[array_rand($adjectives)] . ' ' . $nounList[array_rand($nounList)] . ' ' . rand(100, 999);
}

// --- Main Seeding Logic ---

try {
    $conn->beginTransaction();

    // 1. Create Buyers (2)
    echo "Creating Buyers...\n";
    $buyerIds = [];
    for ($i = 1; $i <= 2; $i++) {
        $email = "buyer{$i}@example.com";
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetchColumn();

        if ($existing) {
            $buyerIds[] = $existing;
        } else {
            $name = generateName();
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, address, created_at, updated_at) VALUES (?, ?, ?, 'BUYER', ?, ?, ?) RETURNING user_id");
            $stmt->execute([$name, $email, $password, "Jalan Buyer No $i", $now, $now]);
            $buyerIds[] = $stmt->fetchColumn();
        }
    }

    // 2. Create Sellers (5) & Stores (5)
    echo "Creating Sellers and Stores...\n";
    $sellerIds = [];
    $storeIds = []; // Map seller_id -> store_id
    
    $defaultStoreLogo = 'store_logos/default-store.svg';
    
    for ($i = 1; $i <= 5; $i++) {
        $email = "seller{$i}@example.com";
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existingUser = $stmt->fetchColumn();

        if ($existingUser) {
            $sellerId = $existingUser;
        } else {
            $name = generateName();
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, address, created_at, updated_at) VALUES (?, ?, ?, 'SELLER', ?, ?, ?) RETURNING user_id");
            $stmt->execute([$name, $email, $password, "Jalan Seller No $i", $now, $now]);
            $sellerId = $stmt->fetchColumn();
        }
        $sellerIds[] = $sellerId;

        // Create Store
        $stmt = $conn->prepare("SELECT store_id FROM stores WHERE user_id = ?");
        $stmt->execute([$sellerId]);
        $existingStore = $stmt->fetchColumn();

        if ($existingStore) {
            $storeIds[$sellerId] = $existingStore;
        } else {
            $storeName = generateStoreName();
            $logoPath = getRandomImage('store_logos') ?? $defaultStoreLogo;
            
            $stmt = $conn->prepare("INSERT INTO stores (user_id, store_name, store_description, store_logo_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING store_id");
            $stmt->execute([$sellerId, $storeName, "Official Store of Seller $i. We provide best products.", $logoPath, $now, $now]);
            $storeIds[$sellerId] = $stmt->fetchColumn();
        }
    }

    // 3. Ensure Categories
    echo "Ensuring Categories...\n";
    $categories = ['Electronics', 'Fashion', 'Food & Beverages', 'Books', 'Sports & Outdoor', 'Health & Beauty', 'Home & Garden', 'Toys & Games', 'Automotive'];
    $categoryIdMap = [];
    
    foreach ($categories as $cat) {
        $stmt = $conn->prepare("SELECT category_id FROM categories WHERE name = ?");
        $stmt->execute([$cat]);
        $existing = $stmt->fetchColumn();
        
        if ($existing) {
            $categoryIdMap[$cat] = $existing;
        } else {
            $stmt = $conn->prepare("INSERT INTO categories (name) VALUES (?) RETURNING category_id");
            $stmt->execute([$cat]);
            $categoryIdMap[$cat] = $stmt->fetchColumn();
        }
    }

    // 4. Create Products (10k total)
    echo "Creating 10,000 Products...\n";
    
    $productIds = []; 
    $batchSize = 500;
    $defaultProductImage = 'product_images/default-product.svg';
    
    // Simpan data produk lengkap untuk dipakai pas insert review (butuh store_id & price)
    // Format: product_id => ['store_id' => ..., 'price' => ...]
    $productDetails = [];

    foreach ($sellerIds as $index => $sellerId) {
        $storeId = $storeIds[$sellerId];
        echo "  > Store $storeId (Seller " . ($index + 1) . ")...\n";
        
        $productsBuffer = [];

        for ($p = 1; $p <= 2000; $p++) {
            $catName = $categories[array_rand($categories)];
            $name = generateProductName($catName);
            $desc = "This is a high quality $name. Condition is new. Limited stock available.";
            $price = rand(10000, 5000000); 
            $stock = rand(0, 100);
            $catId = $categoryIdMap[$catName];
            
            $imagePath = getRandomImage('product_images') ?? $defaultProductImage;
            
            $productsBuffer[] = [
                'name' => $name,
                'desc' => $desc,
                'price' => $price,
                'stock' => $stock,
                'store_id' => $storeId,
                'cat_id' => $catId,
                'image' => $imagePath
            ];

            if (count($productsBuffer) >= $batchSize) {
                $values = [];
                $params = [];
                foreach ($productsBuffer as $prod) {
                    $values[] = "(?, ?, ?, ?, ?, ?, to_tsvector(?), ?, ?)";
                    array_push($params, $prod['name'], $prod['desc'], $prod['price'], $prod['stock'], $prod['image'], $prod['store_id'], $prod['name'], $now, $now);
                }
                
                $sql = "INSERT INTO products (product_name, description, price, stock, main_image_path, store_id, search_vector, created_at, updated_at) VALUES " . implode(', ', $values) . " RETURNING product_id, store_id, price";
                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
                $newProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $catValues = [];
                $catParams = [];
                foreach ($newProducts as $k => $row) {
                    $pid = $row['product_id'];
                    $productIds[] = $pid;
                    // Cache details needed for orders/reviews
                    $productDetails[$pid] = ['store_id' => $row['store_id'], 'price' => $row['price']]; 
                    
                    $catValues[] = "(?, ?)";
                    array_push($catParams, $productsBuffer[$k]['cat_id'], $pid); // Note: category_items order is (cat_id, prod_id) or check schema
                }
                
                // Schema: category_items (category_id, product_id)
                $sqlCat = "INSERT INTO category_items (category_id, product_id) VALUES " . implode(', ', $catValues);
                $stmtCat = $conn->prepare($sqlCat);
                $stmtCat->execute($catParams);

                $productsBuffer = [];
            }
        }
    }
    echo "Total Products Created: " . count($productIds) . "\n";

    // 5. Create Reviews (Requires Orders)
    echo "Creating Orders & Reviews (Total 40k)...";
    
    $count = 0;
    
    // Kita tidak bisa batch insert Review dengan mudah karena setiap review butuh order_id yang unik per product
    // Jadi kita lakukan per loop, tapi pakai prepared statement reuse biar ga lambat banget.
    
    $stmtOrder = $conn->prepare("INSERT INTO orders (buyer_id, store_id, total_price, shipping_address, status, created_at) VALUES (?, ?, ?, 'Dummy Address', 'received', ?) RETURNING order_id");
    $stmtOrderItem = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_order, subtotal) VALUES (?, ?, 1, ?, ?)");
    $stmtReview = $conn->prepare("INSERT INTO reviews (order_id, user_id, product_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING review_id");
    $stmtResponse = $conn->prepare("INSERT INTO review_responses (review_id, responder_id, responder_role, response_text, created_at, updated_at) VALUES (?, ?, 'SELLER', ?, ?, ?)");

    // Cari seller owner dari store
    // Map store_id -> user_id (seller)
    $storeToSeller = [];
    foreach($storeIds as $sid => $stid) {
        $storeToSeller[$stid] = $sid;
    }

    $comments = ['Great product!', 'Satisfied.', 'Fast delivery.', 'Recommended.', 'Good quality.', 'Worth the price.', 'Ok.', 'Not bad.', 'Amazing!', 'Love it.'];
    $replies = ['Thank you!', 'Glad you like it.', 'Thanks for shopping.', 'We appreciate it.'];

    foreach ($productIds as $pid) {
        $details = $productDetails[$pid];
        $storeId = $details['store_id'];
        $price = $details['price'];
        
        for ($r = 1; $r <= 4; $r++) {
            $buyerId = $buyerIds[array_rand($buyerIds)];
            
            // 1. Create Dummy Order (Received)
            $stmtOrder->execute([$buyerId, $storeId, $price, $now]);
            $orderId = $stmtOrder->fetchColumn();
            
            // 2. Create Order Item
            $stmtOrderItem->execute([$orderId, $pid, $price, $price]);
            
            // 3. Create Review
            $rating = rand(3, 5);
            $comment = $comments[array_rand($comments)];
            $stmtReview->execute([$orderId, $buyerId, $pid, $rating, $comment, $now, $now]);
            $reviewId = $stmtReview->fetchColumn();
            
            // 4. Create Seller Reply (50% chance)
            if (rand(0, 1) === 1) {
                $sellerId = $storeToSeller[$storeId];
                $replyText = $replies[array_rand($replies)];
                $stmtResponse->execute([$reviewId, $sellerId, $replyText, $now, $now]);
            }
            
            $count++;
            if ($count % 1000 === 0) echo "Processed $count reviews...\n";
        }
    }

    $conn->commit();
    echo "Seeding Completed Successfully!\n";

} catch (Exception $e) {
    $conn->rollBack();
    echo "Seeding Failed: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}