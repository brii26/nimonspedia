document.addEventListener('DOMContentLoaded', function () {
    const backButton = document.querySelector('.go-back');
    if (backButton) {
        backButton.addEventListener('click', function () {
            window.location.href = '/';
        });
    }

    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'product_created') {
        App.showAlert('Product created successfully!', 'success');
    } else if (status === 'product_updated') {
        App.showAlert('Product updated successfully!', 'success');
    } else if (status === 'product_deleted') {
        App.showAlert('Product deleted successfully!', 'success');
    }

    if (status) {
        params.delete('status');
        const newUrl =
            window.location.pathname +
            (params.toString() ? '?' + params.toString() : '') +
            window.location.hash;
        history.replaceState(null, '', newUrl);
    }

    let lastSubmitter = null;

    document.addEventListener('click', function (e) {
        const btn = document.getElementById('delete-button');
        if (btn) lastSubmitter = btn;
    });

    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!form.matches('form[action^="/seller/products/delete"]')) return;

        e.preventDefault();

        const btn = document.getElementById('delete-button');

        const cleanup = () => {
            document.removeEventListener('confirm:ok', onOk);
            document.removeEventListener('confirm:cancel', onCancel);
        };

        const onOk = () => {
            if (btn) App.showLoading(btn, 'Deleting...');
            cleanup();
            form.submit();
        };

        const onCancel = () => {
            if (btn) App.hideLoading(btn);
            cleanup();
        };

        document.addEventListener('confirm:ok', onOk, { once: true });
        document.addEventListener('confirm:cancel', onCancel, { once: true });

        if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
            window.AppConfirm.ask('Delete this product?');
        } else {
            window.confirm('Delete this product?') ? onOk() : onCancel();
        }
    });
});
