document.addEventListener('DOMContentLoaded', function() {
    
    const toggleButton = document.getElementById('toggle-advanced-filter');
    const advancedFilters = document.getElementById('advanced-filters-container');

    // Cek apakah elemennya ada di halaman
    if (toggleButton && advancedFilters) {
        
        toggleButton.addEventListener('click', function() {
            // Toggle class 'open' pada container
            advancedFilters.classList.toggle('open');
            
            // Ubah teks tombol untuk UX yang lebih baik
            if (advancedFilters.classList.contains('open')) {
                toggleButton.textContent = 'Tutup Opsi Filter';
            } else {
                toggleButton.textContent = 'Opsi Filter Lanjutan';
            }
        });
    }

});