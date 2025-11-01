document.addEventListener('DOMContentLoaded', () => {
	const MAX_SIZE_BYTES = 2 * 1024 * 1024;
  
	const quill = createEditor('#editor', 'product-description');
	const form = document.querySelector('form[action^="/seller/products/update"]') || document.getElementById('product-form');
	const fileInput = document.getElementById('input_file');
	const previewWrapper = document.getElementById('preview-wrapper');
	const previewImage = document.getElementById('image-preview');
	const saveBtn = form ? form.querySelector('button[type="submit"]') : null;
  
	const modal = document.getElementById('confirm-modal');
	const confirmBtn = document.getElementById('confirm-update');
	const cancelBtn = document.getElementById('cancel-update');
  
	const showModal = () => { if (modal) modal.style.display = 'flex'; };
	const hideModal = () => { if (modal) modal.style.display = 'none'; };
  
	const clearPreview = () => {
	  if (previewImage) previewImage.src = '';
	  if (previewWrapper) previewWrapper.classList.remove('has-image');
	};
  
	if (fileInput) {
	  fileInput.addEventListener('change', function () {
		const file = this.files[0];
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
  
	let confirmed = false;
  
	if (form) {
	  form.addEventListener('submit', e => {
		if (confirmed) { if (saveBtn) App.showLoading(saveBtn, 'Saving...'); return; }
		e.preventDefault();
  
		const file = fileInput && fileInput.files[0];
		if (file && file.size > MAX_SIZE_BYTES) {
		  clearPreview();
		  fileInput.value = '';
		  App.showAlert('File exceeded 2MB.', 'error');
		  return;
		}
  
		if (quill) {
		  const hidden = form.querySelector('input[name="product-description"]');
		  if (hidden) hidden.value = quill.root.innerHTML;
		}
  
		showModal();
	  });
	}
  
	if (confirmBtn) {
	  confirmBtn.addEventListener('click', () => {
		confirmed = true;
		hideModal();
		if (saveBtn) App.showLoading(saveBtn, 'Saving...');
		form.submit();
	  });
	}
  
	if (cancelBtn) {
	  cancelBtn.addEventListener('click', hideModal);
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
  