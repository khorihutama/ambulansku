-- 2026-11-23: remove public read access to the legacy penilaian table.
-- Existing rows are kept; no table or data is dropped.
-- Legacy export (GET /api/penilaian) now reads with the service role.
drop policy if exists "Anyone can read penilaian" on penilaian;