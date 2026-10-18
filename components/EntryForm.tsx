"use client"; // form (state + klik), jadi jalan di browser

// Form satu halaman buku. Dipakai dua kali:
//   /entry      -> halaman baru (editing kosong)
//   /edit?n=24  -> mengubah halaman yang sudah ada (editing = entri itu)

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Chip from "@/components/Chip";
import {
  DURATIONS,
  type Entry,
  addSkill,
  formatMinutes,
  formatShort,
  getQuestions,
  pad,
  parseKey,
  removeFile,
  saveEntry,
  skillNames,
  updateEntry,
  uploadProof,
  useEntries,
  useProjects,
  useSignedIn,
  useSkills,
  useToday,
} from "@/lib/entries";
import { formatClock, timer, useTimer } from "@/lib/timer";

const MAX_PROOFS = 6;

const label = "font-mono text-xs tracking-widest text-muted";
const box = "box-border w-full border-[1.5px] border-ink bg-paper placeholder:text-muted";
const line = "box-border w-full border border-ink/50 bg-field placeholder:text-muted font-serif text-[17px]";

export default function EntryForm({ editing }: { editing?: Entry }) {
  const router = useRouter();
  const today = useToday();
  const entries = useEntries();
  const signedIn = useSignedIn();
  const projects = useProjects();
  const skillRows = useSkills();
  const clock = useTimer();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Satu useState per isian form. Mengetik -> state berubah -> preview ikut berubah.
  const [title, setTitle] = useState(editing?.title ?? "");
  const [discovered, setDiscovered] = useState(editing?.discovered ?? "");
  const [confused, setConfused] = useState(editing?.confused ?? "");
  const [next, setNext] = useState(editing?.next ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [video, setVideo] = useState(editing?.video ?? "");
  const [skills, setSkills] = useState<string[]>(editing?.skills ?? []);
  const [minutes, setMinutes] = useState(editing?.minutes ?? 90);
  const [usedTimer, setUsedTimer] = useState(false); // waktu diambil dari timer? Kalau ya, timer direset setelah simpan
  const [date, setDate] = useState(editing?.date ?? ""); // "" = hari ini
  const [project, setProject] = useState(editing?.project ?? 0); // 0 = tanpa proyek
  const [answers, setAnswers] = useState(editing?.answers ?? 0); // 0 = tidak menjawab pertanyaan
  const [published, setPublished] = useState(editing?.published ?? true);
  const [featured, setFeatured] = useState(editing?.featured ?? false);
  const [newSkill, setNewSkill] = useState(""); // isian "tambah skill baru" di bawah pilihan skill
  const [skillError, setSkillError] = useState("");
  const [kept, setKept] = useState<string[]>(editing?.attachments ?? []); // lampiran lama yang dipertahankan
  // Lampiran yang dipilih tapi belum diunggah. Gambar punya `preview` (alamat sementara di browser).
  const [proofs, setProofs] = useState<{ file: File; preview: string }[]>([]);

  // Halaman ini sendiri tidak ditawarkan untuk menjawab pertanyaannya sendiri.
  const openQuestions = getQuestions(entries).filter((q) => !q.answeredBy && q.page !== editing?.page);
  const nextPage = editing?.page ?? Math.max(0, ...entries.map((e) => e.page)) + 1;
  const day = date || today; // tanggal yang dipakai: pilihan Anda, atau hari ini
  const options = skillNames(skillRows, entries, projects); // daftar skill + skill lama yang masih dipakai

  // Tambah skill tanpa meninggalkan form. Skill baru langsung terpilih.
  async function addNewSkill() {
    const name = newSkill.trim().slice(0, 30);
    if (!name) return;
    try {
      await addSkill(name);
      setSkills((list) => (list.includes(name) ? list : [...list, name]));
      setNewSkill("");
      setSkillError("");
    } catch (err) {
      setSkillError(err instanceof Error ? err.message : "Gagal menambah skill.");
    }
  }

  function setTime(h: number, m: number) {
    const clamp = (n: number, max: number) => Math.min(max, Math.max(0, Math.floor(n || 0)));
    setMinutes(clamp(h, 24) * 60 + clamp(m, 59));
  }

  // Ambil waktu dari timer: jeda dulu supaya angkanya berhenti, lalu isi jam/menit.
  function takeTimerTime() {
    timer.pause();
    setMinutes(Math.max(1, Math.round(clock.ms / 60000)));
    setUsedTimer(true);
  }

  function toggleSkill(s: string) {
    setSkills((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));
  }

  function addFiles(list: FileList | null) {
    const added = [...(list ?? [])].map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setProofs((cur) => [...cur, ...added].slice(0, Math.max(0, MAX_PROOFS - kept.length)));
  }

  function removeProof(i: number) {
    setProofs((cur) => {
      if (cur[i].preview) URL.revokeObjectURL(cur[i].preview);
      return cur.filter((_, n) => n !== i);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); // cegah browser me-reload halaman
    setSaving(true);
    setError("");
    // Lampiran diunggah saat Stamp (bukan saat dipilih), jadi membatalkan tidak meninggalkan file.
    const uploaded: string[] = [];
    try {
      if (!day) throw new Error("Pick a date.");
      if (minutes < 1) throw new Error("Set the time spent: use the timer, or type hours and minutes.");
      for (const p of proofs) uploaded.push(await uploadProof(p.file));
      const input = {
        title, discovered, confused, next, notes, skills, video, project, answers,
        published, featured, minutes, date: day, attachments: [...kept, ...uploaded],
      };
      let page = editing?.page ?? 0;
      if (editing) await updateEntry(editing.page, input);
      else page = await saveEntry(input);
      if (usedTimer) timer.reset(); // waktunya sudah tercatat, mulai dari nol lagi
      router.push(`/read?n=${page}`);
    } catch (err) {
      await Promise.all(uploaded.map(removeFile)); // simpan gagal: jangan tinggalkan file yatim
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setSaving(false); // isian form tetap utuh, tinggal coba lagi
    }
  }

  const dateLong = day
    ? parseKey(day)
        .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
        .toUpperCase()
    : "[WEEKDAY, DD MONTH]";

  // Menunggu status login; pengunjung diarahkan ke halaman login.
  if (signedIn === null) return null;
  if (!signedIn) {
    return (
      <p className="py-24 font-serif text-xl text-ink-soft">
        Only the owner can write pages.{" "}
        <Link href="/login" className="text-terracotta underline">Sign in</Link>.
      </p>
    );
  }

  return (
    <>
      <section className="pt-16 md:pt-18">
        <p className="mb-3.5 font-mono text-[13px] tracking-[0.12em] text-terracotta">
          {editing ? `EDITING PAGE ${pad(editing.page, 2)}` : "TODAY'S PAGE"} — {dateLong}
        </p>
        <h1 className="font-display text-6xl leading-[0.95] tracking-[-0.03em] md:text-[88px]">
          {editing ? (
            <>Edit this <span className="italic text-terracotta">page.</span></>
          ) : (
            <>What did you <span className="italic text-terracotta">learn today?</span></>
          )}
        </h1>
      </section>

      <div className="mt-16 grid grid-cols-1 items-start gap-x-6 gap-y-16 md:grid-cols-12">
        {/* FORM */}
        <form onSubmit={submit} className="flex flex-col gap-8 md:col-span-7">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="entry-title" className={label}>HEADLINE</label>
            <input
              id="entry-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="One line: the thing I understood today"
              className={`${box} min-h-16 px-5 font-display text-3xl`}
            />
          </div>

          {/* Tiga baris refleksi */}
          <div className="flex flex-col gap-[18px] border-[1.5px] border-ink bg-paper px-6 py-6 shadow-[6px_6px_0_var(--c-terracotta)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-xs tracking-widest text-terracotta">THE THREE LINES</p>
              <p className="font-serif text-sm text-muted italic">Short is fine. Honest is better.</p>
            </div>

            <div className="grid grid-cols-[34px_1fr] items-start gap-3.5">
              <span className="font-display text-[34px] leading-none text-terracotta">1</span>
              <div className="flex flex-col gap-2">
                <label htmlFor="r-discovered" className="text-[15px] font-semibold">What I discovered</label>
                <textarea
                  id="r-discovered"
                  required
                  value={discovered}
                  onChange={(e) => setDiscovered(e.target.value)}
                  placeholder="Something I understand now that I didn't this morning…"
                  className={`${line} h-21 resize-none px-3.5 py-3 leading-normal`}
                />
              </div>
            </div>

            <div className="grid grid-cols-[34px_1fr] items-start gap-3.5">
              <span className="font-display text-[34px] leading-none text-terracotta">2</span>
              <div className="flex flex-col gap-2">
                <label htmlFor="r-confused" className="text-[15px] font-semibold">What still confuses me</label>
                <textarea
                  id="r-confused"
                  value={confused}
                  onChange={(e) => setConfused(e.target.value)}
                  placeholder="A question I couldn't answer yet (leave empty if none)…"
                  className={`${line} h-21 resize-none px-3.5 py-3 leading-normal`}
                />
                <p className="font-mono text-[11px] text-muted">
                  BECOMES AN OPEN QUESTION ON THE TRACKER UNTIL A LATER PAGE ANSWERS IT
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[34px_1fr] items-start gap-3.5">
              <span className="font-display text-[34px] leading-none text-terracotta">3</span>
              <div className="flex flex-col gap-2">
                <label htmlFor="r-next" className="text-[15px] font-semibold">Next step</label>
                <input
                  id="r-next"
                  type="text"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="Tomorrow I'll try…"
                  className={`${line} min-h-[52px] px-3.5`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-ink/40 pt-3">
              <span className="font-mono text-[11px] tracking-[0.06em] text-muted">
                ANSWERS AN OPEN QUESTION?
              </span>
              <Chip label="No" active={answers === 0} onClick={() => setAnswers(0)} />
              {openQuestions.map((q) => (
                <Chip
                  key={q.page}
                  label={`Page ${pad(q.page, 2)}`}
                  active={answers === q.page}
                  onClick={() => setAnswers(q.page)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="entry-note" className={label}>LONGER NOTES (OPTIONAL)</label>
            <textarea
              id="entry-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you try, what broke, what finally clicked?"
              className={`${box} h-40 resize-none px-5 py-4 font-serif text-lg leading-relaxed`}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Dropzone: input file transparan menutupi seluruh kotak, jadi bisa diklik atau drag & drop */}
            <div className="flex flex-col gap-2.5">
              <span className={label}>PROOF OF WORK</span>
              <div className="relative flex h-[132px] flex-col items-center justify-center gap-2.5 border-2 border-dashed border-ink bg-tan-5 px-4 text-center">
                <svg className="text-terracotta" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
                </svg>
                <p className="font-display text-xl">Drop screenshots or PDFs</p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  aria-label="Attach files"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = ""; // supaya file yang sama bisa dipilih lagi setelah dihapus
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
              {proofs.length + kept.length > 0 && (
                <ul className="flex flex-wrap gap-3">
                  {kept.map((url) => (
                    <li key={url} className="relative">
                      {url.endsWith(".pdf") ? (
                        <span className="flex size-20 items-center justify-center border-[1.5px] border-ink bg-paper font-mono text-[10px]">
                          PDF
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- situs statis, tanpa optimasi gambar
                        <img src={url} alt="Attached" className="size-20 border-[1.5px] border-ink object-cover" />
                      )}
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={() => setKept((k) => k.filter((u) => u !== url))}
                        className="absolute -top-2 -right-2 size-6 cursor-pointer rounded-full bg-ink text-xs text-cream"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                  {proofs.map((p, i) => (
                    <li key={i} className="relative">
                      {p.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal
                        <img src={p.preview} alt={p.file.name} className="size-20 border-[1.5px] border-ink object-cover" />
                      ) : (
                        <span className="flex size-20 items-center justify-center border-[1.5px] border-ink bg-paper px-1 text-center font-mono text-[10px] break-all">
                          {p.file.name}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${p.file.name}`}
                        onClick={() => removeProof(i)}
                        className="absolute -top-2 -right-2 size-6 cursor-pointer rounded-full bg-ink text-xs text-cream"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-serif text-sm text-muted italic">
                Up to {MAX_PROOFS} files. Images are resized and saved as WebP. PDFs up to 5 MB.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="entry-video" className={label}>PROGRESS VIDEO (YOUTUBE)</label>
              <div className="flex h-16 items-center gap-3 border-[1.5px] border-ink bg-paper px-4">
                <svg className="text-terracotta" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M10 9.5v5l4.5-2.5z" />
                </svg>
                <input
                  id="entry-video"
                  type="url"
                  pattern="https?://.*" // hanya http/https, menolak "javascript:" dsb.
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  placeholder="https://youtu.be/…"
                  className="h-14 min-w-0 grow bg-transparent font-mono text-[15px] placeholder:text-muted"
                />
              </div>
              <p className="font-serif text-sm text-muted italic">Unlisted works. The video stays on YouTube.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className={label}>
              SKILLS <span className="text-terracotta">· PICK ONE OR MORE</span>
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {options.map((s) => (
                <Chip key={s} label={s} active={skills.includes(s)} onClick={() => toggleSkill(s)} />
              ))}
              {options.length === 0 && (
                <p className="font-serif text-base text-muted italic">No skills yet. Add your first below.</p>
              )}
            </div>
            {/* Bukan <form> (sudah di dalam form entri); Enter ditangani manual */}
            <div className="flex max-w-sm gap-2">
              <input
                aria-label="New skill"
                value={newSkill}
                maxLength={30}
                placeholder="+ New skill"
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // jangan mengirim form entri
                    void addNewSkill();
                  }
                }}
                className={`${box} min-h-10 px-3 text-sm`}
              />
              <button
                type="button"
                onClick={() => void addNewSkill()}
                className="min-h-10 shrink-0 cursor-pointer rounded-full border-[1.5px] border-ink px-4 text-sm font-medium"
              >
                Add
              </button>
            </div>
            {skillError && <p role="alert" className="font-serif text-sm text-terracotta">{skillError}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <span className={label}>TIME SPENT</span>
              <div className="flex items-center gap-2 font-mono text-sm">
                <input
                  type="number"
                  min={0}
                  max={24}
                  aria-label="Hours"
                  value={Math.floor(minutes / 60)}
                  onChange={(e) => setTime(Number(e.target.value), minutes % 60)}
                  className={`${box} min-h-12 w-20 px-3`}
                />
                h
                <input
                  type="number"
                  min={0}
                  max={59}
                  aria-label="Minutes"
                  value={minutes % 60}
                  onChange={(e) => setTime(Math.floor(minutes / 60), Number(e.target.value))}
                  className={`${box} min-h-12 w-20 px-3`}
                />
                m
              </div>
              <div className="flex flex-wrap gap-2.5">
                {DURATIONS.map((d) => (
                  <Chip key={d.label} mono label={d.label} active={minutes === d.minutes} onClick={() => setMinutes(d.minutes)} />
                ))}
              </div>
              {/* Timer: tetap berjalan walau pindah halaman atau menutup tab */}
              <div className="flex flex-wrap items-center gap-3 border-[1.5px] border-dashed border-ink px-4 py-3">
                <span className="font-mono text-2xl tabular-nums">{formatClock(clock.ms)}</span>
                <button
                  type="button"
                  onClick={clock.running ? timer.pause : timer.start}
                  className="min-h-10 cursor-pointer rounded-full bg-ink px-4 text-sm font-medium text-cream"
                >
                  {clock.running ? "Pause" : clock.ms > 0 ? "Resume" : "Start"}
                </button>
                <button
                  type="button"
                  disabled={clock.ms < 1000}
                  onClick={takeTimerTime}
                  className="min-h-10 cursor-pointer rounded-full border-[1.5px] border-terracotta px-4 text-sm font-medium text-terracotta disabled:opacity-40"
                >
                  Use this time
                </button>
                <button
                  type="button"
                  disabled={clock.ms === 0}
                  onClick={timer.reset}
                  className="cursor-pointer text-sm text-muted underline disabled:opacity-40"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="entry-date" className={label}>DATE</label>
              <input
                id="entry-date"
                type="date"
                required
                max={today}
                value={day}
                onChange={(e) => setDate(e.target.value)}
                className={`${box} min-h-12 px-4 font-mono`}
              />
              <p className="font-serif text-sm text-muted italic">Missed a day? Pick it here.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className={label}>PART OF A PROJECT?</span>
            <div className="flex flex-wrap gap-2.5">
              <Chip square label="None" active={project === 0} onClick={() => setProject(0)} />
              {projects.map((p) => (
                <Chip key={p.no} square label={p.name} active={project === p.no} onClick={() => setProject(p.no)} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-7 border-y-[1.5px] border-ink py-[22px]">
            <div className="flex flex-col gap-2.5">
              <span className={label}>VISIBILITY</span>
              <div className="flex border-[1.5px] border-ink">
                {[
                  ["Draft", false],
                  ["Published", true],
                ].map(([text, value]) => (
                  <button
                    key={String(text)}
                    type="button"
                    aria-pressed={published === value}
                    onClick={() => setPublished(value as boolean)}
                    className={`min-h-11 cursor-pointer px-5 text-sm font-medium ${
                      published === value ? "bg-ink text-cream" : ""
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={label}>FEATURE ON HOME</span>
              <button
                type="button"
                role="switch"
                aria-checked={featured}
                onClick={() => setFeatured(!featured)}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border-[1.5px] border-ink pr-4 pl-1.5 text-sm font-medium"
              >
                <span
                  className={`relative inline-block h-[30px] w-[52px] rounded-full ${
                    featured ? "bg-terracotta" : "bg-ink/25"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] size-6 rounded-full border border-ink bg-field ${
                      featured ? "left-[25px]" : "left-[3px]"
                    }`}
                  />
                </span>
                {featured ? "Featured" : "Not featured"}
              </button>
            </div>
            <p className="max-w-[260px] font-serif text-[15px] text-muted italic">
              Drafts stay private. Only published pages appear on the tracker and on Home.
            </p>
          </div>

          {error && <p role="alert" className="font-serif text-base text-terracotta">{error}</p>}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="min-h-14 cursor-pointer rounded-full bg-terracotta px-9 text-base font-semibold text-on-accent disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save changes" : published ? "Stamp this page" : "Save draft"}
            </button>
            <Link
              href={editing ? `/read?n=${editing.page}` : "/tracker"}
              className="inline-flex min-h-14 items-center rounded-full border-[1.5px] border-ink px-7 text-base font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* PREVIEW: kartu yang menampilkan isi form secara langsung */}
        <aside className="md:col-span-4 md:col-start-9">
          <p className={`${label} mb-3.5`}>HOW IT WILL APPEAR IN THE LOG</p>
          <div className="flex -rotate-[1.2deg] flex-col gap-4 border-[1.5px] border-ink bg-paper px-6 pt-7 pb-6 shadow-stamp">
            <div className="flex items-start justify-between">
              <p className="font-display text-[84px] leading-[0.85] text-terracotta">{pad(nextPage, 2)}</p>
              <span
                className={`flex size-[70px] rotate-12 items-center justify-center rounded-full border-2 text-center font-mono text-[10px] leading-tight tracking-[0.08em] ${
                  published ? "border-terracotta text-terracotta" : "border-dashed border-muted text-muted"
                }`}
              >
                {published ? (
                  <>DAY<br />LOGGED</>
                ) : (
                  "DRAFT"
                )}
              </span>
            </div>
            <p className="font-mono text-[11px] tracking-[0.08em] text-muted">
              {day ? formatShort(day) : "[MON DD]"} ·{" "}
              <span className="text-terracotta">{skills.join(" + ").toUpperCase() || "NO SKILL YET"}</span>{" "}
              · {formatMinutes(minutes)}
            </p>
            <p className="font-display text-[30px] leading-[1.1] break-words">
              {title || "[Your headline appears here]"}
            </p>
            <div className="flex flex-col gap-2.5 border-l-2 border-terracotta pl-3.5">
              {[
                ["DISCOVERED", discovered, "[Line one of your reflection.]"],
                ["STILL CONFUSING", confused, "[Line two, if any.]"],
                ["NEXT", next, "[Line three.]"],
              ].map(([name, text, placeholder]) => (
                <div key={name}>
                  <p className="font-mono text-[10px] tracking-widest text-terracotta">{name}</p>
                  <p className="font-serif text-[15px] leading-snug break-words text-ink-soft">
                    {text || placeholder}
                  </p>
                </div>
              ))}
            </div>
            {video && (
              <div className="flex aspect-video items-center justify-center bg-slab">
                <span className="flex size-14 items-center justify-center rounded-full bg-terracotta">
                  <svg className="fill-on-accent" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
              </div>
            )}
            {proofs[0] && (
              proofs[0].preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal
                <img src={proofs[0].preview} alt="" className="h-24 w-full border-[1.5px] border-ink object-cover" />
              ) : (
                <p className="flex h-24 items-center justify-center border-[1.5px] border-ink bg-tan-1 px-3 text-center font-mono text-[11px] break-all text-muted">
                  {proofs[0].file.name}
                </p>
              )
            )}
            <div className="flex justify-between gap-3 font-mono text-[11px]">
              <span className="text-terracotta">
                {projects.find((p) => p.no === project)
                  ? `→ PART OF ${projects.find((p) => p.no === project)?.name.toUpperCase()}`
                  : "NOT LINKED TO A PROJECT"}
              </span>
              <span className="text-muted">{featured ? "★ FEATURED ON HOME" : ""}</span>
            </div>
          </div>
          <div className="mt-10 border-[1.5px] border-dashed border-ink px-5 py-[18px] font-serif text-base leading-normal text-ink-soft">
            <p className="mb-2 font-mono text-[11px] tracking-widest text-terracotta">AFTER YOU STAMP IT</p>
            The page lights one circle on the ink calendar, and comes back for review in <b>1</b>,{" "}
            <b>3</b> and <b>7</b> days.
          </div>
        </aside>
      </div>
    </>
  );
}
