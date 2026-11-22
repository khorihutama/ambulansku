# 🚑 AmbulansKu

> Pencari ambulans dan fasilitas medis terdekat untuk Indonesia.

AmbulansKu membantu pengguna menemukan ambulans dan fasilitas medis dalam dua alur: **Darurat** (mis. kecelakaan, nyeri dada) dan **Terjadwal** (mis. cuci darah, kontrol rutin). AI triage memahami situasi berbahasa Indonesia, lalu Google Places mencari fasilitas di sekitar lokasi. Nomor **119** selalu tersedia di beranda, hasil, dan halaman masukan.

> **Bukan diagnosis medis.** Untuk kondisi yang mengancam nyawa, telepon 119.

---

## ✨ Fitur

- 🧠 **Triage AI bahasa Indonesia** — memakai endpoint OpenAI-compatible (default OpenRouter). Jika AI gagal atau key kosong, aplikasi memakai fallback darurat.
- 📍 **Lokasi otomatis** — Geolocation API browser dengan state izin ditolak, lokasi tidak tersedia, dan offline.
- 🏥 **Fasilitas terdekat** — Google Places Nearby Search (radius 10 km, maksimal 5 hasil, diurutkan berdasarkan jarak, duplikat dibuang).
- 🔴🟡 **Panel urgensi** — DARURAT (merah) atau TERJADWAL (amber), dengan alasan dan disclaimer “bukan diagnosis medis”.
- 📞 **Telepon & rute** — tombol telepon ke fasilitas dan tautan rute Google Maps.
- 🆘 **119 selalu tampil** — pill 119 di beranda dan masukan, bar 119 tetap di layar hasil.
- 💬 **Feedback anonim** — rating 1–5 dan satu komentar opsional (maks 1000 karakter), tanpa nama, gender, atau kontak.
- 📱 **PWA shell** — manifest dan service worker terdaftar; halaman yang sudah pernah dibuka dapat dimuat dari cache. Triage dan data fasilitas tetap memerlukan jaringan.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16.4 (App Router), React 19 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| AI | Vercel AI SDK 6 (`ai` + `@ai-sdk/openai`) ke endpoint OpenAI-compatible |
| Maps | Google Maps JavaScript API + `AdvancedMarkerElement`, Google Places API (server) |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Validasi | Zod 4 |
| Test | Vitest 3 + Testing Library (jsdom) |
| CI | GitHub Actions (Node 24, `npm ci`) |

---

## 🚀 Menjalankan Lokal

### Prasyarat

- Node.js **20.9+** (CI memakai Node 24)
- npm
- Key OpenRouter, Google Maps, dan project Supabase (opsional; fitur terkait akan degraded tanpa key)

### 1. Install

```bash
git clone https://github.com/khorihutama/ambulansku.git
cd ambulansku
npm ci
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

Isi variabel yang dibutuhkan. Daftar lengkap ada di [Environment Variables](#-environment-variables).

### 3. Database (opsional)

Jalankan `supabase-schema.sql` di Supabase SQL Editor. Tanpa Supabase, aplikasi tetap jalan, tetapi penyimpanan feedback tidak tersedia.

### 4. Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### 5. Build & test

```bash
npm run build
npm start

npx tsc --noEmit
npm run lint
npm test
```

---

## 🔑 Environment Variables

Semua variabel dibaca dari environment oleh `lib/config.ts` dan modul terkait (`lib/cors.ts`, `lib/request-ip.ts`, `lib/session-token.ts`, `components/MapView.tsx`). `NEXT_PUBLIC_*` di-bake saat **build**, jadi mengubahnya memerlukan build/deploy ulang.

| Variabel | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `OPENROUTER_API_KEY` | Tidak | kosong | Key untuk endpoint AI. Tanpa key, triage memakai fallback darurat. Nama variabel dipakai untuk semua endpoint OpenAI-compatible. |
| `AI_BASE_URL` | Tidak | `https://openrouter.ai/api/v1` | Harus URL HTTP(S). |
| `AI_MODEL` | Tidak | `openai/gpt-4o-mini` | ID model yang didukung endpoint. |
| `AI_TIMEOUT_MS` | Tidak | `20000` | Timeout LLM. `0` atau `off` menonaktifkan. |
| `GOOGLE_MAPS_API_KEY` | Tidak | kosong | Key server untuk Places. Tanpa key, pencarian fasilitas dilewati dan hasil kosong. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Tidak | kosong | Key client untuk Maps JS. Juga dipakai server jika `GOOGLE_MAPS_API_KEY` kosong. |
| `PLACES_TIMEOUT_MS` | Tidak | `8000` | Timeout Places. `0` atau `off` menonaktifkan. |
| `NEXT_PUBLIC_SUPABASE_URL` | Untuk feedback | kosong | URL project Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Untuk feedback | kosong | Anon key. Dipakai untuk insert feedback dan pembacaan tabel legacy `penilaian`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Tidak | kosong | Server-only. Dipakai `GET /api/feedback` untuk ekspor; tanpa key ini route mengembalikan 503. Jangan pernah dikirim ke client. |
| `FEEDBACK_ENABLED` | Tidak | `false` | `true` mengaktifkan `POST /api/feedback`. Menang atas `PENILAIAN_ENABLED`. |
| `FEEDBACK_DEV_KEY` | Tidak | kosong | Bearer key untuk `GET /api/feedback`. Fallback ke `PENILAIAN_DEV_KEY`. |
| `PENILAIAN_ENABLED` | Tidak | `false` | Fallback lama untuk `FEEDBACK_ENABLED`. |
| `PENILAIAN_DEV_KEY` | Tidak | kosong | Key untuk ekspor legacy `GET /api/penilaian` dan fallback `FEEDBACK_DEV_KEY`. |
| `TRIAGE_SESSION_SECRET` | Produksi | dev secret tidak aman | Minimal 32 karakter. Tanpa nilai valid di produksi, sesi triage gagal dibuat dan `POST /api/triage/token` membalas 503. |
| `ALLOWED_ORIGINS` | Tidak | kosong | Daftar origin dipisah koma untuk CORS. Request same-origin tidak memerlukannya. |
| `TRUSTED_PROXY_HOPS` | Tidak | `1` | Jumlah proxy tepercaya di depan app (maks. 10). |
| `TRIAGE_GLOBAL_MAX` | Tidak | `60` | Budget triage global per jam. |

Urutan fallback feedback: `FEEDBACK_ENABLED` → `PENILAIAN_ENABLED`, dan `FEEDBACK_DEV_KEY` → `PENILAIAN_DEV_KEY`. Nilai `FEEDBACK_*` yang sudah di-set menang walaupun `PENILAIAN_*` juga ada.

---

## 🧭 Halaman

| Path | Isi |
|------|-----|
| `/` | Beranda: pill 119, input situasi, quick select darurat dan terjadwal, state lokasi/offline, tautan masukan. |
| `/hasil` | Hasil triage: panel urgensi, maksimal 5 fasilitas, peta (dimuat saat dibuka), state loading/error/kosong, bar 119 tetap. |
| `/feedback` | Form masukan anonim: rating 1–5, satu komentar opsional, state sukses/nonaktif, tautan 119. |
| `/penilaian` | Redirect permanen **308** ke `/feedback`. |

---

## 🔌 API Routes

Semua route API menjawab `OPTIONS` dengan **204** untuk preflight CORS. Route API memakai `Cache-Control: no-store`.

| Route | Method | Akses | Deskripsi |
|-------|--------|-------|-----------|
| `/api/triage` | `POST` | Bearer token sesi | Body `{situation, lat, lng}`. Menjalankan triage AI lalu Places. `401` tanpa sesi valid, `400` body/skema salah, `413` body > 8 KB, `429` batas tercapai, `200` `{triage, facilities}`. |
| `/api/triage` | `OPTIONS` | Publik | Preflight CORS, `204`. |
| `/api/triage/token` | `POST` | Publik, 30/jam per IP | Menerbitkan token sesi 30 menit: `{token, expiresIn}`. `429` + `Retry-After` jika batas tercapai, `503` jika secret sesi tidak siap. |
| `/api/triage/token` | `OPTIONS` | Publik | Preflight CORS, `204`. |
| `/api/feedback` | `POST` | Publik, 5/10 menit dan 20/jam per IP | Body `{rating, comment?}`; `rating` 1–5, `comment` maks 1000 karakter. Hanya kedua field itu yang dipakai; nama/gender/kontak tidak diperlukan. `404` jika feedback nonaktif, `400` body/skema salah, `429` + `Retry-After`, `200` sukses, `500` gagal simpan. |
| `/api/feedback` | `GET` | Bearer `FEEDBACK_DEV_KEY` | Ekspor feedback untuk development. `401` tanpa key, `503` jika service-role tidak dikonfigurasi, `200` array feedback. |
| `/api/feedback` | `OPTIONS` | Publik | Preflight CORS, `204`. |
| `/api/feedback/status` | `GET` | Publik | `200` `{enabled}` sesuai `FEEDBACK_ENABLED`/fallback. |
| `/api/feedback/status` | `OPTIONS` | Publik | Preflight CORS, `204`. |
| `/api/penilaian` | `POST` | Publik | **410 Gone**; body berisi arahan ke `/api/feedback`. |
| `/api/penilaian` | `GET` | Bearer `PENILAIAN_DEV_KEY` | Ekspor legacy. `?format=stats` mengembalikan statistik; default array. `401` tanpa key. |
| `/api/penilaian` | `OPTIONS` | Publik | Preflight CORS, `204`. |
| `/api/penilaian/status` | `GET` | Publik | **410 Gone**; arahan ke `/api/feedback/status`. |
| `/api/penilaian/status` | `OPTIONS` | Publik | Preflight CORS, `204`. |

### Batas permintaan

| Aksi | Batas |
|------|-------|
| Token triage | 30 per jam per IP |
| Triage per sesi | 10 per 10 menit |
| Triage per IP | 30 per 10 menit |
| Triage global | 60 per jam (dapat diubah via `TRIAGE_GLOBAL_MAX`) |
| Feedback | 5 per 10 menit dan 20 per jam per IP |

Batas disimpan di memori proses. Jika app dijalankan di beberapa instance, batas berlaku per instance.

### Contoh: triage

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/triage/token | node -pe 'JSON.parse(fs.readFileSync(0)).token')

curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"situation":"nyeri dada sejak 10 menit lalu","lat":-6.2,"lng":106.8}'
```

### Contoh: feedback

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Fasilitas terdekat muncul cepat."}'
```

---

## 🗄️ Database

`supabase-schema.sql` membuat dua tabel:

- **`feedback`** — `rating` 1–5, satu `comment` (default `''`, maks 1000 karakter), `created_at`. RLS aktif dan hanya ada policy **insert** untuk anon; tidak ada policy select, sehingga feedback tidak dapat dibaca dengan anon key. Ekspor memakai service-role. IP klien hanya dipakai di memori untuk rate limit dan tidak dikirim ke Supabase.
- **`penilaian`** — tabel legacy (nama, gender, stars, liked, disliked) yang sengaja dibiarkan apa adanya. Tabel ini masih memiliki policy select publik; jangan menganggap datanya privat. Form saat ini tidak menulis ke tabel ini.

Tidak ada operasi destruktif atau migrasi data otomatis di repo.

---

## 📱 PWA dan Offline

- `public/manifest.json` mendaftarkan nama, ikon 72–512 px, `display: standalone`, dan tema.
- `public/sw.js` didaftarkan dari beranda. Saat install, service worker menyimpan `/` dan `/hasil`; halaman same-origin yang sudah dikunjungi juga di-cache.
- Request `/api/*` tidak di-cache. Triage, pencarian fasilitas, dan pengiriman feedback tetap memerlukan jaringan; saat offline beranda menampilkan state jaringan dan 119 tetap tersedia di beranda, hasil, dan masukan.

---

## ☁️ Deployment

Repo menyediakan `render.yaml` (runtime Node, region Singapore, health check `/`, build `npm ci && npm run build`, start `npm start`).

> **Status host produksi belum dikonfirmasi di repo.** Dokumen di repo menyebut Render, sedangkan riwayat deployment GitHub mencatat Railway (`railway-app[bot]`). CI di repo hanya menjalankan cek (`tsc`, lint, build, test) dan tidak melakukan deploy; deploy dilakukan manual.

Catatan produksi:

- Set `TRIAGE_SESSION_SECRET` minimal 32 karakter.
- Set `NEXT_PUBLIC_*` sebelum build.
- `PENILAIAN_ENABLED=true` di `render.yaml` tetap mengaktifkan feedback lewat fallback selama `FEEDBACK_ENABLED` belum di-set.
- `GOOGLE_MAPS_API_KEY` dipakai server untuk Places; `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` dipakai client untuk peta.

Panduan langkah Render ada di `DEPLOY_RENDER.md`, dengan catatan status host di atas.

---

## 🏗️ Struktur Proyek

```
ambulansku/
├── app/
│   ├── page.tsx                 # Beranda + pendaftaran service worker
│   ├── hasil/page.tsx           # Hasil triage
│   ├── feedback/page.tsx        # Form masukan anonim
│   └── api/
│       ├── triage/route.ts
│       ├── triage/token/route.ts
│       ├── feedback/route.ts
│       ├── feedback/status/route.ts
│       ├── penilaian/route.ts
│       └── penilaian/status/route.ts
├── components/                  # TopBar, TriageInput, QuickSelect, FacilityCard, MapView, dll.
├── lib/                         # ai, places, config, schemas, supabase, rate-limit, session-token, cors
├── tests/                       # Vitest
├── public/                      # manifest.json, sw.js, icons
├── supabase-schema.sql
└── render.yaml
```

---

## 🧪 Testing dan CI

```bash
npx tsc --noEmit
npm run lint
npm run build
npm test
```

CI (`.github/workflows/ci.yml`) menjalankan empat langkah tersebut dengan `npm ci` pada Node 24, ditambah `npm audit` yang bersifat informasional.

---

## 📄 License

MIT — lihat `LICENSE`.