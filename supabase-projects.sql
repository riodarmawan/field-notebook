-- Tabel proyek (katalog di halaman Home). Jalankan sekali di Supabase SQL Editor.
-- Aman dijalankan ulang.

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  no          int  not null,                 -- nomor proyek; entries.project memakai nomor ini
  name        text not null,
  about       text not null default '',
  year        text not null default '',
  skill       text not null default '',
  in_progress boolean not null default false,
  link        text not null default '',      -- link karya (demo/repo), boleh kosong
  cover       text not null default '',      -- URL gambar sampul, boleh kosong
  created_at  timestamptz not null default now()
);

create unique index if not exists projects_no_unique on public.projects (user_id, no);

alter table public.projects enable row level security;

drop policy if exists "public reads projects" on public.projects;
drop policy if exists "owner full access projects" on public.projects;

-- Katalog bersifat publik: semua orang boleh membaca.
create policy "public reads projects"
  on public.projects for select
  to anon, authenticated
  using (true);

-- Hanya pemilik baris yang boleh menulis.
create policy "owner full access projects"
  on public.projects for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
