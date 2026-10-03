-- =========================================================
-- Fitra: private storage buckets (PRD Bab 10)
-- Aset privat diakses lewat signed URL atau lewat server, tidak pernah publik.
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('materials',      'materials',      false, 20971520, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('student-photos', 'student-photos', false, 5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('ppi-exports',    'ppi-exports',    false, 10485760, array['application/pdf']),
  ('visual-assets',  'visual-assets',  false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Verifikasi cepat dari psql:
--   select id, public from storage.buckets order by 1;