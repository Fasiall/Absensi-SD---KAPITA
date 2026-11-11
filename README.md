<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0D47A1,100:81D4FA&height=200&section=header&text=Absensi%20Siswa%20&%20Siswi&fontSize=34&fontColor=ffffff&fontAlignY=38&desc=KAPITA%20SELEKTA%20%7C%20Institut%20Teknologi%20Sumatera&descAlignY=55&descAlign=50&animation=twinkling" width="100%" />

  <br/>

  <b>Selamat datang di repositori Kelompok 7 - KAPITA SELEKTA! 🚀</b>
  <p>Repositori ini didedikasikan untuk kapita selekta pada tugas besar.</p>

  <p align="center">
    <img src="https://img.shields.io/badge/Kotlin-0095D5?style=for-the-badge&logo=kotlin&logoColor=white" />
    <img src="https://img.shields.io/badge/Compose_Multiplatform-4285F4?style=for-the-badge&logo=android&logoColor=white" />
    <img src="https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white" />
    <img src="https://img.shields.io/badge/Material_Design_3-3DDC84?style=for-the-badge&logo=materialdesign&logoColor=white" />
  </p>
</div>

---

## Anggota Kelompok : 7

| No | Nama | NIM | Peran |
|:--:|:-----|:---:|:-----:|
| 1 | **Faisal H. Sinambela** | 124140040 | Database |
| 2 | **Gabriel Sitorus** | 124140188 | Front End |
| 3 | **Alfino Putra R.** | 124140127 | Back End |
| 4 | **Yayan Sofian** | 124140130 | Dokumentasi / Testing |
| 5 | **Muhammad Zaki Ibnu Azizi** | 124140089 | Project Manager |

## Deskripsi Proyek


## Tahapan Pengerjaan TugasProyek
> Duplikat Folder Tugas Terakhir (Rename Jadi Tugas Saat Ini)
> -> Sync Gradle
> -> Update Code Sesuai Tugas Yang Akan Dikerjakan 



# Prototype Absensi QR Siswa SD

Prototype Aplikasi web absensi siswa sekolah dasar berbasis **Flask + SQLite**. Guru memindai kartu QR siswa langsung dari kamera HP, kehadiran tercatat otomatis, lalu admin atau guru dapat melihat rekap dan mengunduh laporan Excel.

Dirancang mobile-first, ringan, mudah dipakai, dan bisa dijalankan di komputer sekolah maupun hosting sederhana.


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

