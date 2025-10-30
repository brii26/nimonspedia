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
                        </div>
                        <div class="card-body">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th class="text-center">Jumlah</th>
                                        <th class="text-end">Harga Satuan</th>
                                        <th class="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($cart['items'] as $item): ?>
                                        <tr>
                                            <td><?= htmlspecialchars($item['product_name'] ?? 'Nama Produk') ?></td>
                                            <td class="text-center"><?= (int)($item['quantity'] ?? 0) ?></td>
                                            <td class="text-end">Rp <?= number_format($item['product_price'] ?? 0, 0, ',', '.') ?></td>
                                            <td class="text-end fw-bold">Rp <?= number_format($item['subtotal'] ?? 0, 0, ',', '.') ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
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

                            <?php if (!$saldoCukup): ?>
                                <div class="alert alert-danger" role="alert">
                                    <strong>Saldo Tidak Cukup!</strong> Saldo Anda tidak mencukupi untuk melakukan transaksi ini.
                                </div>
                            <?php endif; ?>

                            <button type="submit" class="btn btn-primary btn-lg w-100" <?= !$saldoCukup ? 'disabled' : '' ?>>
                                Konfirmasi & Bayar
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </form>
    </div>

    </body>
</html>