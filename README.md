# Prototype Absensi QR Siswa SD

Prototype Aplikasi web absensi siswa sekolah dasar berbasis **Flask + SQLite**. Guru memindai kartu QR siswa langsung dari kamera HP, kehadiran tercatat otomatis, lalu admin atau guru dapat melihat rekap dan mengunduh laporan Excel.

Dirancang mobile-first, ringan, mudah dipakai, dan bisa dijalankan di komputer sekolah maupun hosting sederhana.

---

## Fitur Utama

- **Login admin dan guru** dengan pembatasan akses per kelas.
- **Scan QR lewat kamera browser** (tidak perlu aplikasi tambahan).
- **Absensi otomatis** dengan status Hadir, Sakit, Izin, dan Alpa.
- **Ubah status manual** langsung dari daftar siswa.
- **Rekap per kelas dan per siswa** dengan persentase kehadiran.
- **Ekspor Excel** berisi sheet Rekap dan Detail, siap dicetak.
- **Impor siswa** dari file `.xlsx` atau `.csv` beserta template resmi.
- **Cetak kartu QR** ukuran A4, 10 kartu per lembar, siap dipotong.
- **Mode offline terbatas**: scan tetap tersimpan di perangkat dan disinkronkan saat internet kembali.
- **PWA ringan** dengan halaman offline dan ikon aplikasi.
- **Data QR aman**: kartu hanya berisi kode acak, bukan data pribadi siswa.

---

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Backend | Python 3.10+, Flask 3 |
| Database | SQLite + Flask-SQLAlchemy |
| Autentikasi | Flask-Login |
| Keamanan form | Flask-WTF (CSRF) |
| QR | `qrcode` + Pillow |
| Scan kamera | `html5-qrcode` (dimuat lokal) |
| Excel | `openpyxl` |
| Frontend | HTML, CSS, JavaScript vanilla |

---

## Struktur Proyek

```text
absensi-sd-kapita/
├── app/
│   ├── __init__.py          # App factory, blueprint, error handler, filter Jinja
│   ├── admin.py             # CRUD siswa, kelas, guru, impor, rekap admin
│   ├── auth.py              # Login, logout, ganti password
│   ├── excel.py             # Generator laporan Excel dan template impor
│   ├── formatting.py        # Format tanggal dan jam Bahasa Indonesia
│   ├── guru.py              # Scan, API scan/status/sync, rekap guru
│   ├── models.py            # User, SchoolClass, Student, Attendance
│   ├── print_cards.py       # Halaman cetak kartu QR
│   ├── reports.py           # Logika rekap dan hari efektif
│   ├── timeutil.py          # Zona waktu, tanggal hari ini
│   ├── utils.py             # Guard role, QR, hitung absensi, serializer
│   ├── static/
│   │   ├── css/style.css    # Desain aplikasi
│   │   ├── css/print.css    # Layout cetak A4
│   │   ├── js/app.js        # Navigasi, konfirmasi, PWA
│   │   ├── js/scan.js       # Kamera, scan, offline queue, sinkron
│   │   ├── icons/           # Ikon PWA dan favicon
│   │   ├── vendor/          # html5-qrcode.min.js
│   │   ├── manifest.json
│   │   ├── offline.html
│   │   └── sw.js
│   └── templates/
│       ├── admin/           # Dashboard, siswa, kelas, guru, impor
│       ├── auth/            # Login, ganti password
│       ├── errors/          # 403, 404, 500
│       ├── guru/            # Scan, daftar kelas
│       ├── print/           # Pilih cetak, kartu QR
│       ├── reports/         # Halaman rekap
│       ├── base.html
│       ├── _icons.html
│       └── _macros.html
├── config.py                # Konfigurasi aplikasi
├── seed.py                  # Data contoh siap pakai
├── run.py                   # Jalankan server lokal
├── wsgi.py                  # Entry point WSGI
├── Procfile                 # Contoh perintah deploy
├── requirements.txt
├── .env.example
└── README.md
```

---

## Instalasi Cepat

### 1. Clone repositori

```bash
git clone https://github.com/Fasiall/Absensi-SD---KAPITA.git
cd Absensi-SD---KAPITA
```

### 2. Buat virtual environment

**Linux / macOS**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell)**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependensi

```bash
pip install -r requirements.txt
```

### 4. Siapkan konfigurasi

```bash
cp .env.example .env
```

Buka `.env`, lalu ganti `SECRET_KEY` dengan nilai acak yang panjang. Contoh membuatnya:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Isi data contoh

```bash
python seed.py
```

Perintah ini membuat 1 admin, 3 guru, 6 kelas, 120 siswa, dan riwayat absensi 30 hari kerja. Hari ini hanya 8 siswa pertama per kelas yang sudah tercatat agar fitur scan bisa langsung dicoba.

Untuk menghapus semua data dan mengisi ulang:

```bash
python seed.py --force
```

### 6. Jalankan aplikasi

```bash
python run.py
```

Buka `http://localhost:5000`.

> Kamera browser hanya bisa dipakai di `localhost` atau alamat **HTTPS**. Jika diakses lewat IP lokal biasa (`http://192.168...`), tombol kamera akan menampilkan pesan agar memakai HTTPS/localhost.

---

## Akun Demo

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Guru 1 | `guru1` | `guru123` |
| Guru 2 | `guru2` | `guru123` |
| Guru 3 | `guru3` | `guru123` |

Segera ganti password setelah aplikasi dipakai sungguhan.

---

## Alur Pemakaian

### Admin

1. Masuk dengan akun admin.
2. Buka **Dashboard** untuk melihat kehadiran hari ini.
3. Kelola **Kelas**, **Guru**, dan **Siswa**.
4. Gunakan **Impor** untuk menambahkan banyak siswa sekaligus.
5. Buka **Cetak** untuk mencetak kartu QR siswa.
6. Buka **Rekap** untuk melihat laporan dan mengunduh Excel.

### Guru

1. Masuk dengan akun guru.
2. Pilih kelas dan tanggal di halaman **Scan**.
3. Arahkan kamera ke kartu QR siswa.
4. Status Hadir langsung tercatat; suara dan getaran menandakan hasil scan.
5. Gunakan tombol **Ubah** pada daftar siswa untuk mengubah status menjadi Sakit, Izin, atau Alpa.
6. Buka **Rekap** untuk melihat laporan kelas yang diampu.

### Alur Scan

- QR yang tidak dikenali akan menampilkan pesan kesalahan.
- QR milik kelas lain akan ditolak.
- Scan ganda pada hari yang sama akan menampilkan status yang sudah tercatat.
- Setelah scan berhasil, kamera berhenti sebentar lalu aktif kembali otomatis.

---

## Mode Offline

Halaman scan dapat menyimpan absensi sementara di perangkat saat koneksi terputus:

1. Scan tetap berjalan dan data masuk ke antrean lokal (`localStorage`).
2. Daftar siswa menampilkan badge **Menunggu**.
3. Saat internet kembali, data dikirim otomatis ke server.
4. Tombol **Sinkronkan** juga tersedia untuk mengirim ulang secara manual.

Perubahan status manual dan halaman rekap tetap membutuhkan koneksi internet.

---

## Impor Siswa dari Excel

1. Buka **Impor** lalu unduh **Template Excel**.
2. Isi sheet `Data Siswa` mulai baris ke-2.
3. Kolom wajib: **NIS**, **Nama**, **Kelas**.
4. Nama kelas harus sama persis dengan kelas yang sudah dibuat, misalnya `1A`.
5. NIS harus unik dan belum terdaftar.
6. Unggah file `.xlsx` atau `.csv`.

Baris yang bermasalah akan dilewati dan ditampilkan beserta alasannya. Baris yang valid tetap disimpan.

---

## Cetak Kartu QR

- Buka **Cetak**, pilih kelas atau siswa.
- Layout A4 berisi 10 kartu per lembar.
- Gunakan browser Chrome/Edge, pilih kertas **A4**, skala **100%**, dan matikan header/footer browser.
- Setiap kartu memuat nama, kelas, NIS, kode QR, dan kode cadangan.

Kartu dapat dicetak ulang kapan saja dari halaman **Siswa** atau **Cetak**.

---

## Definisi Rekap

- **Hari efektif** adalah tanggal yang memiliki minimal satu catatan absensi pada kelas tersebut dalam periode yang dipilih.
- Siswa yang tidak memiliki catatan pada hari efektif dihitung **Alpa**.
- **Persentase kehadiran** = jumlah Hadir ÷ jumlah hari efektif × 100%.
- Rekap gabungan beberapa kelas memakai pembobotan jumlah siswa × hari efektif.

---

## Konfigurasi Environment

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `SECRET_KEY` | nilai dev | Wajib diganti di produksi |
| `SCHOOL_NAME` | `SD KAPITA` | Nama sekolah pada tampilan dan kartu |
| `APP_TIMEZONE` | `Asia/Jakarta` | Zona waktu tanggal/jam absensi |
| `DATABASE_URL` | `instance/absensi.db` | Lokasi database SQLite |
| `SESSION_COOKIE_SECURE` | `0` | Set `1` jika sudah HTTPS |
| `FLASK_DEBUG` | `0` | Set `1` hanya saat pengembangan |
| `PORT` | `5000` | Port server lokal |

---

## Deployment

Aplikasi bisa dijalankan dengan Gunicorn:

```bash
gunicorn wsgi:app --bind 0.0.0.0:8000 --workers 1 --threads 4 --timeout 120
```

Langkah umum:

1. Set environment variable `SECRET_KEY`, `SCHOOL_NAME`, dan `APP_TIMEZONE`.
2. Set `SESSION_COOKIE_SECURE=1` setelah HTTPS aktif.
3. Jalankan `python seed.py` sekali untuk membuat database awal, atau gunakan database kosong lalu buat akun admin secara manual.
4. Pastikan folder `instance/` persisten agar database tidak hilang saat redeploy.
5. Gunakan HTTPS agar kamera dapat diakses dari HP.

Contoh `Procfile` sudah disertakan untuk platform yang mendukung proses web Gunicorn.

---

## Checklist Pengujian Manual

- [ ] Login admin berhasil dan diarahkan ke dashboard.
- [ ] Login guru berhasil dan diarahkan ke halaman scan.
- [ ] Password salah menampilkan pesan kesalahan.
- [ ] Guru tidak bisa membuka halaman admin (403).
- [ ] Admin dapat menambah, mengubah, dan menghapus siswa.
- [ ] Admin dapat menambah kelas dan menugaskan guru.
- [ ] Admin dapat membuat akun guru dan menonaktifkannya.
- [ ] Impor Excel menambah siswa valid dan menolak baris bermasalah.
- [ ] Template Excel dapat diunduh dan dibuka.
- [ ] Halaman scan menampilkan daftar siswa dan counter kehadiran.
- [ ] Scan QR siswa menghasilkan status Hadir.
- [ ] Scan QR yang sama menampilkan pesan sudah tercatat.
- [ ] Scan QR kelas lain ditolak.
- [ ] Scan QR acak menampilkan pesan tidak dikenali.
- [ ] Ubah status manual menjadi Sakit/Izin/Alpa berhasil.
- [ ] Status manual meminta catatan opsional.
- [ ] Mode offline menyimpan scan dan menampilkan badge Menunggu.
- [ ] Sinkronisasi otomatis/manual mengirim antrean offline.
- [ ] Rekap menampilkan hari efektif dan persentase yang benar.
- [ ] Filter kelas dan periode pada rekap berfungsi.
- [ ] Ekspor Excel berhasil dan berisi sheet Rekap + Detail.
- [ ] Cetak kartu QR tampil rapi 10 kartu per lembar A4.
- [ ] Halaman 404 dan 403 tampil dengan benar.
- [ ] Kamera hanya aktif di HTTPS atau localhost.
- [ ] Service worker dan halaman offline berfungsi setelah reload.

---

## Keamanan dan Catatan

- Ganti `SECRET_KEY` dan semua password demo sebelum dipakai di sekolah.
- Gunakan HTTPS di produksi agar kamera dan cookie aman.
- QR hanya menyimpan kode acak; jangan mencetak data pribadi di kartu.
- Database SQLite cocok untuk satu sekolah dengan trafik kecil. Untuk banyak sekolah, pertimbangkan PostgreSQL.
- Backup file database secara berkala, terutama folder `instance/`.
- Aplikasi ini tidak menyimpan foto atau data biometrik siswa.

---

## Ide Pengembangan Lanjutan

- Absensi pulang dengan dua kali scan.
- Notifikasi WhatsApp/email untuk siswa Alpa.
- Dashboard tren kehadiran bulanan dan semester.
- Import langsung dari Dapodik.
- Multi-sekolah dengan pembatasan data per sekolah.
- Kartu QR dengan logo sekolah dan desain kustom.
- Audit log perubahan data absensi.
- Dukungan PostgreSQL dan migrasi database (Alembic).
- Mode kiosk untuk tablet di pintu kelas.

---

Dibuat untuk memudahkan absensi harian siswa SD: cepat, rapi, dan tanpa kertas absen manual.
