// Klien Supabase untuk browser. Situs ini statis, jadi tidak ada server:
// halaman bicara langsung ke Supabase, seperti fetch() ke API Express, tapi tanpa Express di tengah.
// Hanya publishable key yang boleh ada di sini (aman dilihat publik).
// Yang menjaga data adalah RLS + login Supabase Auth, bukan kerahasiaan key.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi");
}

export const supabase = createClient(url, key);
