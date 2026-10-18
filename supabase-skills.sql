-- Daftar skill yang bisa diisi dari layar. Jalankan sekali di Supabase SQL Editor.
-- Aman dijalankan ulang.

create table if not exists public.skills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default now()
);

-- Nama skill tidak boleh kembar (huruf besar/kecil dianggap sama).
create unique index if not exists skills_name_unique on public.skills (user_id, lower(name));

alter table public.skills enable row level security;

drop policy if exists "public reads skills" on public.skills;
drop policy if exists "owner full access skills" on public.skills;

create policy "public reads skills"
  on public.skills for select
  to anon, authenticated
  using (true);

create policy "owner full access skills"
  on public.skills for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Tabel dibiarkan kosong. Tambahkan skill Anda dari halaman Projects setelah login.
-- Entri/proyek lama yang memakai label "[Skill A]" dst. tetap tampil apa adanya.
