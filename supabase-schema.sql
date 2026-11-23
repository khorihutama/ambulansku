-- Run this in Supabase SQL Editor

-- ============================================
-- PENILAIAN (Judging) TABLE
-- ============================================

create table penilaian (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  gender text not null check (gender in ('L', 'P', 'O')), -- O = Tidak ingin menyebutkan
  stars integer not null check (stars >= 1 and stars <= 5),
  liked text not null,
  disliked text,
  created_at timestamp with time zone default now()
);

-- Enable RLS; anon may insert, reads go through the service role.
alter table penilaian enable row level security;

create policy "Anyone can insert penilaian"
  on penilaian for insert
  with check (true);

-- No public read policy: penilaian rows are not readable with the anon key.
-- Data is kept; export uses SUPABASE_SERVICE_ROLE_KEY (GET /api/penilaian).

-- ============================================
-- FEEDBACK (anonymous, insert-only)
-- ============================================

create table feedback (
  id uuid default gen_random_uuid() primary key,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamp with time zone default now()
);

alter table feedback enable row level security;

create policy "Anyone can insert feedback"
  on feedback for insert
  with check (true);

-- No select policy for anon: feedback cannot be read with the anon key.
-- The legacy penilaian table above keeps its insert policy but no longer has
-- a public select policy. Neither table is dropped or has data deleted.