# Dokumentasi API & Router Nimonspedia

## 1. Konsep Dasar

Sistem perutean aplikasi ini bertanggung jawab untuk memetakan sebuah URL yang diakses oleh pengguna ke sebuah fungsi atau method yang spesifik di dalam Controller. Ini memungkinkan kita untuk mengorganisir kode dengan rapi.

Pola yang digunakan adalah:
`'NamaController@namaMethod'`

- NamaController: Nama kelas Controller yang akan menangani permintaan.
- namaMethod: Nama method di dalam Controller tersebut yang akan dieksekusi.

## 2. File Kunci

Semua logika perutean dan pendaftaran rute terpusat pada dua file utama:

- src/core/Router.php: File ini yang akan memproses URL masuk, mencari rute yang cocok, dan memanggil Controller yang sesuai.
- src/core/Application.php: Semua rute untuk aplikasi (baik untuk halaman web maupun API) didaftarkan di dalam method setupRoutes() di file ini.

## 3. Cara Mendaftarkan Rute Baru

Untuk menambahkan halaman atau endpoint API baru, kita hanya perlu menambahkan satu baris kode di dalam method setupRoutes() pada file src/core/Application.php.

## 4. Mendaftarkan Rute GET

Gunakan $this->router->get() untuk menangani permintaan GET, biasanya digunakan untuk menampilkan data.

Sintaks:

`$this->router->get('/url-yang-diinginkan', 'NamaController@namaMethod');`

## 5. Mendaftarkan Rute POST

Gunakan $this->router->post() untuk menangani permintaan POST, biasanya digunakan untuk mengirim atau membuat data baru.

Sintaks:

`$this->router->post('/url-untuk-submit-data', 'NamaController@namaMethod');`