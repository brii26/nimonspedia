document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('input_file');
    const previewWrapper = document.getElementById('preview-wrapper');
    const previewImage = document.getElementById('image-preview');

    createEditor('#editor', 'product-description');

    if (previewImage.src && previewImage.src !== '#' && !previewImage.src.includes('data:')) {
        previewWrapper.classList.add('has-image');
    }

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewWrapper.classList.add('has-image'); 
            }
            reader.readAsDataURL(file);
        } else {
            previewWrapper.classList.remove('has-image');
            previewImage.src = '#'; 
        }
    });
});