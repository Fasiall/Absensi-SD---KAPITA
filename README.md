# Absensi Siswa & Siswi — SD Negeri Purwodadi Simpang

Aplikasi absensi sekolah berbasis QR code. Guru memindai kartu QR siswa, sistem
mencatat kehadiran harian, dan admin/kepala sekolah dapat menarik rekap dalam
bentuk Excel.

Dibuat untuk **Kapita Selekta — Kelompok 7, Institut Teknologi Sumatera**.

## Anggota Kelompok : 7

| No | Nama | NIM | Peran |
|:--:|:-----|:---:|:-----:|
| 1 | **Faisal H. Sinambela** | 124140040 | Database |
| 2 | **Gabriel Sitorus** | 124140188 | Front End |
| 3 | **Alfino Putra R.** | 124140127 | Back End |
| 4 | **Yayan Sofian** | 124140130 | Dokumentasi / Testing |
| 5 | **Muhammad Zaki Ibnu Azizi** | 124140089 | Project Manager |

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 + driver adapter `@prisma/adapter-pg` |
| Auth | JWT HS256 (`jose`) di cookie httpOnly |
| QR | `qrcode` (generate) + `html5-qrcode` (scan browser) |
| Excel | `exceljs` |

## Fitur

**Admin**
- Dashboard ringkasan kehadiran
- CRUD Siswa, Kelas, Guru
- Impor siswa massal (CSV / XLSX) + unduh template
- Rekap kehadiran per periode dengan ekspor Excel
- Cetak kartu QR (per kelas atau per siswa, 10 kartu/lembar A4)

**Guru**
- Scan QR siswa via kamera perangkat
- Antrean offline — scan tetap tersimpan saat sinyal hilang lalu disinkronkan
- Ubah status kehadiran (Hadir / Sakit / Izin / Alpa) + catatan
- Rekap kelas yang diampu + ekspor Excel
- Cetak kartu QR kelas

**Umum**
- PWA (manifest, service worker, halaman offline)
- Hak akses per kelas untuk guru

## Menjalankan Secara Lokal

### 1. Pasang dependensi

```bash
npm install
```

### 2. Siapkan environment

Buat `.env.local` di root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
SECRET_KEY="string-acak-panjang-untuk-menandatangani-sesi"
SCHOOL_NAME="SD Negeri Purwodadi Simpang"
APP_TIMEZONE="Asia/Jakarta"
```

> Gunakan **connection pooler** Supabase (port `6543`). Host langsung
> `db.<ref>.supabase.co` hanya IPv6 dan gagal di lingkungan serverless.

### 3. Siapkan database

```bash
npx prisma generate
npx prisma db push
```

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Perintah

```bash
npm run dev      # server pengembangan
npm run build    # build produksi (prisma generate + next build)
npm run start    # jalankan hasil build
npm run lint     # eslint
```

## Struktur Proyek

```
src/
├── app/
│   ├── (auth)/login/          # halaman login
│   ├── (cetak)/cetak/kartu/   # lembar cetak kartu (tanpa shell)
│   ├── admin/                 # dashboard, siswa, kelas, guru, impor, rekap
│   ├── guru/                  # scan, kelas, rekap
│   ├── api/                   # scan, status, sync
│   ├── cetak/                 # pemilihan kelas untuk cetak
│   ├── akun/                  # ganti password
│   ├── offline/               # halaman fallback PWA
│   ├── manifest.webmanifest/  # manifest PWA (route handler)
│   └── sw.js/                 # service worker (route handler)
├── components/                # AppShell, Icon, FlashMessages, dll.
├── lib/                       # akses data, auth, laporan, qr, waktu
└── middleware.ts              # injeksi header x-pathname
prisma/
└── schema.prisma
public/
├── css/print.css              # gaya lembar A4 untuk kartu
├── icons/                     # ikon PWA
└── vendor/html5-qrcode.min.js
```

## Hak Akses

| Peran | Akses |
|---|---|
| `admin` | Seluruh data dan seluruh kelas |
| `guru` | Hanya kelas yang ditugaskan kepadanya |

Guru yang membuka data kelas lain akan menerima `403` (halaman) atau
`{"code":"forbidden"}` (API scan).

## Deploy

Vercel mendeteksi framework Next.js secara otomatis. Yang perlu disiapkan di
dashboard Vercel:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | URL pooler Supabase (port 6543) |
| `SECRET_KEY` | kunci penandatangan sesi |
| `SCHOOL_NAME` | nama sekolah untuk tampilan |
| `APP_TIMEZONE` | zona waktu pencatatan, mis. `Asia/Jakarta` |

`vercel.json` menjalankan `prisma generate && next build`, dan `postinstall`
juga men-generate Prisma client saat `npm install`.
