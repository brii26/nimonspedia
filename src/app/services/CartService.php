<?php

class CartService {
	/** @var ProductRepository */
	private $productRepository;

	/** @var CartItemRepository */
	private $cartItemRepository;

	public function __construct(ProductRepository $productRepo, CartItemRepository $cartItemRepo) {
        $this->productRepository = $productRepo;
        $this->cartItemRepository = $cartItemRepo;
    }

	/**
	 * Add product to cart.
	 * - If buyer is logged in, persist in DB (cart_items) so cart is accessible across devices.
	 * - For guests, store cart in session.
	 * If same product exists, quantity will be increased automatically.
	 *
	 * @param int $productId
	 * @param int $quantity
	 * @return int Unique items count (badge count)
	 * @throws Exception
	 */
	public function addToCart(int $productId, int $quantity = 1) {
        if ($quantity <= 0) {
            throw new ValidationException('Kuantitas harus lebih dari nol');
        }

        $product = $this->productRepository->findByIdWithDetails($productId);
        if (!$product) {
            throw new ValidationException('Produk tidak ditemukan');
        }

        $available = isset($product['stock']) ? (int)$product['stock'] : PHP_INT_MAX;
        if ($available <= 0) {
            throw new ValidationException('Produk habis');
        }

        if (Auth::isBuyer()) {
            $buyerId = Auth::id();
            $this->mergeSessionToPersistent($buyerId);

            // --- INI PERBAIKANNYA ---
            // 1. Cek kuantitas yang sudah ada di keranjang
            $existingItem = $this->cartItemRepository->whereFirst('buyer_id = ? AND product_id = ?', [$buyerId, $productId]);
            $existingQty = $existingItem ? (int)$existingItem['quantity'] : 0;
            
            // 2. Hitung total baru
            $newTotalQty = $existingQty + $quantity;

            // 3. Bandingkan dengan stok
            if ($newTotalQty > $available) {
                // Lempar error jika stok tidak cukup
                throw new ValidationException(['stock' => "Stok tidak mencukupi. Sisa stok: {$available}"]);
            }
            // --- AKHIR PERBAIKAN ---

            // 4. Jika lolos, baru tambahkan ke repo
            $this->cartItemRepository->addOrUpdate($buyerId, $productId, $quantity);
            return $this->cartItemRepository->countByBuyer($buyerId);
        }

        // (Logika untuk Guest)
        if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
            $_SESSION['cart'] = [];
        }

        $existingQty = isset($_SESSION['cart'][$productId]) ? (int)$_SESSION['cart'][$productId]['quantity'] : 0;
        $newQty = $existingQty + $quantity;
        
        // Perbaiki pengecekan stok untuk guest juga
        if ($newQty > $available) {
            $newQty = $available; // Cap di jumlah stok
        }

        $_SESSION['cart'][$productId] = [
            'product_id' => $productId,
            'quantity' => $newQty,
            'product_name' => $product['product_name'] ?? ($product['name'] ?? ''),
            'product_price' => $product['price'] ?? 0
        ];

        return count($_SESSION['cart']);
    }

	/**
	 * Merge session cart into persistent DB cart for buyer.
	 * Called when a buyer performs an action so their guest cart is not lost.
	 */
	private function mergeSessionToPersistent(int $buyerId) {
		if (empty($_SESSION['cart']) || !is_array($_SESSION['cart'])) return;

		foreach ($_SESSION['cart'] as $prodId => $it) {
			$qty = (int)$it['quantity'];
			if ($qty <= 0) continue;
			$product = $this->productRepository->findByIdWithDetails((INT)$prodId);
			if (!$product) continue;
			$available = isset($product['stock']) ? (int)$product['stock'] : PHP_INT_MAX;
			$toAdd = min($qty, $available);
			if ($toAdd > 0) {
				$this->cartItemRepository->addOrUpdate($buyerId, (int)$prodId, $toAdd);
			}
		}

		unset($_SESSION['cart']);
	}

	/**
	 * Get cart contents and total price.
	 * Returns array: ['items' => [...], 'total' => int]
	 */
	public function getCart(): array {
		$items = [];
		$total = 0;

		if (Auth::isBuyer()) {
			$buyerId = Auth::id();
			$this->mergeSessionToPersistent($buyerId);
			$rows = $this->cartItemRepository->findByBuyerId($buyerId);
			foreach ($rows as $r) {
				$price = isset($r['product_price']) ? (int)$r['product_price'] : (isset($r['price']) ? (int)$r['price'] : 0);
				$qty = (int)$r['quantity'];
				$subtotal = $price * $qty;
				$items[] = [
					'cart_item_id' => $r['cart_item_id'],
					'product_id' => $r['product_id'],
					'product_name' => $r['product_name'],
					'product_price' => $price,
					'product_stock' => $r['product_stock'] ?? null,
					'quantity' => $qty,
					'subtotal' => $subtotal,
					'store_id' => $r['store_id'] ?? null,
					'store_name' => $r['store_name'] ?? 'Unknown Store'
				];
				$total += $subtotal;
			}
			return ['items' => $items, 'total' => $total];
		}

		if (empty($_SESSION['cart']) || !is_array($_SESSION['cart'])) return ['items' => [], 'total' => 0];

		foreach ($_SESSION['cart'] as $prodId => $it) {
			$price = isset($it['product_price']) ? (int)$it['product_price'] : 0;
			$qty = (int)$it['quantity'];
			$subtotal = $price * $qty;
			$items[] = [
				'product_id' => (int)$prodId,
				'product_name' => $it['product_name'] ?? '',
				'product_price' => $price,
				'quantity' => $qty,
				'subtotal' => $subtotal
			];
			$total += $subtotal;
		}

		return ['items' => $items, 'total' => $total];
	}

	/**
	 * Update quantity for a product in cart.
	 * If quantity is 0, the item will be removed.
	 */
	public function updateQuantity(int $productId, int $quantity) {
		if ($quantity < 0) throw new Exception('Quantity must be non-negative');

		$product = $this->productRepository->findByIdWithDetails($productId);
		if (!$product) throw new Exception('Product not found');

		$available = isset($product['stock']) ? (int)$product['stock'] : PHP_INT_MAX;
		$quantity = min($quantity, $available);

		if (Auth::isBuyer()) {
			$buyerId = Auth::id();
			$rows = $this->cartItemRepository->findByBuyerId($buyerId);
			foreach ($rows as $r) {
				if ((int)$r['product_id'] === $productId) {
					if ($quantity === 0) return $this->cartItemRepository->delete($r['cart_item_id']);
					return $this->cartItemRepository->updateQuantity($r['cart_item_id'], $quantity);
				}
			}
			if ($quantity > 0) {
				$this->cartItemRepository->addOrUpdate($buyerId, $productId, $quantity);
				return true;
			}
			return false;
		}

		if (!isset($_SESSION['cart'])) return false;
		if ($quantity === 0) {
			unset($_SESSION['cart'][$productId]);
			return true;
		}
		if (isset($_SESSION['cart'][$productId])) {
			$_SESSION['cart'][$productId]['quantity'] = $quantity;
			return true;
		}
		$_SESSION['cart'][$productId] = [
			'product_id' => $productId,
			'quantity' => $quantity,
			'product_name' => $product['product_name'] ?? ($product['name'] ?? ''),
			'product_price' => $product['price'] ?? 0
		];
		return true;
	}

	/**
	 * Remove an item from cart.
	 */
	public function removeItem(int $productId) {
		if (Auth::isBuyer()) {
			$buyerId = Auth::id();
			$rows = $this->cartItemRepository->findByBuyerId($buyerId);
			foreach ($rows as $r) {
				if ((int)$r['product_id'] === $productId) {
					return $this->cartItemRepository->delete($r['cart_item_id']);
				}
			}
			return false;
		}
		if (isset($_SESSION['cart'][$productId])) {
			unset($_SESSION['cart'][$productId]);
			return true;
		}
		return false;
	}

	/**
	 * Clear entire cart for current user/guest.
	 */
	public function clearCart() {
		if (Auth::isBuyer()) {
			return $this->cartItemRepository->clearByBuyer(Auth::id());
		}
		unset($_SESSION['cart']);
		return true;
	}

	/**
	 * Get unique items count for navbar badge.
	 */
	public function getUniqueCount(): int {
		if (Auth::isBuyer()) {
			return $this->cartItemRepository->countByBuyer(Auth::id());
		}
		if (empty($_SESSION['cart']) || !is_array($_SESSION['cart'])) return 0;
		return count($_SESSION['cart']);
	}

	/**
	 * Get total units count (sum of quantities) if needed.
	 */
	public function getTotalUnitsCount(): int {
		if (Auth::isBuyer()) {
			return $this->cartItemRepository->sumQuantityByBuyer(Auth::id());
		}
		$sum = 0;
		if (!empty($_SESSION['cart']) && is_array($_SESSION['cart'])) {
			foreach ($_SESSION['cart'] as $it) $sum += (int)$it['quantity'];
		}
		return $sum;
	}
}
