<?php
// Ambil data yang sudah dikirim dari controller
$cart = $cart ?? ['items' => [], 'total' => 0];
$user = $user ?? [];
$csrf_token = $csrf_token ?? '';

// Hitung kecukupan saldo
$totalBelanja = $cart['total'];
$saldoUser = $user['balance'] ?? 0;
$saldoCukup = $saldoUser >= $totalBelanja;
$sisaSaldo = $saldoUser - $totalBelanja;
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - Nimonspedia</title>
    </head>
<body>
    <?php
        // (Anda mungkin ingin me-render navbar di sini)
        // View::render('partials/navbar'); 
    ?>

    <div class="container my-5">
        <h1 class="mb-4">Checkout</h1>

        <form action="/checkout" method="POST" id="checkoutForm">
            
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

            <div class="row">
                
                <div class="col-lg-7">
                    
                    <div class="card shadow-sm mb-4">
                        <div class="card-header">
                            <h4 class="mb-0">Ringkasan Pesanan</h4>
                            <small class="text-muted">Tergrup per toko</small>
                        </div>
                        <div class="card-body">
                            <?php
                                $groups = [];
                                foreach ($cart['items'] as $it) {
                                    $sid = $it['store_id'] ?? 0;
                                    $groups[$sid]['store_name'] = $it['store_name'] ?? 'Unknown Store';
                                    $groups[$sid]['items'][] = $it;
                                }
                                $grandTotal = 0;
                            ?>

                            <?php if (empty($groups)): ?>
                                <p class="text-muted">Keranjang Anda kosong.</p>
                            <?php endif; ?>

                            <?php foreach ($groups as $storeId => $g): ?>
                                <?php $storeTotal = 0; ?>
                                <div class="mb-3">
                                    <h5 class="mb-2">Toko: <?= htmlspecialchars($g['store_name']) ?></h5>
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Produk</th>
                                                <th class="text-center">Jumlah</th>
                                                <th class="text-end">Harga Satuan</th>
                                                <th class="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($g['items'] as $item): ?>
                                                <?php $storeTotal += ($item['subtotal'] ?? (($item['product_price'] ?? 0) * ($item['quantity'] ?? 0))); ?>
                                                <tr>
                                                    <td><?= htmlspecialchars($item['product_name'] ?? 'Nama Produk') ?></td>
                                                    <td class="text-center"><?= (int)($item['quantity'] ?? 0) ?></td>
                                                    <td class="text-end">Rp <?= number_format($item['product_price'] ?? 0, 0, ',', '.') ?></td>
                                                    <td class="text-end fw-bold">Rp <?= number_format($item['subtotal'] ?? (($item['product_price'] ?? 0) * ($item['quantity'] ?? 0)), 0, ',', '.') ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colspan="3" class="text-end"><strong>Total Toko:</strong></td>
                                                <td class="text-end"><strong>Rp <?= number_format($storeTotal, 0, ',', '.') ?></strong></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <?php $grandTotal += $storeTotal; ?>
                            <?php endforeach; ?>

                            <div class="text-end mt-3">
                                <h5>Grand Total: <strong>Rp <?= number_format($grandTotal, 0, ',', '.') ?></strong></h5>
                            </div>
                        </div>
                    </div>

                    <div class="card shadow-sm">
                        <div class="card-header">
                            <h4 class="mb-0">Alamat Pengiriman</h4>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title"><?= htmlspecialchars($user['name'] ?? 'Nama Buyer') ?></h5>
                            <p class="card-text">
                                <?= nl2br(htmlspecialchars($user['address'] ?? 'Alamat belum diatur.')) ?>
                            </p>
                        </div>
                    </div>

                </div>

                <div class="col-lg-5">
                    <div class="card shadow-sm position-sticky" style="top: 20px;">
                        <div class="card-header">
                            <h4 class="mb-0">Konfirmasi Pembayaran</h4>
                        </div>
                        <div class="card-body">
                            
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Saldo Anda</span>
                                    <strong class="text-success">Rp <?= number_format($saldoUser, 0, ',', '.') ?></strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Total Belanja</span>
                                    <strong class="text-danger">- Rp <?= number_format($totalBelanja, 0, ',', '.') ?></strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Sisa Saldo</span>
                                    <strong class="<?= $saldoCukup ? 'text-dark' : 'text-danger' ?>">
                                        Rp <?= number_format($sisaSaldo, 0, ',', '.') ?>
                                    </strong>
                                </li>
                            </ul>

                            <hr>

                            <div class="mb-3">
                                <label for="shipping_address" class="form-label">Alamat Pengiriman (editable)</label>
                                <textarea id="shipping_address" name="shipping_address" class="form-control" rows="4"><?= htmlspecialchars($user['address'] ?? '') ?></textarea>
                            </div>

                            <?php if (!$saldoCukup): ?>
                                <div class="alert alert-danger" role="alert">
                                    <strong>Saldo Tidak Cukup!</strong> Saldo Anda tidak mencukupi untuk melakukan transaksi ini.
                                </div>
                            <?php endif; ?>

                            <button type="button" id="checkoutBtn" class="btn btn-primary btn-lg w-100" <?= !$saldoCukup ? 'disabled' : '' ?>>
                                Konfirmasi & Bayar
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </form>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const checkoutForm = document.getElementById('checkoutForm');

        function resetButton(btn, original) {
            if (window.App && typeof window.App.hideLoading === 'function') {
                window.App.hideLoading(btn);
            } else if (btn) {
                btn.disabled = false;
                btn.textContent = original || 'Konfirmasi & Bayar';
            }
        }

        if (!checkoutBtn || !checkoutForm) return;

        checkoutBtn.addEventListener('click', function (e) {
            const originalText = checkoutBtn.textContent;
            if (checkoutBtn.disabled) return;
            // show loading
            if (window.App && typeof window.App.showLoading === 'function') {
                window.App.showLoading(checkoutBtn, 'Processing...');
            } else {
                checkoutBtn.disabled = true;
                checkoutBtn.textContent = 'Processing...';
            }

            const formData = new FormData(checkoutForm);

            // Use project's fetchXhr helper (no native fetch)
            if (typeof fetchXhr !== 'function') {
                // fallback to normal submit
                checkoutForm.submit();
                return;
            }

            fetchXhr('/checkout', { method: 'POST', body: formData, timeout: 15000 })
            .then(response => {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    return response.json().then(data => ({ json: data, url: response.url }));
                }
                return { json: null, url: response.url };
            }).then(result => {
                if (result.json) {
                    if (result.json.redirect) {
                        window.location = result.json.redirect;
                        return;
                    }
                    if (result.json.success) {
                        window.location = '/orders';
                        return;
                    }
                    if (result.json.errors && Array.isArray(result.json.errors) && result.json.errors.length) {
                        if (window.App && typeof window.App.showAlert === 'function') {
                            window.App.showAlert(result.json.errors[0], 'error');
                        } else {
                            alert(result.json.errors[0]);
                        }
                        resetButton(checkoutBtn, originalText);
                        return;
                    }
                }

                if (result.url) {
                    window.location = result.url;
                } else {
                    window.location.reload();
                }
            }).catch(err => {
                console.error('Checkout error', err);
                if (window.App && typeof window.App.showAlert === 'function') {
                    window.App.showAlert('Terjadi kesalahan saat melakukan checkout. Silakan coba lagi.', 'error');
                } else {
                    alert('Terjadi kesalahan saat melakukan checkout. Silakan coba lagi.');
                }
                resetButton(checkoutBtn, originalText);
            });
        });
    });
    </script>

    </body>
</html>