-- Ganti nama skill sekaligus di daftar skill, entri, dan proyek, dalam SATU transaksi:
-- semuanya berubah, atau tidak ada yang berubah. Jalankan sekali di Supabase SQL Editor.
-- Aman dijalankan ulang.

create or replace function public.rename_skill(skill_id uuid, new_name text)
returns void
language plpgsql
security invoker            -- berjalan dengan hak si pemanggil, jadi RLS tetap berlaku
set search_path = public
as $$
declare
  old_name text;
begin
  new_name := btrim(new_name);
  if new_name = '' then
    raise exception 'Skill name is empty';
  end if;

  select name into old_name from public.skills where id = skill_id;
  if old_name is null then
    raise exception 'Skill not found';  -- juga terjadi kalau pemanggil bukan pemilik
  end if;

  update public.skills   set name = new_name where id = skill_id;  -- nama kembar -> error 23505
  update public.entries  set skills = array_replace(skills, old_name, new_name) where old_name = any(skills);
  update public.projects set skill = new_name where skill = old_name;
end;
$$;

-- Hanya akun yang login yang boleh memanggil.
revoke execute on function public.rename_skill(uuid, text) from public, anon;
grant execute on function public.rename_skill(uuid, text) to authenticated;
