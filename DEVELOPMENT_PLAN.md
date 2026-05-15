# 🚑 AmbulansKu — Development Plan

> AI-powered ambulance & medical transport finder untuk Indonesia
> Stack: Next.js 14 + Tailwind CSS + Vercel AI SDK (OpenRouter) + Google Places API + Supabase
> PWA-ready — installable, offline-capable, mobile-first

---

## 🔄 Arsitektur AI: Provider-Agnostic

| Aspek | Prompt Asli | Plan Baru |
|-------|-------------|-----------|
| AI Provider | `@anthropic-ai/sdk` (lock-in) | Vercel AI SDK (`ai` + `@ai-sdk/openai`) via OpenRouter |
| Model | `claude-sonnet-4-20250514` | Konfigurabel via env vars |
| Env Var | `ANTHROPIC_API_KEY` | `OPENROUTER_API_KEY` + `AI_MODEL` + `AI_BASE_URL` |
| Triage Logic | Claude-specific prompt | Provider-agnostic `generateObject()` dengan Zod schema |

### Provider Switch Guide

| Provider | `AI_BASE_URL` | `AI_MODEL` | API Key |
|----------|---------------|-------------|---------|
| OpenRouter (default) | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` | `OPENROUTER_API_KEY` |
| OpenRouter + Claude | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4-20250514` | `OPENROUTER_API_KEY` |
| OpenRouter + DeepSeek | `https://openrouter.ai/api/v1` | `deepseek/deepseek-chat-v3-0324` | `OPENROUTER_API_KEY` |
| OpenAI langsung | `https://api.openai.com/v1` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| Local (Ollama) | `http://localhost:11434/v1` | `llama3` | _(tidak perlu)_ |

**Zero code changes** — semua via environment variables.

---

## 📁 Project Structure

```
ambulansku/
├── app/
│   ├── layout.tsx                    # Root layout + fonts + PWA meta
│   ├── page.tsx                      # Landing + triage input
│   ├── globals.css                   # Design tokens + Tailwind + safe-area
│   ├── hasil/
│   │   └── page.tsx                  # Search results + map
│   └── api/
│       ├── triage/
│       │   └── route.ts              # AI triage endpoint (OpenRouter)
│       └── facilities/
│           └── route.ts              # Google Places + Supabase query
├── components/
│   ├── TriageInput.tsx               # Free text + quick select
│   ├── FacilityCard.tsx              # Result card
│   ├── MapView.tsx                   # Google Maps display
│   ├── UrgencyBadge.tsx              # Darurat / Terjadwal badge
│   ├── CallButton.tsx                # One-tap tel: link
│   └── QuickSelect.tsx               # Situasi cepat buttons
├── lib/
│   ├── ai.ts                        # Vercel AI SDK + OpenRouter client
│   ├── places.ts                    # Google Places helper
│   └── supabase.ts                  # Supabase client
├── types/
│   ├── index.ts                      # TypeScript types
│   └── google-maps.d.ts             # Google Maps window type
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   └── icons/                        # PWA icons (72-512px)
└── .env.local                        # Environment variables
```

---

## 🔑 Environment Variables

```env
# AI - OpenRouter (supports multiple providers)
OPENROUTER_API_KEY=your_openrouter_key
AI_MODEL=openai/gpt-4o-mini
AI_BASE_URL=https://openrouter.ai/api/v1

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄️ Database Schema (Supabase)

```sql
-- Run in Supabase SQL editor
create table facilities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('RS', 'Puskesmas', 'PMI', 'Klinik', 'BPBD')),
  lat double precision not null,
  lng double precision not null,
  phone text,
  address text,
  operating_hours text,
  services text[] default '{}',
  source text default 'google',
  created_at timestamp with time zone default now()
);

create extension if not exists postgis;
alter table facilities add column location geography(Point, 4326);
update facilities set location = st_makepoint(lng, lat)::geography;
create index facilities_location_idx on facilities using gist(location);

-- RPC for nearby search
create or replace function nearby_facilities(
  lat double precision,
  lng double precision,
  radius_m integer default 10000
)
returns table (
  id uuid, name text, type text, lat double precision,
  lng double precision, phone text, address text,
  operating_hours text, services text[], source text,
  distance_m double precision
)
language sql stable
as $$
  select
    id, name, type, lat, lng, phone, address,
    operating_hours, services, source,
    st_distance(location, st_makepoint(lng, lat)::geography) as distance_m
  from facilities
  where st_dwithin(location, st_makepoint(lng, lat)::geography, radius_m)
  order by distance_m asc;
$$;
```

---

## 🏗️ Fase 0: Project Scaffolding

| # | Task | Command / Detail |
|---|------|-------------------|
| 0.1 | Init Next.js 14 | `npx create-next-app@latest . --typescript --tailwind --eslint --app --import-alias "@/*"` |
| 0.2 | Init shadcn/ui | `npx shadcn@latest init` — New York style |
| 0.3 | Install core deps | `npm install ai @ai-sdk/openai @supabase/supabase-js zod` |
| 0.4 | Install shadcn components | `npx shadcn@latest add button card badge textarea` |
| 0.5 | Create `.env.local` | All env vars |
| 0.6 | Setup Tailwind theme | Design tokens (emergency-red, navy-dark, etc.) + font vars |
| 0.7 | Setup fonts | Plus Jakarta Sans + DM Sans via `next/font/google` |

---

## 🏗️ Fase 1: Types & Lib Layer

| # | File | Task |
|---|------|------|
| 1.1 | `types/index.ts` | Define `TriageResult`, `NearbyFacility`, `FacilityCardProps`, `MapViewProps`, `QuickSituation` |
| 1.2 | `lib/supabase.ts` | Init `createClient` with env vars |
| 1.3 | `lib/ai.ts` | Vercel AI SDK + OpenRouter — `generateObject()` with Zod schema, provider-agnostic |
| 1.4 | `lib/places.ts` | `getNearbyFacilities()` — Google Places Nearby Search, dedup, sort by distance |

---

## 🏗️ Fase 2: Database (Supabase)

| # | Task | Detail |
|---|------|--------|
| 2.1 | Create `facilities` table | SQL sesuai schema |
| 2.2 | Enable PostGIS + RPC | `nearby_facilities()` function |
| 2.3 | Seed data | 10-15 sample facilities di Jakarta |

---

## 🏗️ Fase 3: API Routes

| # | File | Detail |
|---|------|--------|
| 3.1 | `app/api/triage/route.ts` | POST: `{situation, lat, lng}` → `generateTriage()` → `getNearbyFacilities()` → `{triage, facilities}` |
| 3.2 | `app/api/facilities/route.ts` | GET: `?lat=&lng=&type=` → Supabase RPC `nearby_facilities()` |

### Triage API Flow

```
User Input (situation + coordinates)
       │
       ▼
┌──────────────────┐
│  POST /api/triage │
└──────────────────┘
       │
       ▼
  generateTriage()          ← Vercel AI SDK + OpenRouter
  (urgency, keywords, etc.)
       │
       ▼
  getNearbyFacilities()     ← Google Places API
       │
       ▼
  supabase.rpc()            ← PostGIS fallback (merge/dedup)
       │
       ▼
  Response { triage, facilities }
```

---

## 🏗️ Fase 4: UI Components

| # | Component | Detail |
|---|-----------|--------|
| 4.1 | `QuickSelect.tsx` | 6 situasi buttons |
| 4.2 | `TriageInput.tsx` | Textarea + Cari Sekarang button |
| 4.3 | `UrgencyBadge.tsx` | 🔴 DARURAT / 🟡 TERJADWAL |
| 4.4 | `FacilityCard.tsx` | Rank, nama, alamat, status, jarak, Telepon + Maps |
| 4.5 | `CallButton.tsx` | Reusable `tel:` link button |
| 4.6 | `MapView.tsx` | Google Maps with user + facility markers, dark style |

---

## 🏗️ Fase 5: Pages

| # | File | Detail |
|---|------|--------|
| 5.1 | `app/layout.tsx` | Font vars, `<html lang="id">`, Google Maps script |
| 5.2 | `app/globals.css` | CSS custom properties (design tokens) |
| 5.3 | `app/page.tsx` | Landing: header, TriageInput, QuickSelect, footer 119 |
| 5.4 | `app/hasil/page.tsx` | Results: Suspense, UrgencyBadge, AI msg, MapView, FacilityCards |

---

## 🏗️ Fase 6: Polish & Edge Cases

| # | Task | Detail |
|---|------|--------|
| 6.1 | Loading states | Animated pulse saat fetching |
| 6.2 | Error handling | Try-catch + UI fallback |
| 6.3 | Geolocation denied | Manual kota/alamat input |
| 6.4 | Empty results | UI state untuk no results |
| 6.5 | Mobile responsive | Viewport 320-428px test |
| 6.6 | UrgencyBadge animation | CSS pulse untuk emergency |
| 6.7 | Share link | Copy URL button di hasil |
| 6.8 | 119 sticky CTA | Floating emergency button |

---

## 🏗️ Fase 7: Testing & Deploy

| # | Task | Detail |
|---|------|--------|
| 7.1 | `npx tsc --noEmit` | Zero TS errors |
| 7.2 | `npm run lint` | Zero warnings |
| 7.3 | Manual E2E | Landing → Quick Select → Results → Call |
| 7.4 | Edge case test | Location denied, empty, AI fallback |
| 7.5 | Deploy Vercel | `vercel deploy` atau GitHub integration |
| 7.6 | Demo prep | Kecelakaan→DARURAT, Cuci Darah→TERJADWAL |

---

## 📊 Dependency Graph

```
Fase 0 → Fase 1 → Fase 3 (API) → Fase 5 (Pages)
              │                          ↑
              └→ Fase 2 (DB)             │
                              │
         Fase 4 (Components) ─┘

         Fase 6 (Polish) → Fase 7 (Deploy)
```

**Urutan ideal:** 0 → 1 → 2 → (3 ‖ 4) → 5 → 6 → 7

---

## ⏱️ Estimated Timeline

| Fase | Waktu |
|------|-------|
| 0. Scaffolding | ~15 min |
| 1. Types & Lib | ~30 min |
| 2. Database | ~20 min |
| 3. API Routes | ~25 min |
| 4. Components | ~45 min |
| 5. Pages | ~30 min |
| 6. Polish | ~30 min |
| 7. Deploy | ~15 min |
| **Total** | **~3 jam** |