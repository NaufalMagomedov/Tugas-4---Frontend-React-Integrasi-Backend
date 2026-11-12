# Review Kantin — Tugas 4: Frontend React & Integrasi Backend

Aplikasi web untuk melihat, mencari, dan mengulas warung/kantin kampus. Pengguna dapat mendaftar, masuk, melihat daftar warung beserta menu dan review, serta mengunggah gambar. Pemilik warung (owner) mengelola warung dan menunya, sedangkan admin memantau seluruh data melalui panel admin.

Proyek ini terdiri dari **backend REST API** dan **frontend React** yang saling terintegrasi, dengan autentikasi berbasis cookie `httpOnly` dan pembatasan akses berdasarkan peran (RBAC).

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menyiapkan Database](#menyiapkan-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Akun dan Peran](#akun-dan-peran)
- [Endpoint API](#endpoint-api)
- [Pengujian dan Build](#pengujian-dan-build)
- [Troubleshooting](#troubleshooting)
- [Keamanan dan Data Sensitif](#keamanan-dan-data-sensitif)

## Fitur Utama

- Registrasi dan login dengan sesi JWT yang disimpan di cookie `httpOnly` (token tidak disimpan di `localStorage`).
- Otorisasi berbasis peran: `admin`, `owner`, dan `customer`.
- Daftar warung dengan pencarian, filter kategori, dan paginasi.
- Detail warung lengkap dengan menu dan review.
- CRUD warung dan menu untuk owner/admin, termasuk unggah gambar (JPG, PNG, WEBP, GIF; maksimal 5 MB).
- Review dan penghapusan review sesuai hak akses.
- Panel admin untuk ringkasan data dan pengelolaan warung.
- Validasi input dengan Zod di backend dan validasi form di frontend.
- Penanganan error terpusat dengan kode error dan `requestId`.
- Dokumentasi API interaktif melalui Swagger UI.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Runtime backend | Node.js ≥ 22, TypeScript, `tsx` |
| Framework backend | Express 5 |
| Database | Microsoft SQL Server, Drizzle ORM (dialect MSSQL), driver `mssql` |
| Autentikasi | JSON Web Token (HS256), `bcryptjs`, `cookie-parser` |
| Validasi | Zod |
| Dokumentasi API | OpenAPI + Swagger UI (`swagger-ui-express`) |
| Frontend | React 19, TypeScript, Vite 8 |
| Routing frontend | React Router 7 |
| HTTP client | Axios (dengan `withCredentials`) |
| Styling | Tailwind CSS 4, `lucide-react` |
| Pengujian | `node:test` / `tsx --test`, ESLint, `tsc --noEmit` |

## Struktur Proyek

```text
tugas 4 frontend react dan integrasi backend/
├─ backend/
│  ├─ src/
│  │  ├─ config/          # pembacaan environment terpusat
│  │  ├─ controllers/     # handler HTTP
│  │  ├─ db/              # koneksi & skema Drizzle
│  │  ├─ docs/            # definisi OpenAPI
│  │  ├─ dtos/            # bentuk data respons
│  │  ├─ errors/          # kelas error aplikasi
│  │  ├─ middlewares/     # auth, authorize, CORS, validasi, error handler
│  │  ├─ repositories/    # akses database
│  │  ├─ routes/          # definisi endpoint
│  │  ├─ schemas/         # skema validasi Zod
│  │  ├─ services/        # logika bisnis
│  │  └─ utils/           # cookie, upload, util SQL
│  ├─ tests/              # pengujian backend
│  ├─ uploads/            # gambar unggahan (dibuat otomatis, tidak di-commit)
│  ├─ .env.example        # contoh konfigurasi backend
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ components/      # komponen UI
│  │  ├─ context/         # Auth & Toast provider
│  │  ├─ hooks/           # hook data API
│  │  ├─ lib/             # axios, validasi, util
│  │  ├─ pages/           # halaman aplikasi
│  │  └─ types/           # tipe data frontend
│  ├─ tests/              # pengujian frontend
│  ├─ .env.example        # contoh konfigurasi frontend
│  └─ package.json
├─ db/
│  ├─ 01-add-image-columns.sql
│  └─ 02-seed-images.sql
└─ README.md
```

## Prasyarat

Pastikan perangkat sudah memiliki:

1. **Node.js 22 atau lebih baru** dan npm.
   ```powershell
   node --version
   npm --version
   ```
2. **Microsoft SQL Server** (LocalDB, Express, atau Developer Edition) yang berjalan di `localhost:1433` atau instance lain yang dapat diakses.
3. **SQL Server Management Studio (SSMS)** atau `sqlcmd` untuk menjalankan skrip SQL.
4. **Git** untuk meng-clone repositori.

Contoh memeriksa koneksi SQL Server dengan `sqlcmd`:

```powershell
sqlcmd -S localhost,1433 -U <nama-user-database> -C -Q "SELECT @@VERSION"
```

> `-P` sengaja tidak dipakai agar password diminta secara interaktif dan tidak tersimpan di riwayat perintah. Ganti `<nama-user-database>` dengan user milikmu.

## Instalasi

```powershell
git clone https://github.com/NaufalMagomedov/Tugas-4---Frontend-React-Integrasi-Backend.git
cd "Tugas-4---Frontend-React-Integrasi-Backend\tugas 4 frontend react dan integrasi backend"

# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

Jika `package-lock.json` tersedia dan ingin instalasi yang reprodusibel, gunakan `npm ci`.

## Konfigurasi Environment

Aplikasi membaca konfigurasi dari file `.env`. File contoh **`.env.example`** sudah disediakan dan **hanya berisi placeholder** — file inilah yang menjelaskan variabel yang dibutuhkan. Nilai rahasia (password database, `JWT_SECRET`) tidak boleh ditulis di README, `.env.example`, atau di-commit ke Git.

Salin file contoh terlebih dahulu:

```powershell
# Dari root proyek
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Pada macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Environment Backend (`backend/.env`)

| Variabel | Contoh (bukan rahasia) | Keterangan |
|---|---|---|
| `NODE_ENV` | `development` | Mode aplikasi. Gunakan `production` saat deploy. |
| `PORT` | `3000` | Port HTTP backend. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin frontend yang diizinkan. Harus sama persis (skema + host + port). |
| `DB_SERVER` | `localhost` | Host SQL Server. |
| `DB_PORT` | `1433` | Port SQL Server. |
| `DB_USER` | `<nama-user-database>` | User database. Isi dengan user yang kamu buat. |
| `DB_PASSWORD` | `<password-database-lokal>` | **Rahasia.** Isi hanya di `.env` lokal. |
| `DB_NAME` | `review_kantin` | Nama database. |
| `DB_ENCRYPT` | `false` | `true` jika koneksi wajib terenkripsi. |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | `true` untuk sertifikat self-signed di SQL Server lokal. |
| `JWT_SECRET` | `<string-acak-minimal-32-karakter>` | **Rahasia.** Penanda tangan token JWT (HS256), minimal 32 karakter. |
| `JWT_EXPIRES_IN` | `2h` | Masa berlaku token. |
| `AUTH_COOKIE_NAME` | `kantin_session_ho3` | Nama cookie sesi `httpOnly`. |
| `BCRYPT_SALT_ROUNDS` | `10` | Biaya hashing password. Naikkan (mis. 12) di produksi. |

Membuat nilai acak untuk `JWT_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Salin hasilnya ke `JWT_SECRET` di `backend/.env`. Jangan gunakan nilai contoh atau nilai yang pernah dibagikan.

### Environment Frontend (`frontend/.env`)

| Variabel | Contoh | Keterangan |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | URL dasar API backend, termasuk prefix `/api/v1`. |

Catatan:

- Restart `npm run dev` setelah mengubah `.env` karena Vite membaca environment saat start.
- `CORS_ORIGIN` di backend dan URL frontend harus konsisten. Jika frontend dibuka lewat `http://127.0.0.1:5173`, ubah `CORS_ORIGIN` ke origin tersebut.
- Autentikasi memakai cookie lintas origin. Frontend sudah memakai `withCredentials: true` dan backend mengirim `Access-Control-Allow-Credentials: true`, jadi jangan mengganti `CORS_ORIGIN` menjadi `*`.

## Menyiapkan Database

Database yang dipakai bernama `review_kantin`. Skema dan data awal mengikuti modul praktikum; folder `db/` pada proyek ini berisi skrip tambahan untuk kolom gambar dan seed URL gambar.

> **Catatan:** skrip pembuatan database/user, skema, dan seed utama (`00`–`03`) berada di folder `db/` pada workspace praktikum (di luar repositori ini). Jika kamu hanya meng-clone repositori, gunakan berkas SQL dari materi praktikum atau minta berkas tersebut kepada pengajar. Jangan membuat skrip sendiri yang berisi password asli lalu meng-commit-nya.

Urutan yang dianjurkan (jalankan dari root proyek, ganti `<nama-user-database>`):

1. **(Opsional)** Aktifkan mode autentikasi SQL Server + Windows (mixed mode):

   ```powershell
   sqlcmd -S localhost,1433 -E -i "..\..\db\00-setup-mixed-mode.sql"
   ```

   Setelah mengubah mode autentikasi, restart layanan SQL Server.

2. **Buat database dan user aplikasi.** Buka `..\..\db\01-create-database-and-user.sql`, ganti password di dalam skrip dengan password lokal pilihanmu, lalu jalankan:

   ```powershell
   sqlcmd -S localhost,1433 -E -i "..\..\db\01-create-database-and-user.sql"
   ```

   Simpan password tersebut hanya di `backend/.env` (`DB_PASSWORD`). Jangan meng-commit skrip yang sudah diisi password asli.

3. **Buat tabel:**

   ```powershell
   sqlcmd -S localhost,1433 -U <nama-user-database> -d review_kantin -C -i "..\..\db\02-schema.sql"
   ```

4. **Isi data awal:**

   ```powershell
   sqlcmd -S localhost,1433 -U <nama-user-database> -d review_kantin -C -i "..\..\db\03-seed.sql"
   ```

5. **Tambahkan kolom gambar dan seed URL gambar** (dari folder `db/` proyek ini):

   ```powershell
   sqlcmd -S localhost,1433 -U <nama-user-database> -d review_kantin -C -i "db\01-add-image-columns.sql"
   sqlcmd -S localhost,1433 -U <nama-user-database> -d review_kantin -C -i "db\02-seed-images.sql"
   ```

6. **Verifikasi** bahwa tabel dan kolom gambar sudah ada:

   ```powershell
   sqlcmd -S localhost,1433 -U <nama-user-database> -d review_kantin -C -Q "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'image_url'"
   ```

## Menjalankan Aplikasi

Gunakan dua terminal terpisah.

**Terminal 1 — backend:**

```powershell
cd backend
npm run dev
```

Perintah lain yang tersedia:

- `npm start` — menjalankan server tanpa watch mode.
- `npm run typecheck` — memeriksa tipe TypeScript.
- `npm test` — menjalankan pengujian backend.

Backend berjalan di `http://localhost:3000`:

| URL | Fungsi |
|---|---|
| `http://localhost:3000/health` | Health check server + database |
| `http://localhost:3000/docs` | Swagger UI |
| `http://localhost:3000/docs/swagger.json` | Spesifikasi OpenAPI mentah |
| `http://localhost:3000/api/v1` | Prefix seluruh endpoint API |
| `http://localhost:3000/uploads/...` | File gambar unggahan |

**Terminal 2 — frontend:**

```powershell
cd frontend
npm run dev
```

Buka `http://localhost:5173`. Vite dikonfigurasi dengan `strictPort: true`, sehingga proses akan gagal jika port 5173 sedang dipakai — hentikan proses lain atau sesuaikan konfigurasi port sekaligus `CORS_ORIGIN`.

Untuk memeriksa hasil build produksi frontend:

```powershell
cd frontend
npm run build
npm run preview
```

## Akun dan Peran

Registrasi mandiri melalui `/register` selalu menghasilkan peran `customer`; peran tidak dapat dikirim dari client. Untuk menguji fitur owner/admin, daftarkan akun terlebih dahulu, lalu ubah perannya langsung di database:

```sql
UPDATE dbo.USERS SET role = 'owner'  WHERE email = 'email-owner@contoh.test';
UPDATE dbo.USERS SET role = 'admin'  WHERE email = 'email-admin@contoh.test';
```

Email akun demo yang disediakan oleh seed data:

| Peran | Email |
|---|---|
| Admin | `admin@kantin.test` |
| Owner | `tini@kantin.test` |
| Owner lain | `inah@kantin.test` |
| Customer | `bagas@student.test` |

> **Password akun demo tidak disertakan di repositori ini.** Seed data memakai `password_hash` placeholder, sehingga akun tersebut belum bisa dipakai login sampai hash-nya diisi. Cara termudah: daftar akun baru lewat `/register` (password minimal 8 karakter, mengandung huruf dan angka), lalu ubah `role` lewat SQL di atas. Jangan menuliskan password akun uji di README, skrip, atau file yang di-commit.

Aturan password saat registrasi: 8–72 karakter, mengandung minimal satu huruf dan satu angka.

## Endpoint API

Semua endpoint memakai prefix `/api/v1`.

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `POST` | `/auth/register` | Publik | Registrasi akun (selalu `customer`). |
| `POST` | `/auth/login` | Publik | Login dan membuat cookie sesi. |
| `POST` | `/auth/logout` | Publik | Menghapus cookie sesi. |
| `GET` | `/auth/me` | Login | Data user dari sesi. |
| `GET` | `/auth/profile` | Login | Data profil terbaru dari database. |
| `GET` | `/stalls` | Publik | Daftar warung (pagination, pencarian, kategori). |
| `GET` | `/stalls/categories` | Publik | Daftar kategori. |
| `GET` | `/stalls/mine` | Owner | Warung milik owner yang login. |
| `GET` | `/stalls/:id` | Publik | Detail warung. |
| `GET` | `/stalls/:id/menus` | Publik | Menu warung. |
| `GET` | `/stalls/:id/reviews` | Publik | Review warung. |
| `POST` | `/stalls` | Owner, Admin | Membuat warung. |
| `PUT` | `/stalls/:id` | Owner (miliknya), Admin | Mengubah warung. |
| `DELETE` | `/stalls/:id` | Owner (miliknya), Admin | Menghapus warung. |
| `POST` | `/stalls/:id/menus` | Owner (miliknya), Admin | Menambah menu. |
| `PUT` | `/menus/:id` | Owner (miliknya), Admin | Mengubah menu. |
| `DELETE` | `/menus/:id` | Owner (miliknya), Admin | Menghapus menu. |
| `POST` | `/stalls/:id/reviews` | Login | Menulis review. |
| `DELETE` | `/reviews/:id` | Pemilik review, Admin | Menghapus review. |
| `POST` | `/uploads` | Owner, Admin | Unggah gambar (body biner + `Content-Type: image/*`). |
| `GET` | `/admin/reports` | Admin | Ringkasan laporan. |

Endpoint bantu `POST /dev/force-error` dan `GET /dev/slow` hanya aktif saat `NODE_ENV` bukan `production`.

## Pengujian dan Build

```powershell
# Backend
cd backend
npm run typecheck
npm test

# Frontend
cd ..\frontend
npm run lint
npm test
npm run build
```

Pengujian backend menggunakan `node:test` dan tidak membutuhkan database aktif. Pengujian frontend memeriksa utilitas validasi/form.

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `Environment variable JWT_SECRET belum diisi` | `.env` belum dibuat atau `JWT_SECRET` kosong | Salin `.env.example` menjadi `.env`, isi `JWT_SECRET` acak minimal 32 karakter. |
| `Gagal terhubung ke database` / health check 500 | SQL Server mati, port salah, atau kredensial salah | Cek `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; pastikan SQL Server berjalan dan autentikasi SQL diaktifkan. |
| Login berhasil tetapi request berikutnya 401 | Cookie diblokir atau origin berbeda | Buka frontend lewat `http://localhost:5173` (bukan `127.0.0.1`), samakan `CORS_ORIGIN`, dan pastikan browser mengizinkan cookie. |
| `403 ORIGIN_FORBIDDEN` saat memakai `curl` | Header `Origin` tidak cocok dengan `CORS_ORIGIN` | Kirim `-H "Origin: http://localhost:5173"` atau hilangkan header `Origin` untuk klien non-browser. |
| Frontend gagal start: port 5173 dipakai | `strictPort: true` | Hentikan proses yang memakai port tersebut. |
| Gambar unggahan tidak tampil | Folder `backend/uploads/` belum ada atau backend tidak berjalan | Folder dibuat otomatis saat unggah pertama; pastikan backend aktif dan buka lewat URL `/uploads/...`. |
| `409 STALL_HAS_RELATIONS` saat hapus warung | Warung masih memiliki menu/review | Hapus menu/review terkait atau gunakan warung uji baru. |

## Keamanan dan Data Sensitif

Repositori ini bersifat publik. Aturan yang wajib dijaga:

- **Jangan pernah meng-commit** `backend/.env` atau `frontend/.env`. Keduanya sudah tercantum di `.gitignore`.
- **`.env.example` hanya berisi placeholder**, bukan password atau secret asli. Gunakan file itu sebagai dokumentasi variabel yang dibutuhkan.
- **Jangan menulis password database, `JWT_SECRET`, atau password akun uji** di README, komentar kode, skrip pengujian, log, atau screenshot yang diunggah.
- Jika secret atau password pernah ter-commit, anggap sudah bocor: segera ganti password database dan buat `JWT_SECRET` baru, lalu bersihkan riwayat Git.
- Untuk produksi: set `NODE_ENV=production`, gunakan HTTPS (cookie `secure` hanya aktif di produksi), set `DB_ENCRYPT=true` bila server database mendukung, dan naikkan `BCRYPT_SALT_ROUNDS`.
- Folder `uploads/`, `dist/`, dan `node_modules/` tidak di-commit. File gambar unggahan disajikan sebagai file statis dengan nama acak.

---

Dibuat untuk Tugas 4 — Frontend React dan Integrasi Backend.
