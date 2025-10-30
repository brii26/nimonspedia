document.addEventListener('DOMContentLoaded', () => {
	const editBtn = document.getElementById('edit-store-button');
	const cancelBtn = document.getElementById('cancel-button');
	const storeForm = document.querySelector('#store-edit form');

	let editor = createEditor('#editor','store_description');
  
	editBtn.addEventListener('click', () => {
		document.body.classList.toggle('edit-mode');
	});

	storeForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const formData = new FormData(storeForm);
		formData.set('store_description', editor.root.innerHTML);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/seller/store/update', true);
		xhr.setRequestHeader('xml-request', 'XMLHttpRequest');
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					try {
						const response = JSON.parse(xhr.responseText);
						console.log('Server response:', response); // Debug log

						if (response.success) {
							document.querySelector('#store-name-display').textContent = response.data.store_name;
							document.querySelector('#store-description-display').innerHTML = response.data.store_description;
							
							if (response.data.store_logo_path) {
								document.querySelector('#store-logo-path').innerHTML = ' ' + response.data.store_logo_path;
							}
							
							document.body.classList.toggle('edit-mode');
						} else {
							alert(response.message || 'Update failed');
						}
					} catch (e) {
						console.error('Parse error:', e, 'Response text:', xhr.responseText);
						alert('Error processing response');
					}
				} else {
					console.error('HTTP Error:', xhr.status, xhr.statusText);
					alert('Error updating store');
				}
			}
		};

		xhr.send(formData);
	});

	cancelBtn.addEventListener('click', () => {
		document.body.classList.toggle('edit-mode');
	});
});