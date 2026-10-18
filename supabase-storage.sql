-- Bucket untuk gambar sampul proyek. Jalankan sekali di Supabase SQL Editor.
-- Aman dijalankan ulang.

-- public = true: siapa pun boleh MELIHAT gambar lewat URL-nya (perlu, karena katalog publik).
-- Batas 2 MB dan hanya format gambar; di browser gambar sudah dikompres jauh di bawah itu.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- Menulis (unggah/hapus) hanya untuk akun yang login. Sign-up publik dimatikan,
-- jadi itu hanya Anda. Pengunjung tidak punya policy tulis, jadi otomatis ditolak.
drop policy if exists "owner uploads covers" on storage.objects;
drop policy if exists "owner deletes covers" on storage.objects;

create policy "owner uploads covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'covers');

create policy "owner deletes covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'covers');
