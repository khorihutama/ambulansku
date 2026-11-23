# 🚀 Deploy AmbulansKu ke Render

> **Status host: belum dikonfirmasi di repo.** Panduan ini menyebut Render,
> sedangkan riwayat deployment GitHub mencatat Railway (`railway-app[bot]`).
> Repo tidak memiliki workflow deploy; deploy dilakukan manual. Verifikasi host
> yang benar sebelum mengikuti langkah di bawah.

## Prerequisites

- [Render](https://render.com) account
- GitHub repository dengan kode AmbulansKu
- API keys: OpenRouter, Google Maps, Supabase

---

## Step 1: Push ke GitHub

```bash
# Inisialisasi repo (jika belum)
git init
git add .
git commit -m "feat: initial commit — AmbulansKu v0.1.0"

# Push ke GitHub
git remote add origin https://github.com/your-username/ambulansku.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Web Service di Render

1. Buka [dashboard.render.com](https://dashboard.render.com)
2. Klik **"New +"** → **"Web Service"**
3. Pilih **"Build and deploy from a Git repository"**
4. Connect GitHub repository `ambulansku`
5. Atau: tekan **"Deploy an existing image from a registry"** jika pakai Docker

### Configuration

| Field | Value |
|-------|-------|
| **Name** | `ambulansku` |
| **Region** | Singapore (terdekat untuk Indonesia) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (atau Starter $7/bulan untuk no cold start) |

---

## Step 3: Set Environment Variables

Di Render dashboard → **Environment** → tambah:

```
NODE_ENV=production

OPENROUTER_API_KEY=sk-or-v1-xxxxx
AI_MODEL=openai/gpt-4o-mini
AI_BASE_URL=https://openrouter.ai/api/v1
AI_TIMEOUT_MS=20000

GOOGLE_MAPS_API_KEY=AIzaSyxxxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyxxxxx
PLACES_TIMEOUT_MS=8000

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOixxxxx
SUPABASE_SERVICE_ROLE_KEY=<server-only-opsional>

FEEDBACK_ENABLED=true
FEEDBACK_DEV_KEY=<random-string>
PENILAIAN_ENABLED=true
PENILAIAN_DEV_KEY=<random-string>

TRIAGE_SESSION_SECRET=<minimal-32-karakter>
TRUSTED_PROXY_HOPS=1
TRIAGE_GLOBAL_MAX=60
```

`FEEDBACK_ENABLED`/`FEEDBACK_DEV_KEY` menang atas `PENILAIAN_ENABLED`/`PENILAIAN_DEV_KEY`; nilai lama hanya fallback saat nilai baru belum di-set. `SUPABASE_SERVICE_ROLE_KEY` opsional dan diperlukan untuk ekspor `GET /api/feedback` dan `GET /api/penilaian`; simpan server-side.

> **Penting:** `NEXT_PUBLIC_*` variables harus diset sebelum build karena di-bake ke client bundle. Jika diubah, harus manual deploy ulang.

---

## Step 4: Database Setup (Supabase)

1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**
3. Copy-paste seluruh isi `supabase-schema.sql`
4. Klik **Run**
5. Copy Project URL dan anon key ke env vars di Render

---

## Step 5: Custom Domain (Opsional)

Di Render dashboard → **Settings** → **Custom Domain**:

### Domain Recommendations

| Domain | Ketersediaan | Catatan |
|--------|-------------|---------|
| `ambulansku.id` | Perlu cek `.id` registry | Paling ideal — TLD Indonesia |
| `ambulansku.com` | Perlu cek | Umum, mudah diingat |
| `ambulansku.app` | Perlu cek | Singkat, modern |
| `ambulansku.co.id` | Perlu cek | Formal, cocok untuk organisasi |
| `carimedis.id` | Perlu cek | Alternatif — "cari medis" |
| `darurat.id` | Perlu cek | Pendek, mudah diingat |
| `ambulans.ku` | Perlu cek | Play on "ambulansku" |
| `sehatcepat.id` | Perlu cek | Alternatif — "sehat cepat" |
| `medisnear.id` | Perlu cek | English-Indo hybrid |
| `118help.id` | Perlu cek | Angka mudah diingat |

### Setup Custom Domain di Render

```bash
# 1. Di Render dashboard, add custom domain
# 2. Di DNS provider kamu, tambah:
#    CNAME record: ambulansku -> ambulansku.onrender.com
#    (atau sesuai instruction dari Render)

# 3. Tunggu SSL provisioning (otomatis, ~5 menit)
# 4. Update NEXT_PUBLIC Site URL jika perlu
```

---

## Step 6: Verify Deployment

```bash
# Test health
curl https://ambulansku.onrender.com

# Test API: token sesi dulu, lalu triage
TOKEN=$(curl -s -X POST https://ambulansku.onrender.com/api/triage/token | node -pe 'JSON.parse(fs.readFileSync(0)).token')

curl -X POST https://ambulansku.onrender.com/api/triage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"situation":"kecelakaan","lat":-6.2,"lng":106.8}'
```

---

## Troubleshooting

### Build fails: "Invalid supabaseUrl"
- Pastikan `NEXT_PUBLIC_SUPABASE_URL` dimulai dengan `https://`
- Jika tidak pakai Supabase, hapus env vars ini — app akan skip DB query

### Google Maps blank
- Pastikan `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` benar
- Jika masi blank, cek API restrictions di Google Cloud Console
- Enable: Maps JavaScript API + Places API + Geocoding API

### AI triage returns error
- Cek `OPENROUTER_API_KEY` valid
- Cek `AI_MODEL` tersedia di provider yang dipakai
- Cek logs di dashboard host

### Cold start lag (~30s)
- Free plan memiliki cold start. Upgrade ke Starter ($7/bulan) untuk always-on
- Atau pakai cron job ping setiap 5 menit:

```bash
# Di https://cron-job.org atau similar
*/5 * * * * curl -s https://ambulansku.onrender.com > /dev/null
```

---

## Deploy Manual

Repo ini tidak memiliki workflow deploy; CI hanya menjalankan `tsc`, lint, build, dan test. Deploy dilakukan manual dari dashboard host atau CLI yang dipakai. Jika integrasi auto-deploy di dashboard diaktifkan, push ke `main` dapat memicu deploy, tetapi status itu tidak dikonfigurasi di repo.

Untuk memicu build ulang di host yang mendukung auto-deploy, push commit baru ke `main`:

```bash
git commit --allow-empty -m "chore: trigger rebuild"
git push
```

---

## Useful Commands

```bash
# Local dev
npm run dev

# Build check
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```