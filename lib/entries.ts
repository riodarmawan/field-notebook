// Semua urusan data entri harian ada di file ini.
//
// Situs ini statis (tidak ada server), jadi browser bicara langsung ke Supabase.
// Siapa boleh apa dijaga oleh RLS di database, bukan oleh kode ini:
//   - pengunjung: hanya membaca entri terbit + rest day
//   - Anda (login): membaca draft, menulis, mengubah, menghapus
// Halaman lain cukup memakai useEntries() dan fungsi di bagian "Simpan & baca".

import { useSyncExternalStore } from "react";
import { compressImage } from "@/lib/image";
import { supabase } from "@/lib/supabase";

export type Entry = {
  id: string;
  kind: "page" | "rest"; // halaman belajar biasa, atau hari istirahat
  page: number; // nomor halaman (hari istirahat = 0)
  date: string; // "2026-10-16"
  title: string;
  discovered: string; // baris 1: yang saya temukan
  confused: string; // baris 2: yang masih membingungkan (boleh kosong)
  next: string; // baris 3: langkah berikutnya
  notes: string; // catatan panjang (boleh kosong)
  skills: string[];
  minutes: number;
  video: string; // link YouTube, boleh kosong
  project: number; // 0 = tanpa proyek, selain itu nomor proyek
  answers: number; // nomor halaman yang pertanyaannya dijawab entri ini, 0 = tidak ada
  published: boolean; // false = draft
  featured: boolean; // tampil di Home
  stage: number; // berapa kali review berhasil (0..3)
  due: string; // tanggal review berikutnya, "" = tidak ada
  attachments: string[]; // URL file proof of work (gambar/PDF)
};

// Satu skill di daftar pilihan (dikelola di halaman Projects).
export type Skill = { id: string; name: string };

// Karya di katalog. `no` dipakai oleh Entry.project (0 = tanpa proyek).
export type Project = {
  id: string;
  no: number;
  name: string;
  about: string;
  year: string;
  skill: string; // dipakai oleh filter di katalog
  inProgress: boolean;
  link: string; // link karya, boleh kosong
  cover: string; // URL gambar sampul, boleh kosong
};

// ---------- Konfigurasi: ganti sesuai kebutuhan ----------

export const DURATIONS = [
  { label: "0:20", minutes: 20 },
  { label: "0:45", minutes: 45 },
  { label: "1:30", minutes: 90 },
  { label: "2:30", minutes: 150 },
  { label: "4:00+", minutes: 240 },
];

export const WEEK_GOAL = { days: 5, hours: 6 };

// Halaman kembali untuk di-review setelah 1 hari, lalu 3 hari, lalu 7 hari.
export const REVIEW_STEPS = [1, 3, 7];

// ---------- Tanggal & format ----------

// Jam lokal. toISOString() memakai UTC dan bisa bergeser sehari.
export function dateKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

export function addDays(key: string, n: number) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function daysBetween(from: string, to: string) {
  return Math.round((+parseKey(to) - +parseKey(from)) / 86400000);
}

// "2026-10-16" -> "OCT 16"
export function formatShort(key: string) {
  return parseKey(key)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

// 90 -> "1:30"
export function formatMinutes(m: number) {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

// 270 -> "4.5"
export function formatHours(m: number) {
  return String(Math.round(m / 6) / 10);
}

// 7 -> "007"
export function pad(n: number, length: number) {
  return String(n).padStart(length, "0");
}

// "https://youtu.be/abc..." -> alamat embed yang aman, atau null kalau bukan link YouTube
export function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.hostname.endsWith("youtube.com"))
      id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop() ?? "";
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

// ---------- Simpan & baca (Supabase) ----------

// Satu "toko" data di memori, dibagi ke semua komponen:
//   entries  = daftar entri yang boleh dilihat pengunjung ini (RLS yang menyaring)
//   loaded   = sudah selesai mengambil dari Supabase? (supaya tidak ada kilatan "kosong")
//   signedIn = null = belum tahu, true = Anda sudah login, false = pengunjung biasa
type Store = { entries: Entry[]; projects: Project[]; skills: Skill[]; loaded: boolean; signedIn: boolean | null };

let store: Store = { entries: [], projects: [], skills: [], loaded: false, signedIn: null };
const SERVER_STORE = store; // nilai saat build di server: belum ada apa-apa
const listeners = new Set<() => void>();

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch }; // objek baru, supaya React tahu ada yang berubah
  listeners.forEach((l) => l());
}

// Baris database -> Entry. Beda kecil: kolom `due` kosong di DB = null, di aplikasi = "".
type Row = Omit<Entry, "due"> & { due: string | null };

function fromRow(r: Row): Entry {
  return {
    id: r.id, kind: r.kind, page: r.page, date: r.date, title: r.title,
    discovered: r.discovered, confused: r.confused, next: r.next, notes: r.notes,
    skills: r.skills, minutes: r.minutes, video: r.video, project: r.project,
    answers: r.answers, published: r.published, featured: r.featured,
    stage: r.stage, due: r.due ?? "",
    attachments: r.attachments ?? [], // kolom baru; entri lama belum punya
  };
}

// Entry (sebagian) -> kolom database
function toRow(e: Partial<Entry>) {
  const { due, id, ...rest } = e;
  void id; // id dibuat database, tidak pernah dikirim dari sini
  return due === undefined ? rest : { ...rest, due: due || null };
}

// Kolom database `in_progress` -> `inProgress` di aplikasi
type ProjectRow = Omit<Project, "inProgress"> & { in_progress: boolean };

function fromProjectRow(r: ProjectRow): Project {
  return {
    id: r.id, no: r.no, name: r.name, about: r.about, year: r.year,
    skill: r.skill, inProgress: r.in_progress, link: r.link, cover: r.cover,
  };
}

// Ambil entri + proyek sekaligus. Kalau salah satu gagal, data lamanya tetap tampil.
async function refresh() {
  const [e, p, s] = await Promise.all([
    supabase.from("entries").select("*").order("date").order("page"), // urut kronologis (rest day tidak bernomor)
    supabase.from("projects").select("*").order("no"),
    supabase.from("skills").select("id,name").order("created_at"),
  ]);
  if (e.error) console.error("Gagal membaca entri:", e.error.message);
  if (p.error) console.error("Gagal membaca proyek:", p.error.message);
  if (s.error) console.error("Gagal membaca skill:", s.error.message);
  setStore({
    entries: e.error ? store.entries : (e.data as Row[]).map(fromRow),
    projects: p.error ? store.projects : (p.data as ProjectRow[]).map(fromProjectRow),
    skills: s.error ? store.skills : (s.data as Skill[]),
    loaded: true,
  });
}

// Jalan sekali, saat komponen pertama membutuhkan data.
// Login/logout mengubah apa yang boleh dibaca (draft muncul/hilang), jadi data diambil ulang.
let started = false;
function start() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    setStore({ signedIn: !!session });
    // setTimeout: Supabase melarang memanggil dirinya sendiri langsung di dalam callback ini
    setTimeout(() => void refresh(), 0);
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  start();
  return () => void listeners.delete(callback);
}

function useStore() {
  return useSyncExternalStore(subscribe, () => store, () => SERVER_STORE);
}

export const useEntries = () => useStore().entries;
export const useProjects = () => useStore().projects;
export const useSkills = () => useStore().skills; // baris lengkap (id + nama), untuk halaman kelola

// Semua nama skill yang relevan: yang ada di daftar + yang masih dipakai entri/proyek lama.
// Dengan begitu skill yang sudah dihapus dari daftar tetap bisa difilter selama masih dipakai.
export function skillNames(skills: Skill[], entries: Entry[], projects: Project[] = []) {
  const names = new Set(skills.map((s) => s.name));
  for (const e of entries) for (const s of e.skills) names.add(s);
  for (const p of projects) if (p.skill) names.add(p.skill);
  return [...names];
}
export const useLoaded = () => useStore().loaded;
export const useSignedIn = () => useStore().signedIn;

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}

const today = () => dateKey(new Date());

type NewEntry = Pick<
  Entry,
  | "title" | "discovered" | "confused" | "next" | "notes" | "skills" | "minutes"
  | "video" | "project" | "answers" | "published" | "featured" | "attachments" | "date"
>;

const blank = { discovered: "", confused: "", next: "", notes: "", skills: [], minutes: 0, video: "", project: 0, answers: 0, featured: false, stage: 0, attachments: [] };

// Semua fungsi tulis melempar Error kalau gagal, supaya tombol/form bisa menampilkannya.
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Menyimpan halaman baru dan mengembalikan nomor halamannya.
export async function saveEntry(input: NewEntry) {
  // Dua kali coba: kalau tab/perangkat lain mengambil nomor yang sama (index unik menolak), hitung ulang.
  for (let attempt = 0; attempt < 2; attempt++) {
    const last = await supabase
      .from("entries").select("page").eq("kind", "page").order("page", { ascending: false }).limit(1);
    check(last.error);
    const page = (last.data?.[0]?.page ?? 0) + 1;

    const { error } = await supabase.from("entries").insert(
      toRow({
        ...blank, ...input, kind: "page", page, stage: 0,
        due: input.published ? addDays(today(), 1) : "", // review pertama besok (juga untuk hari yang diisi belakangan)
      }),
    );
    if (!error) {
      await refresh();
      return page;
    }
    if (error.code !== "23505") throw new Error(error.message); // 23505 = nomor kembar
  }
  throw new Error("Nomor halaman bentrok dua kali. Coba simpan lagi.");
}

// Hari istirahat: streak tetap hidup. Satu kali per minggu (dijaga di getStats.restLeft).
// Mengubah catatan hari istirahat.
export async function updateRest(id: string, note: string) {
  const { data, error } = await supabase
    .from("entries").update({ notes: note }).eq("id", id).eq("kind", "rest").select("id");
  check(error);
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
}

// Membatalkan hari istirahat (streak dihitung ulang dari data).
export async function deleteRest(id: string) {
  const { data, error } = await supabase
    .from("entries").delete().eq("id", id).eq("kind", "rest").select("id");
  check(error);
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
}

export async function saveRest(note: string) {
  const { error } = await supabase.from("entries").insert(
    toRow({ ...blank, kind: "rest", page: 0, date: today(), title: "Rest day", notes: note, published: true, due: "" }),
  );
  check(error);
  await refresh();
}

async function update(page: number, change: (e: Entry) => Partial<Entry>) {
  const e = store.entries.find((x) => x.kind === "page" && x.page === page);
  if (!e) throw new Error("Halaman tidak ditemukan.");
  const { data, error } = await supabase
    .from("entries").update(toRow(change(e))).eq("id", e.id).select("id");
  check(error);
  // RLS yang menolak tidak mengembalikan error, hanya 0 baris. Anggap itu gagal.
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
}

// ---------- Proyek ----------

export type ProjectInput = Omit<Project, "id" | "no">;

function toProjectRow(p: Partial<ProjectInput>) {
  const { inProgress, ...rest } = p;
  return inProgress === undefined ? rest : { ...rest, in_progress: inProgress };
}

// Gambar sampul: dikompres di browser, disimpan di bucket "covers", dan yang disimpan
// di kolom `cover` hanya URL publiknya.
const BUCKETS = ["covers", "proof"];
const PUBLIC_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

async function putFile(bucket: string, body: Blob, ext: string, contentType: string) {
  const path = `${crypto.randomUUID()}.${ext}`; // nama unik, jadi tidak pernah menimpa file lain
  const { error } = await supabase.storage
    .from(bucket).upload(path, body, { contentType, cacheControl: "31536000" });
  check(error);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadCover(file: File) {
  return putFile("covers", await compressImage(file), "webp", "image/webp");
}

const MAX_PDF = 5 * 1024 * 1024;

// Proof of work: gambar dikompres jadi WebP, PDF disimpan apa adanya (maks 5 MB).
export async function uploadProof(file: File) {
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF) throw new Error(`"${file.name}" is over 5 MB.`);
    return putFile("proof", file, "pdf", "application/pdf");
  }
  return putFile("proof", await compressImage(file), "webp", "image/webp");
}

// Hanya menghapus file milik bucket kita. URL dari tempat lain dibiarkan.
// Gagal menghapus tidak dianggap error: yang tersisa hanya file yatim, bukan data yang rusak.
export async function removeFile(url: string) {
  const bucket = BUCKETS.find((b) => url.startsWith(`${PUBLIC_URL}${b}/`));
  if (!bucket) return;
  const { error } = await supabase.storage.from(bucket).remove([url.slice(`${PUBLIC_URL}${bucket}/`.length)]);
  if (error) console.error("Gagal menghapus file:", error.message);
}

export async function saveProject(input: ProjectInput) {
  // Dua kali coba, sama seperti saveEntry: kalau nomor bentrok, hitung ulang.
  for (let attempt = 0; attempt < 2; attempt++) {
    const last = await supabase.from("projects").select("no").order("no", { ascending: false }).limit(1);
    check(last.error);
    const no = (last.data?.[0]?.no ?? 0) + 1;
    const { error } = await supabase.from("projects").insert({ ...toProjectRow(input), no });
    if (!error) {
      await refresh();
      return;
    }
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Nomor proyek bentrok dua kali. Coba simpan lagi.");
}

export async function updateProject(id: string, input: ProjectInput) {
  const oldCover = store.projects.find((p) => p.id === id)?.cover;
  const { data, error } = await supabase
    .from("projects").update(toProjectRow(input)).eq("id", id).select("id");
  check(error);
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
  if (oldCover && oldCover !== input.cover) await removeFile(oldCover); // gambar lama sudah tidak dipakai
}

// Entri yang tertaut dilepas dulu (project = 0). Kalau tidak, nomor proyek bisa
// terpakai ulang dan entri lama tiba-tiba "masuk" ke proyek baru.
export async function deleteProject(p: Project) {
  const cleared = await supabase.from("entries").update({ project: 0 }).eq("project", p.no);
  check(cleared.error);
  const { data, error } = await supabase.from("projects").delete().eq("id", p.id).select("id");
  check(error);
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
  await removeFile(p.cover);
}

// Mengubah halaman yang sudah ada. Nomor halaman dan tahap review tidak berubah;
// kalau draft baru diterbitkan sekarang, review pertamanya besok.
export async function updateEntry(page: number, input: NewEntry) {
  const old = store.entries.find((x) => x.kind === "page" && x.page === page);
  await update(page, (e) => ({
    ...input,
    due: !e.published && input.published ? addDays(today(), 1) : e.due,
  }));
  // Lampiran yang dibuang dari entri ikut dihapus dari storage.
  await Promise.all((old?.attachments ?? []).filter((u) => !input.attachments.includes(u)).map(removeFile));
}

// Hapus halaman. Entri lain yang mengaku menjawab halaman ini dilepas dulu (answers = 0),
// kalau tidak, nomornya bisa terpakai ulang dan "menjawab" pertanyaan halaman baru.
export async function deleteEntry(page: number) {
  const e = store.entries.find((x) => x.kind === "page" && x.page === page);
  if (!e) throw new Error("Halaman tidak ditemukan.");
  const cleared = await supabase.from("entries").update({ answers: 0 }).eq("answers", page);
  check(cleared.error);
  const { data, error } = await supabase.from("entries").delete().eq("id", e.id).select("id");
  check(error);
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
  await Promise.all(e.attachments.map(removeFile));
}

// ---------- Skill ----------

export async function addSkill(name: string) {
  const clean = name.trim().slice(0, 30);
  if (!clean) throw new Error("Type a skill name first.");
  const { error } = await supabase.from("skills").insert({ name: clean });
  if (error?.code === "23505") throw new Error(`"${clean}" is already in the list.`);
  check(error);
  await refresh();
}

// Ganti nama di daftar skill, semua entri, dan semua proyek sekaligus (satu transaksi di database,
// lihat supabase-crud.sql).
export async function renameSkill(s: Skill, name: string) {
  const clean = name.trim().slice(0, 30);
  if (!clean) throw new Error("Type a skill name first.");
  const { error } = await supabase.rpc("rename_skill", { skill_id: s.id, new_name: clean });
  if (error?.code === "23505") throw new Error(`"${clean}" is already in the list.`);
  check(error);
  await refresh();
}

// Menghapus dari daftar pilihan saja. Entri lama yang memakai skill itu tidak diubah.
export async function deleteSkill(s: Skill) {
  const { data, error } = await supabase.from("skills").delete().eq("id", s.id).select("id");
  check(error);
  if (!data?.length) throw new Error("Tidak diizinkan. Apakah Anda sudah login?");
  await refresh();
}

export function publishEntry(page: number) {
  return update(page, () => ({ published: true, due: addDays(today(), 1) }));
}

// Jawab "I remember" -> naik satu tahap, jarak review berikutnya 3 lalu 7 hari.
// Jawab "Fuzzy" -> tahap tetap, halaman kembali besok.
export function reviewEntry(page: number, remembered: boolean) {
  return update(page, (e) => {
    if (!remembered) return { due: addDays(today(), 1) };
    const stage = e.stage + 1;
    return { stage, due: stage >= REVIEW_STEPS.length ? "" : addDays(today(), REVIEW_STEPS[stage]) };
  });
}

// Tanggal hari ini. Di server hasilnya "" (supaya tanggal saat build tidak
// "membeku" di HTML), lalu terisi tanggal asli begitu halaman tampil di browser.
// Komponen juga memakainya sebagai tanda "sudah di browser".
const noSubscribe = () => () => {};
export function useToday() {
  return useSyncExternalStore(noSubscribe, today, () => "");
}

// ---------- Statistik ----------

export function getStats(entries: Entry[], now: string) {
  const pages = entries.filter((e) => e.kind === "page" && e.published);
  const pagesPerDay = new Map<string, number>(); // tanggal -> jumlah halaman
  for (const e of pages) pagesPerDay.set(e.date, (pagesPerDay.get(e.date) ?? 0) + 1);
  const restDays = new Set(entries.filter((e) => e.kind === "rest").map((e) => e.date));
  // Hari "terjaga" = ada halaman atau hari istirahat
  const kept = (key: string) => pagesPerDay.has(key) || restDays.has(key);

  // Streak: hitung mundur dari hari ini. Kalau hari ini belum menulis,
  // streak masih hidup selama kemarin terjaga.
  let streak = 0;
  if (now) {
    let d = now;
    if (!kept(d)) d = addDays(d, -1);
    while (kept(d)) {
      streak++;
      d = addDays(d, -1);
    }
  }

  // Streak terpanjang: urutkan tanggal, hitung deret hari berurutan.
  let longest = 0;
  let run = 0;
  let prev = "";
  for (const key of [...new Set([...pagesPerDay.keys(), ...restDays])].sort()) {
    run = prev && daysBetween(prev, key) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = key;
  }

  // Minggu ini (Senin-Minggu)
  const monday = now ? addDays(now, -((parseKey(now).getDay() + 6) % 7)) : "";
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = monday ? addDays(monday, i) : String(i);
    const n = pagesPerDay.get(key) ?? 0;
    return { key, level: Math.min(n, 3), rest: n === 0 && restDays.has(key) };
  });
  const inWeek = (key: string) => !!monday && key >= monday && key <= addDays(monday, 6);

  const minutesBySkill = new Map<string, number>();
  for (const e of pages)
    for (const s of e.skills) minutesBySkill.set(s, (minutesBySkill.get(s) ?? 0) + e.minutes);

  return {
    pagesPerDay,
    restDays,
    kept,
    pageCount: pages.length,
    minutes: pages.reduce((sum, e) => sum + e.minutes, 0),
    streak,
    longest,
    thisYear: now ? pages.filter((e) => e.date.startsWith(now.slice(0, 4))).length : 0,
    week,
    goalDays: week.filter((d) => d.level > 0).length,
    weekMinutes: pages.filter((e) => inWeek(e.date)).reduce((sum, e) => sum + e.minutes, 0),
    restLeft: Math.max(0, 1 - [...restDays].filter(inWeek).length),
    minutesBySkill,
  };
}

type Stats = ReturnType<typeof getStats>;

// Kalender: `weeks` minggu x 7 hari, urut dari Senin minggu paling lama.
export function calendarCells(now: string, stats: Stats, weeks: number) {
  const start = now ? addDays(now, -((parseKey(now).getDay() + 6) % 7) - (weeks - 1) * 7) : "";
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const key = start ? addDays(start, i) : String(i);
    const level = Math.min(stats.pagesPerDay.get(key) ?? 0, 3); // 0 kosong ... 3 paling pekat
    return {
      key,
      level,
      rest: level === 0 && stats.restDays.has(key),
      future: !!now && key > now,
      rot: level ? ((i * 13) % 9) - 4 : 0, // cap tinta sedikit miring seperti stempel
    };
  });
}

// Pertanyaan terbuka: baris "still confusing" dari halaman terbit.
// Terjawab kalau ada halaman lain yang mengaku menjawabnya (`answers`).
export function getQuestions(entries: Entry[]) {
  const pages = entries.filter((e) => e.kind === "page" && e.published);
  return pages
    .filter((e) => e.confused.trim())
    .map((e) => ({
      page: e.page,
      text: e.confused,
      answeredBy: pages.find((a) => a.answers === e.page)?.page ?? 0,
    }));
}
