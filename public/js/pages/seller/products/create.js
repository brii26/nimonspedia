document.addEventListener('DOMContentLoaded', () => {
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp'];

	if (typeof TomSelect !== 'undefined') {
        new TomSelect('#category_id', {
            plugins: ['remove_button'],
            placeholder: 'Select categories...',
            create: false 
        });
    } else {
        console.error('TomSelect library is not loaded.');
    }

    const quill = createEditor('#editor', 'product-description');
    const form = document.getElementById('addProductForm'); // [REVISI] Ganti ke ID
    const fileInput = document.getElementById('input_file');
    const previewWrapper = document.getElementById('preview-wrapper');
    const previewImage = document.getElementById('image-preview');
    const saveBtn = form ? form.querySelector('button[type="submit"]') : null;

    // [REVISI] Tambahkan referensi input
    const nameInput = document.getElementById('product_name');
    const priceInput = document.getElementById('price');
    const stockInput = document.getElementById('stock');
    const categoryInput = document.getElementById('category_id');
    const descriptionInput = document.getElementById('product-description'); // Hidden input
    const descriptionError = document.getElementById('description-error');

    // --- [REVISI] Helper validasi ---
    const showError = (input, message) => {
        if (!input) return;
        const errorElId = input.id + '-error';
        const errorEl = document.getElementById(errorElId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
        // TomSelect (category) butuh perlakuan khusus
        if (input.id === 'category_id' && input.tomselect) {
            input.tomselect.wrapper.classList.add('is-invalid');
        } else if (input) {
            input.classList.add('is-invalid');
        }
    };

    const clearError = (input) => {
        if (!input) return;
        const errorElId = input.id + '-error';
        const errorEl = document.getElementById(errorElId);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
        if (input.id === 'category_id' && input.tomselect) {
            input.tomselect.wrapper.classList.remove('is-invalid');
        } else if (input) {
            input.classList.remove('is-invalid');
        }
    };
    // --- [REVISI SELESAI] ---


    // --- [REVISI] Fungsi validasi baru ---
    const validateName = () => {
        clearError(nameInput);
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Product Name is required.');
            return false;
        }
        return true;
    };

    const validatePrice = () => {
        clearError(priceInput);
        if (!priceInput.value.trim()) {
            showError(priceInput, 'Price is required.');
            return false;
        }
        const price = parseFloat(priceInput.value);
        if (isNaN(price) || price < 1000) {
            showError(priceInput, 'Price must be at least Rp 1.000.');
            return false;
        }
        return true;
    };

    const validateStock = () => {
        clearError(stockInput);
        if (stockInput.value.trim() === '') { // Cek string kosong
            showError(stockInput, 'Stock is required.');
            return false;
        }
        const stock = parseInt(stockInput.value, 10);
        if (isNaN(stock) || stock < 0) {
            showError(stockInput, 'Stock must be at least 0.');
            return false;
        }
        return true;
    };

    const validateCategory = () => {
        clearError(categoryInput);
        if (!categoryInput.value || categoryInput.value.length === 0) {
            showError(categoryInput, 'At least one category is required.');
            return false;
        }
        return true;
    };

    const validateDescription = () => {
        if (!quill) return true;
        const text = quill.getText().trim();
        if (text.length > 1000) {
            showError(descriptionInput, 'Description max 1000 chars.');
            return false;
        }
        clearError(descriptionInput);
        return true;
    };

    const validateImage = () => {
        clearError(fileInput);
        const file = fileInput.files[0];
        if (!file) return true; // Gambar opsional saat create

        if (file.size > MAX_SIZE_BYTES) {
            showError(fileInput, 'File exceeded 2MB.');
            return false;
        }
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
             showError(fileInput, 'Invalid file type (jpg, png, webp).');
             return false;
        }
        return true;
    };
    // --- [REVISI SELESAI] ---


    const clearPreview = () => {
        if (previewImage) previewImage.src = '';
        if (previewWrapper) previewWrapper.classList.remove('has-image');
    };

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            // [REVISI] Ganti logika validasi file
            const isValid = validateImage();
            if (!isValid) {
                this.value = ''; // Hapus file jika tidak valid
                clearPreview();
                return;
            }
            // ---
            
            const file = this.files[0];
            if (!file) {
                 clearPreview();
                 return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImage) previewImage.src = e.target.result;
                if (previewWrapper) previewWrapper.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        });
    }

    // --- [REVISI] Tambahkan listener untuk validasi live ---
    if (nameInput) nameInput.addEventListener('blur', validateName);
    if (priceInput) priceInput.addEventListener('blur', validatePrice);
    if (stockInput) stockInput.addEventListener('blur', validateStock);
    if (categoryInput) categoryInput.addEventListener('change', validateCategory);
    if (quill) quill.on('text-change', App.debounce(validateDescription, 300));

    if (nameInput) nameInput.addEventListener('input', () => clearError(nameInput));
    if (priceInput) priceInput.addEventListener('input', () => clearError(priceInput));
    if (stockInput) stockInput.addEventListener('input', () => clearError(stockInput));
    // --- [REVISI SELESAI] ---

    if (form) {
        form.addEventListener('submit', (e) => {
            // [REVISI] Jalankan semua validasi
            const isNameValid = validateName();
            const isPriceValid = validatePrice();
            const isStockValid = validateStock();
            const isCategoryValid = validateCategory();
            const isDescValid = validateDescription();
            const isImageValid = validateImage(); // Validasi file lagi saat submit

            if (!isNameValid || !isPriceValid || !isStockValid || !isCategoryValid || !isDescValid || !isImageValid) {
                e.preventDefault();
                App.showAlert('Please fix the errors in the form.', 'error');
                if (saveBtn) App.hideLoading(saveBtn);
                return;
            }
            // --- [REVISI SELESAI] ---
            
            if (quill) {
                const hidden = form.querySelector('input[name="product-description"]');
                if (hidden) hidden.value = quill.root.innerHTML;
            }
            if (saveBtn) App.showLoading(saveBtn, 'Saving...');
        });
    }

    // [REVISI] Ubah logika toast error
    // Hapus error inline dari server (jika ada) dan tampilkan sebagai toast
    document.querySelectorAll('small[id$="-error-server"]').forEach(el => {
        const msg = el.textContent.trim();
        if (msg) {
            App.showAlert(msg, 'error');
            el.remove();
        }
    });
    
    // Hapus alert error global dari server (jika ada) dan tampilkan sebagai toast
    const serverAlert = document.querySelector('.alert.alert-danger');
    if (serverAlert && serverAlert.textContent.trim()) {
        App.showAlert(serverAlert.textContent.trim(), 'error');
        serverAlert.remove();
    }
});