document.addEventListener('DOMContentLoaded', function() {
    
    const MAX_DESC_CHARS = 1000;
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; 

    const quill = createEditor('#editor', 'product-description'); 
    const editorDiv = document.getElementById('editor');
    if (editorDiv) {
        editorDiv.insertAdjacentHTML('afterend', `
            <div class="d-flex justify-content-between mt-1">
                <small id="description-error" class="text-danger"></small>
                <small id="char-counter" class="form-text text-muted">0 / ${MAX_DESC_CHARS}</small>
            </div>
        `);
    }
    const counter = document.getElementById('char-counter');
    const descErrorElement = document.getElementById('description-error');

    if (quill && counter) {
        quill.on('text-change', function() {
            const length = quill.getText().trim().length;
            counter.textContent = `${length} / ${MAX_DESC_CHARS}`;
            counter.classList.toggle('text-danger', length > MAX_DESC_CHARS);
            counter.classList.toggle('text-muted', length <= MAX_DESC_CHARS);
            if(descErrorElement) descErrorElement.textContent = '';
        });
        
        const initialLength = quill.getText().trim().length;
        counter.textContent = `${initialLength} / ${MAX_DESC_CHARS}`;
        if (initialLength > MAX_DESC_CHARS) counter.classList.add('text-danger');
    }

    const fileInput = document.getElementById('input_file');
    const previewWrapper = document.getElementById('preview-wrapper');
    const previewImage = document.getElementById('image-preview');
    const imageErrorElement = document.getElementById('image-error');

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            
            if(imageErrorElement) imageErrorElement.textContent = '';
            fileInput.classList.remove('is-invalid');
            
            if (file) {
                if (file.size > MAX_SIZE_BYTES) {
                    if(imageErrorElement) imageErrorElement.textContent = 'Ukuran file terlalu besar. Maksimal 2MB.';
                    fileInput.classList.add('is-invalid');
                    this.value = '';
                    previewWrapper.classList.remove('has-image');
                    previewImage.src = '#';
                    return;
                }
                
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
    }

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(event) {
            
            if (quill && descErrorElement) {
                const descriptionLength = quill.getText().trim().length;
                if (descriptionLength > MAX_DESC_CHARS) {
                    event.preventDefault(); 
                    descErrorElement.textContent = `Deskripsi terlalu panjang (maks ${MAX_DESC_CHARS} karakter).`;
                }
            }
        });
    }
});
