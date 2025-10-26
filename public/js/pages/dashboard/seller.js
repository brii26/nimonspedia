document.addEventListener('DOMContentLoaded', () => {
	const editBtn = document.getElementById('edit-store-button');
	const saveBtn = document.getElementById('save-button');
	const cancelBtn = document.getElementById('cancel-button');

	createEditor('#editor','store_description');
  
	editBtn.addEventListener('click', () => {
	  document.body.classList.toggle('edit-mode');
	});

	saveBtn.addEventListener('click', () => {
		document.body.classList.toggle('edit-mode');
	});

	cancelBtn.addEventListener('click', () => {
		document.body.classList.toggle('edit-mode');
	});
});