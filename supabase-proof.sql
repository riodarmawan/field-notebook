-- Proof of work: lampiran gambar/PDF di tiap entri. Jalankan sekali di Supabase SQL Editor.
-- Aman dijalankan ulang. JALANKAN SEBELUM mencoba menyimpan entri dengan kode terbaru.

-- Daftar URL file yang terlampir di entri.
alter table public.entries add column if not exists attachments text[] not null default '{}';

-- Bucket publik (halaman baca bersifat publik). Batas 5 MB; gambar sudah dikompres di browser.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proof', 'proof', true, 5242880, array['image/webp', 'application/pdf'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/webp', 'application/pdf'];

-- Hanya akun yang login (Anda; sign-up publik dimatikan) yang boleh unggah/hapus.
drop policy if exists "owner uploads proof" on storage.objects;
drop policy if exists "owner deletes proof" on storage.objects;

create policy "owner uploads proof"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'proof');

create policy "owner deletes proof"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'proof');
