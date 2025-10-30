document.addEventListener('DOMContentLoaded', () => {
	const editBtn = document.getElementById('edit-store-button');
	const cancelBtn = document.getElementById('cancel-button');
	const storeForm = document.querySelector('#store-edit form');
	const saveBtn = document.querySelector('#save-button');

	let editor = createEditor('#editor','store_description');
  
	editBtn.addEventListener('click', () => {
		document.body.classList.toggle('edit-mode');
	});

	cancelBtn.addEventListener('click', () => {
		document.body.classList.toggle('edit-mode');
	});

	storeForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const formData = new FormData(storeForm);
		formData.set('store_description', editor.root.innerHTML);
	
		console.log('saveBtn before showLoading:', saveBtn);
		App.showLoading(saveBtn, 'Saving...');
	
		try {
		  const res = await fetchXhr('/seller/store/update', {
			method: 'POST',
			body: formData,
			headers: {
			  'xml-request': 'XMLHttpRequest' 
			},
		  });
			
		const payload = await res.json();

		if (res.ok && payload && payload.success) {
			const nameEl = document.querySelector('#store-name-display');
			const descEl = document.querySelector('#store-description-display');
			if (nameEl) nameEl.textContent = payload.data.store_name;
			if (descEl) descEl.innerHTML = payload.data.store_description;

			if (payload.data.store_logo_path) {
			const logoPathEl = document.querySelector('#store-logo-path');
			if (logoPathEl) logoPathEl.innerHTML = ' ' + payload.data.store_logo_path;
			}
			App.hideLoading(saveBtn);
			// console.log("done ", saveBtn.textContent);
			// document.body.classList.toggle('edit-mode');
			App.showAlert('Store updated', 'success');
		} else {
			App.showAlert(payload?.message || 'Update failed', 'error');
		}
	  } catch (err) {
		App.hideLoading(saveBtn);
		console.error('Request error:', err);
		App.showAlert('Error updating store', 'error');
	  }
	});
});

//test