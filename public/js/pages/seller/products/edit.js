document.addEventListener('DOMContentLoaded', () => {
		const MAX_SIZE_BYTES = 2 * 1024 * 1024;

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
		const form  = document.querySelector('form[action^="/seller/products/update"]') || document.getElementById('product-form');
		const fileInput = document.getElementById('input_file');
		const previewWrapper = document.getElementById('preview-wrapper');
		const previewImage   = document.getElementById('image-preview');
		const btnUpdate = document.querySelector('#update-product-btn');
	
		const clearPreview = () => {
			if (previewImage) previewImage.src = '';
			if (previewWrapper) previewWrapper.classList.remove('has-image');
		};
	
		if (fileInput) {
			fileInput.addEventListener('change', function () {
				const file = this.files?.[0];
				this.classList.remove('is-invalid');
				if (!file) return;
		
				if (file.size > MAX_SIZE_BYTES) {
					this.value = '';
					this.classList.add('is-invalid');
					App.showAlert('File exceeded 2MB.', 'error');
					return;
				}
		
				const reader = new FileReader();
				reader.onload = e => {
				if (previewImage) previewImage.src = e.target.result;
				if (previewWrapper) previewWrapper.classList.add('has-image');
				};
				reader.readAsDataURL(file);
			});
		}
	
		let submitting = false;
	
		if (form) {
			form.addEventListener('submit', (e) => {
				e.preventDefault();
				if (submitting) return;
		
				const file = fileInput && fileInput.files?.[0];
				if (file && file.size > MAX_SIZE_BYTES) {
					clearPreview();
					if (fileInput) fileInput.value = '';
					App.showAlert('File exceeded 2MB.', 'error');
					return;
				}
		
				if (quill) {
					const hidden = form.querySelector('input[name="product-description"]');
					if (hidden) hidden.value = quill.root.innerHTML;
				}
		
				const onConfirm = () => {
					submitting = true;
					if (btnUpdate) App.showLoading(btnUpdate, 'Saving...');
					form.submit();
					cleanup();
				};
		
				const onCancel = () => {
					if (btnUpdate) App.hideLoading(btnUpdate);
					cleanup();
				};
		
				const cleanup = () => {
					document.removeEventListener('confirm:ok', onConfirm);
					document.removeEventListener('confirm:cancel', onCancel);
				};
		
				document.addEventListener('confirm:ok', onConfirm, { once: true });
				document.addEventListener('confirm:cancel', onCancel, { once: true });
		
				if (window.AppConfirm && typeof window.AppConfirm.ask === 'function') {
					window.AppConfirm.ask('Save Product Changes?');
				} else {
					window.confirm('Save Product Changes?') ? onConfirm() : onCancel();
				}
			});
			}
		
			const serverAlert = document.querySelector('.alert.alert-danger');
			if (serverAlert && serverAlert.textContent.trim()) {
				App.showAlert(serverAlert.textContent.trim(), 'error');
				serverAlert.remove();
			} else {
				const inlineErrors = document.querySelectorAll('form[action^="/seller/products/update"] small.text-danger');
				let firstMsg = '';
				inlineErrors.forEach(el => {
					const msg = el.textContent.trim();
					if (!firstMsg && msg) firstMsg = msg;
					el.remove();
				});
				if (firstMsg) App.showAlert(firstMsg, 'error');
		}
  });
  