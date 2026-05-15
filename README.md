[![AmbulansKu](https://img.shields.io/badge/AmbulansKu-🚑-E63946?style=for-the-badge)](#)

# 🚑 AmbulansKu

> AI-powered ambulance & medical transport finder untuk Indonesia

AmbulansKu membantu masyarakat Indonesia menemukan ambulans dan fasilitas medis terdekat dalam dua skenario: **Darurat** (kecelakaan, serangan jantung) dan **Terjadwal** (cuci darah, kontrol rutin). Menggunakan AI triage layer yang memahami bahasa Indonesia, langsung menampilkan fasilitas terdekat dengan satu ketukan telepon.

**Tanpa login. Langsung pakai. Mobile-first.**

---

## ✨ Fitur

- 🧠 **AI Triage** — Analisis situasi dalam bahasa Indonesia via OpenRouter (model-agnostic)
- 📍 **Geolocation** — Deteksi lokasi otomatis via browser
- 🗺️ **Google Maps** — Peta interaktif + marker fasilitas medis
- 📞 **One-Tap Call** — Telepon langsung ke fasilitas/faskes
- 🔴🟡 **Urgency Badge** — Klasifikasi DARURAT / TERJADWAL
- 🏥 **Google Places API** — Pencarian RS, Puskesmas, PMI, Klinik terdekat
- 📱 **PWA Ready** — Installable, offline capable, mobile-first
- 🌙 **Dark UI** — Navy dark theme, designed untuk situasi panik

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | Vercel AI SDK + OpenRouter (provider-agnostic) |
| Maps | Google Maps JavaScript API + AdvancedMarkerElement |
| Database | Supabase (PostgreSQL + PostGIS) |
| PWA | Web App Manifest + Service Worker |
| Deployment | Render |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Google Maps API Key
- OpenRouter API Key
- Supabase project (optional, untuk DB fallback)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ambulansku.git
cd ambulansku
npm install
```

### 2. Environment Variables

Copy `.env.local.example` dan isi dengan key kamu:

```bash
cp .env.local.example .env.local
```

```env
# AI - OpenRouter (supports multiple providers)
OPENROUTER_API_KEY=your_openrouter_key
AI_MODEL=openai/gpt-4o-mini
AI_BASE_URL=https://openrouter.ai/api/v1

# Google Maps (server-side for Places API)
GOOGLE_MAPS_API_KEY=your_google_maps_key
# Google Maps (client-side for Maps JS)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Optional)

Jalankan SQL di Supabase SQL Editor:

```bash
# Lihat file supabase-schema.sql untuk schema lengkap
```

### 4. Run Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Production Build

```bash
npm run build
npm start
```

---

## 🏗️ Project Structure

```
ambulansku/
├── app/
│   ├── layout.tsx              # Root layout + PWA meta
│   ├── page.tsx                # Landing + triage input
│   ├── globals.css             # Design tokens + Tailwind
│   ├── hasil/
│   │   └── page.tsx            # Search results + map
│   └── api/
│       ├── triage/route.ts     # AI triage endpoint
│       └── facilities/route.ts # Google Places + Supabase
├── components/
│   ├── TriageInput.tsx         # Free text input
│   ├── FacilityCard.tsx        # Result card
│   ├── MapView.tsx             # Google Maps (AdvancedMarker)
│   ├── UrgencyBadge.tsx        # DARURAT / TERJADWAL
│   ├── CallButton.tsx          # One-tap tel: link
│   └── QuickSelect.tsx         # Quick situation buttons
├── lib/
│   ├── ai.ts                  # Vercel AI SDK + OpenRouter
│   ├── cors.ts                # CORS helpers
│   ├── places.ts              # Google Places helper
│   └── supabase.ts            # Supabase client
├── types/
│   └── index.ts                # TypeScript types
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                  # PWA icons (72-512px)
└── supabase-schema.sql         # Database schema + seed
```

---

## 🔄 AI Provider Switch

Ganti provider AI tanpa code changes — cukup ubah `.env.local`:

| Provider | `AI_BASE_URL` | `AI_MODEL` |
|----------|---------------|-------------|
| OpenRouter (default) | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| OpenRouter + Claude | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` |
| OpenRouter + DeepSeek | `https://openrouter.ai/api/v1` | `deepseek/deepseek-chat-v3-0324` |
| OpenAI langsung | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Local (Ollama) | `http://localhost:11434/v1` | `llama3` |

---

## 🧪 Demo Script

1. Buka app di HP
2. Tap **"Kecelakaan"** dari quick select
3. App minta izin lokasi → allow
4. AI loading screen → hasil muncul
5. Tunjukkan: badge **DARURAT**, AI message, tombol 119
6. Tunjukkan 3 fasilitas terdekat dengan jarak & tombol telepon
7. Demo skenario **"Cuci Darah"** → badge berubah TERJADWAL

---

## 📄 License

MIT

---

*Built for Vibathon 2025 — Tema "Baru"*