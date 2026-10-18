"use client"; // form + state, jadi jalan di browser

// URL "/projects": tempat Anda mengisi katalog di Home. Hanya untuk pemilik.
// Satu form dipakai dua kali: kosong = tambah proyek, terisi (klik Edit) = ubah proyek.

import Link from "next/link";
import { useState } from "react";
import Chip from "@/components/Chip";
import {
  type Project,
  type ProjectInput,
  type Skill,
  addSkill,
  deleteProject,
  deleteSkill,
  pad,
  removeFile,
  renameSkill,
  saveProject,
  skillNames,
  updateProject,
  uploadCover,
  useProjects,
  useSignedIn,
  useSkills,
} from "@/lib/entries";

const label = "font-mono text-xs tracking-widest text-muted";
const box = "box-border w-full border-[1.5px] border-ink bg-paper px-4 placeholder:text-muted";

const EMPTY: ProjectInput = {
  name: "", about: "", year: String(new Date().getFullYear()), skill: "",
  inProgress: false, link: "", cover: "",
};

export default function ProjectsPage() {
  const signedIn = useSignedIn();
  const projects = useProjects();
  const skillRows = useSkills();
  const [skillName, setSkillName] = useState("");
  const [editing, setEditing] = useState<Project | null>(null); // null = form untuk proyek baru
  const [form, setForm] = useState<ProjectInput>(EMPTY);
  const [file, setFile] = useState<File | null>(null); // gambar baru yang belum diunggah
  const [preview, setPreview] = useState(""); // pratinjau gambar baru (alamat sementara di browser)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (signedIn === null) return null;
  if (!signedIn) {
    return (
      <p className="py-24 font-serif text-xl text-ink-soft">
        Only the owner can manage projects.{" "}
        <Link href="/login" className="text-terracotta underline">Sign in</Link>.
      </p>
    );
  }

  // set("name", "x") mengubah satu isian form tanpa menyentuh yang lain
  function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(p: Project) {
    setEditing(p);
    setForm({ name: p.name, about: p.about, year: p.year, skill: p.skill, inProgress: p.inProgress, link: p.link, cover: p.cover });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pickFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY);
    pickFile(null);
    setError("");
  }

  async function run(action: () => Promise<void>, done?: () => void) {
    setBusy(true);
    setError("");
    try {
      await action();
      done?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
    setBusy(false);
  }

  // Gambar diunggah saat Save (bukan saat dipilih), jadi membatalkan form tidak meninggalkan file.
  function submit(e: React.FormEvent) {
    e.preventDefault();
    void run(async () => {
      const uploaded = file ? await uploadCover(file) : "";
      const input = { ...form, cover: uploaded || form.cover };
      try {
        await (editing ? updateProject(editing.id, input) : saveProject(input));
      } catch (err) {
        if (uploaded) await removeFile(uploaded); // simpan gagal: jangan tinggalkan file yatim
        throw err;
      }
    }, reset);
  }

  function rename(s: Skill) {
    const name = window.prompt("Rename skill. Pages and projects that use it are updated too.", s.name);
    if (name && name.trim() !== s.name) void run(() => renameSkill(s, name));
  }

  function remove(p: Project) {
    if (!window.confirm(`Delete "${p.name}"? Pages linked to it will be unlinked, not deleted.`)) return;
    void run(() => deleteProject(p), () => editing?.id === p.id && reset());
  }

  return (
    <>
      <section className="pt-16 md:pt-18">
        <p className="mb-3.5 font-mono text-[13px] tracking-[0.12em] text-terracotta">THE CATALOG</p>
        <h1 className="font-display text-6xl leading-[0.95] tracking-[-0.03em] md:text-[88px]">
          Your <span className="italic text-terracotta">projects.</span>
        </h1>
      </section>

      <div className="mt-16 grid grid-cols-1 items-start gap-x-6 gap-y-16 md:grid-cols-12">
        {/* FORM */}
        <form onSubmit={submit} className="flex flex-col gap-7 md:col-span-7">
          <p className="font-mono text-xs tracking-widest text-terracotta">
            {editing ? `EDITING NO. ${pad(editing.no, 2)}` : "NEW PROJECT"}
          </p>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="p-name" className={label}>NAME</label>
            <input
              id="p-name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="What is it called?"
              className={`${box} min-h-16 font-display text-3xl`}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="p-about" className={label}>ABOUT (ONE OR TWO SENTENCES)</label>
            <textarea
              id="p-about"
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="What it is, and what you learned building it."
              className={`${box} h-28 resize-none py-3 font-serif text-lg leading-normal`}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="p-year" className={label}>YEAR</label>
              <input
                id="p-year"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                className={`${box} min-h-12 font-mono`}
              />
            </div>
            <div className="flex flex-col gap-3">
              <span className={label}>MAIN SKILL</span>
              <div className="flex flex-wrap gap-2.5">
                {skillNames(skillRows, [], projects).map((s) => (
                  <Chip key={s} label={s} active={form.skill === s} onClick={() => set("skill", s)} />
                ))}
                {skillRows.length === 0 && (
                  <span className="font-serif text-sm text-muted italic">Add skills below first.</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="p-link" className={label}>LINK TO THE WORK (OPTIONAL)</label>
              <input
                id="p-link"
                type="url"
                pattern="https?://.*" // hanya http/https, menolak "javascript:" dsb.
                value={form.link}
                onChange={(e) => set("link", e.target.value)}
                placeholder="https://…"
                className={`${box} min-h-12 font-mono text-sm`}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <label htmlFor="p-cover" className={label}>COVER IMAGE (OPTIONAL)</label>
              {(preview || form.cover) && (
                // eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal
                <img src={preview || form.cover} alt="Cover preview" className="h-32 w-full border-[1.5px] border-ink object-cover" />
              )}
              <input
                id="p-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="w-full font-mono text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-[1.5px] file:border-ink file:bg-paper file:px-4 file:py-2 file:text-sm"
              />
              {(preview || form.cover) && (
                <button
                  type="button"
                  onClick={() => {
                    pickFile(null);
                    set("cover", "");
                  }}
                  className="w-fit cursor-pointer text-sm text-muted underline"
                >
                  Remove image
                </button>
              )}
              <p className="font-serif text-sm text-muted italic">
                Resized to 1600 px and saved as WebP, so big photos are fine.
              </p>
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.inProgress}
              onChange={(e) => set("inProgress", e.target.checked)}
              className="size-5 accent-terracotta"
            />
            Still in progress
          </label>

          {error && <p role="alert" className="font-serif text-base text-terracotta">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={busy}
              className="min-h-14 cursor-pointer rounded-full bg-terracotta px-9 text-base font-semibold text-on-accent disabled:opacity-60"
            >
              {busy ? "Saving…" : editing ? "Save changes" : "Add project"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="min-h-14 cursor-pointer rounded-full border-[1.5px] border-ink px-7 text-base font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* DAFTAR PROYEK */}
        <aside className="md:col-span-4 md:col-start-9">
          <p className={`${label} mb-3.5`}>ALL PROJECTS ({projects.length})</p>
          {projects.length === 0 && (
            <p className="font-serif text-lg text-ink-soft italic">Nothing here yet. Add the first one.</p>
          )}
          <ul className="flex flex-col gap-4">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 border-[1.5px] border-ink bg-paper p-5">
                <p className="font-mono text-[11px] tracking-widest text-terracotta">
                  NO. {pad(p.no, 2)}{p.inProgress ? " · IN PROGRESS" : ""}
                </p>
                <p className="font-display text-2xl leading-tight">{p.name}</p>
                <div className="flex gap-4 text-sm font-medium">
                  <button type="button" onClick={() => startEdit(p)} className="cursor-pointer text-terracotta">
                    Edit
                  </button>
                  <button type="button" disabled={busy} onClick={() => remove(p)} className="cursor-pointer text-muted">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* SKILLS: daftar pilihan untuk entri, proyek, dan filter */}
      <section className="mt-20 border-t-2 border-ink pt-10">
        <p className="font-mono text-xs tracking-widest text-terracotta">SKILLS</p>
        <h2 className="mt-2 font-display text-4xl">What you practice</h2>
        <p className="mt-2 max-w-xl font-serif text-base text-ink-soft italic">
          These appear as choices on every page and project. Removing one only removes the choice;
          pages that already use it keep their label.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {skillRows.map((s) => (
            <li key={s.id} className="flex items-center gap-2 border-[1.5px] border-ink bg-paper py-1.5 pr-1.5 pl-3.5 text-sm">
              {s.name}
              <button
                type="button"
                aria-label={`Rename ${s.name}`}
                disabled={busy}
                onClick={() => rename(s)}
                className="cursor-pointer px-1 text-xs text-terracotta underline"
              >
                Rename
              </button>
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                disabled={busy}
                onClick={() => void run(() => deleteSkill(s))}
                className="size-6 cursor-pointer rounded-full bg-ink/10 text-xs"
              >
                ×
              </button>
            </li>
          ))}
          {skillRows.length === 0 && (
            <li className="font-serif text-lg text-muted italic">No skills yet.</li>
          )}
        </ul>
        <form
          className="mt-6 flex max-w-md gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => addSkill(skillName), () => setSkillName(""));
          }}
        >
          <input
            aria-label="New skill"
            value={skillName}
            maxLength={30}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="e.g. Design, Backend, Writing"
            className={`${box} min-h-12`}
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 shrink-0 cursor-pointer rounded-full bg-ink px-6 text-sm font-medium text-cream disabled:opacity-60"
          >
            Add
          </button>
        </form>
      </section>
    </>
  );
}
