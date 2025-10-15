<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Seller Orders - Nimonspedia</title>
</head>
<body>
	<div class="container mt-4">
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h3>Orders</h3>
			<a href="/dashboard" class="btn btn-secondary btn-sm">Back to Dashboard</a>
		</div>

		<?php if (empty($orders)): ?>
			<div class="alert alert-info">No orders yet.</div>
		<?php else: ?>
			<table class="table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Total</th>
						<th>Status</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ($orders as $o): ?>
						<tr>
							<td><?= View::escape($o['order_id']) ?></td>
							<td><?= View::currency($o['total_price']) ?></td>
							<td><?= View::escape($o['status']) ?></td>
							<td><?= View::escape($o['created_at']) ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php endif; ?>
	</div>
</body>
</html>


