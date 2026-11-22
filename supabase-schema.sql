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

-- Enable RLS but allow public insert and dev read
alter table penilaian enable row level security;

create policy "Anyone can insert penilaian"
  on penilaian for insert
  with check (true);

create policy "Anyone can read penilaian"
  on penilaian for select
  using (true);