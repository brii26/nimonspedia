document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('input_file');
    const previewWrapper = document.getElementById('preview-wrapper');
    const previewImage = document.getElementById('image-preview');

	createEditor('#editor', 'product-description');

    fileInput.addEventListener('change', function() {
        const file = this.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewWrapper.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            previewWrapper.style.display = 'none';
            previewImage.src = '#';
        }
    });
})