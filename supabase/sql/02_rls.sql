alter table public.profiles              enable row level security;
alter table public.students              enable row level security;
alter table public.student_profiles      enable row level security;
alter table public.classes               enable row level security;
alter table public.class_students        enable row level security;
alter table public.materials             enable row level security;
alter table public.material_adaptations  enable row level security;
alter table public.visual_assets         enable row level security;
alter table public.student_access_tokens enable row level security;
alter table public.learning_sessions     enable row level security;
alter table public.progress_records      enable row level security;
alter table public.ppi_documents         enable row level security;
alter table public.notifications         enable row level security;

-- ---------- tabel milik langsung ----------
drop policy if exists "own row" on public.profiles;
create policy "own row" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "own students" on public.students;
create policy "own students" on public.students
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "own classes" on public.classes;
create policy "own classes" on public.classes
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "own materials" on public.materials;
create policy "own materials" on public.materials
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "own ppi" on public.ppi_documents;
create policy "own ppi" on public.ppi_documents
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- tabel turunan lewat siswa ----------
drop policy if exists "students of own students" on public.student_profiles;
create policy "students of own students" on public.student_profiles
  for all to authenticated
  using (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()));

drop policy if exists "members of own students" on public.class_students;
create policy "members of own students" on public.class_students
  for all to authenticated
  using (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()));

drop policy if exists "tokens of own students" on public.student_access_tokens;
create policy "tokens of own students" on public.student_access_tokens
  for all to authenticated
  using (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()));

drop policy if exists "sessions of own students" on public.learning_sessions;
create policy "sessions of own students" on public.learning_sessions
  for all to authenticated
  using (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()));

drop policy if exists "records of own students" on public.progress_records;
create policy "records of own students" on public.progress_records
  for all to authenticated
  using (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()))
  with check (exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid()));

-- ---------- tabel turunan lewat materi ----------
drop policy if exists "adaptations of own materials" on public.material_adaptations;
create policy "adaptations of own materials" on public.material_adaptations
  for all to authenticated
  using (exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid()))
  with check (exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid()));

drop policy if exists "assets of own adaptations" on public.visual_assets;
create policy "assets of own adaptations" on public.visual_assets
  for all to authenticated
  using (exists (
    select 1 from public.material_adaptations a
    join public.materials m on m.id = a.material_id
    where a.id = material_adaptation_id and m.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.material_adaptations a
    join public.materials m on m.id = a.material_id
    where a.id = material_adaptation_id and m.teacher_id = auth.uid()
  ));

-- Verifikasi cepat dari psql:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;