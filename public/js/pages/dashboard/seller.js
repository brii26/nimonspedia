document.addEventListener('DOMContentLoaded', () => {
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;

    const editBtn = document.getElementById('edit-store-button');
    const cancelBtn = document.getElementById('cancel-button');
    const storeForm = document.querySelector('#store-edit form');
    const saveBtn = document.getElementById('save-button');

    const editor = createEditor('#editor', 'store_description');

    const fileInput = document.getElementById('edit_file');
    const previewWrapper = document.getElementById('preview-wrapper');
    const previewImage = document.getElementById('image-preview');
    const imageErrorEl = document.getElementById('image-error');

    const enterEdit = () => {
        document.body.classList.add('edit-mode');
        const storeLogo = document.querySelector('.store-logo-img');
        if (storeLogo && storeLogo.getAttribute('src')) {
            previewImage.src = storeLogo.getAttribute('src');
            previewWrapper.classList.add('has-image');
        }
    };

    const exitEdit = () => document.body.classList.remove('edit-mode');

    editBtn.addEventListener('click', enterEdit);
    cancelBtn.addEventListener('click', () => {
        fileInput.value = '';
        if (imageErrorEl) imageErrorEl.textContent = '';
        exitEdit();
    });

    const storeLogo = document.querySelector('.store-logo-img');
    if (storeLogo && storeLogo.getAttribute('src')) {
        previewImage.src = storeLogo.getAttribute('src');
        previewWrapper.classList.add('has-image');
    }

    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (imageErrorEl) imageErrorEl.textContent = '';
        this.classList.remove('is-invalid');
        if (!file) return;
        if (file.size > MAX_SIZE_BYTES) {
            this.value = '';
            this.classList.add('is-invalid');
            App.showAlert('File Exceeded 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewWrapper.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    });

    const handleStoreUpdate = async () => {
        const file = fileInput.files[0];
        if (file && file.size > MAX_SIZE_BYTES) {
            fileInput.value = '';
            fileInput.classList.add('is-invalid');
            App.showAlert('File Exceeded 2MB', 'error');
            return;
        }
        const formData = new FormData(storeForm);
        formData.set('store_description', editor.root.innerHTML);
        App.showLoading(saveBtn, 'Saving...');
        try {
            const res = await fetchXhr('/seller/store/update', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const payload = await res.json();
            if (res.ok && payload && payload.success) {
                const nameEl = document.querySelector('#store-name-display');
                const descEl = document.querySelector('#store-description-display');
                if (nameEl) nameEl.textContent = payload.data.store_name;
                if (descEl) descEl.innerHTML = payload.data.store_description;
                if (payload.data.store_logo_path) {
                    const logoImgEl = document.querySelector('.store-logo-img');
                    const newImageUrl = '/storage/' + payload.data.store_logo_path;
                    if (logoImgEl) {
                        logoImgEl.src = newImageUrl;
                        logoImgEl.alt = (payload.data.store_name || 'Store') + ' Logo';
                    }
                    previewImage.src = newImageUrl;
                    previewWrapper.classList.add('has-image');
                }
                fileInput.value = '';
                App.hideLoading(saveBtn);
                exitEdit();
                App.showAlert('Store updated', 'success');
            } else {
                App.hideLoading(saveBtn);
                App.showAlert(payload?.message || 'Update failed', 'error');
            }
        } catch (err) {
            App.hideLoading(saveBtn);
            console.error('Request error:', err);
            App.showAlert('Error updating store', 'error');
        }
    };

    storeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
            window.AppConfirm.ask('Are you sure you want to update this store?');

            document.addEventListener('confirm:ok', function onConfirm() {
                handleStoreUpdate();
            }, { once: true });

            document.addEventListener('confirm:cancel', function onCancel() {
            }, { once: true });

        } else {
            console.error('AppConfirm modal not found.');
            handleStoreUpdate();
        }
    });
});