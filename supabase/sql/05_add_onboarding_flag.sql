-- ============================================================
--  ONBOARDING FLAG — tur dashboard guru (Bab 7)
-- ============================================================
-- Menandai apakah guru sudah pernah menyelesaikan tur interaktif
-- yang memetakan alur kerja: profil siswa -> materi -> review ->
-- terbitkan -> QR -> progres.
-- ============================================================

alter table profiles
  add column if not exists onboarding_completed boolean not null default false;

comment on column profiles.onboarding_completed is
  'true setelah guru menutup tur dashboard (selesai atau dilewati)';