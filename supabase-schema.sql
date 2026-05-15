-- Run this in Supabase SQL Editor

-- 1. Create facilities table
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
  source text default 'manual',
  created_at timestamp with time zone default now()
);

-- 2. Enable PostGIS
create extension if not exists postgis;

-- 3. Add geography column
alter table facilities add column location geography(Point, 4326);
update facilities set location = st_makepoint(lng, lat)::geography;

-- 4. Create gist index for fast geo search
create index facilities_location_idx on facilities using gist(location);

-- 5. Create RPC function for nearby search
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

-- 6. Seed data (Jakarta area)
insert into facilities (name, type, lat, lng, phone, address, operating_hours, services) values
  ('RS Cipto Mangunkusumo', 'RS', -6.1900, 106.8460, '021-31930118', 'Jl. Diponegoro No.71, Jakarta Pusat', '24 Jam', ARRAY['IGD', 'ICU', 'Pediatric', 'Cardiology']),
  ('RS Tarakan', 'RS', -6.1850, 106.8350, '021-3456789', 'Jl. Tarakan No.1, Jakarta Pusat', '24 Jam', ARRAY['IGD', 'ICU']),
  ('PMI Cabang Jakarta Selatan', 'PMI', -6.2480, 106.8430, '021-7654321', 'Jl. MT Haryono, Jakarta Selatan', '08.00-16.00', ARRAY['Ambulans', 'Darah']),
  ('Puskesmas Kebon Sirih', 'Puskesmas', -6.1810, 106.8370, '021-3456788', 'Jl. Kebon Sirih, Jakarta Pusat', '08.00-14.00', ARRAY['UGD', 'Poli Umum']),
  ('RS Pondok Indah', 'RS', -6.2610, 106.7840, '021-7658988', 'Jl. Metro Pondok Indah, Jakarta Selatan', '24 Jam', ARRAY['IGD', 'ICU', 'Hemodialisis']),
  ('Klinik Medika Utama', 'Klinik', -6.2010, 106.8520, '021-4567890', 'Jl. Sudirman, Jakarta Pusat', '08.00-20.00', ARRAY['Poli Umum', 'Cuci Darah']),
  ('BPBD Jakarta Pusat', 'BPBD', -6.1880, 106.8450, '112', 'Jl. Gambir, Jakarta Pusat', '24 Jam', ARRAY['Rescue', 'Evakuasi']),
  ('RS Gatot Soebroto', 'RS', -6.1920, 106.8420, '021-3459000', 'Jl. Abdul Rivai, Jakarta Pusat', '24 Jam', ARRAY['IGD', 'ICU', 'Bedah']),
  ('Puskesmas Menteng', 'Puskesmas', -6.1870, 106.8390, '021-3456001', 'Jl. Menteng, Jakarta Pusat', '08.00-14.00', ARRAY['UGD', 'Poli Umum', 'KIA']),
  ('PMI Cabang Jakarta Pusat', 'PMI', -6.1860, 106.8440, '021-3456002', 'Jl. Budi Utomo, Jakarta Pusat', '08.00-16.00', ARRAY['Ambulans', 'Darah', 'Pelatihan']);

-- 7. Update location column for seed data
update facilities set location = st_makepoint(lng, lat)::geography;

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