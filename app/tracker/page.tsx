"use client"; // halaman ini membaca localStorage dan punya filter, jadi jalan di browser

// Folder "tracker" + file page.tsx = halaman di URL "/tracker".
// Tiap bagian besar (minggu ini, review, jam per skill, pertanyaan) ada di components/.

import Link from "next/link";
import { useState } from "react";
import Chip from "@/components/Chip";
import HoursBySkill from "@/components/HoursBySkill";
import InkDot from "@/components/InkDot";
import OpenQuestions from "@/components/OpenQuestions";
import ReviewList from "@/components/ReviewList";
import ThisWeek from "@/components/ThisWeek";
import {
  calendarCells,
  deleteRest,
  formatMinutes,
  formatShort,
  getQuestions,
  getStats,
  pad,
  skillNames,
  updateRest,
  useEntries,
  useLoaded,
  useProjects,
  useSignedIn,
  useSkills,
  useToday,
} from "@/lib/entries";

const tagBox = "border border-ink px-2 py-1 font-mono text-[11px] uppercase";

export default function TrackerPage() {
  const entries = useEntries();
  const today = useToday();
  const loaded = useLoaded();
  const projects = useProjects();
  const skillRows = useSkills();
  const signedIn = useSignedIn();
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  const stats = getStats(entries, today);
  const cells = calendarCells(today, stats, 18);
  const openPages = new Set(getQuestions(entries).filter((q) => !q.answeredBy).map((q) => q.page));
  // Pengunjung tidak menerima draft dari database (RLS), tapi dijaga juga di sini.
  const drafts = signedIn ? entries.filter((e) => e.kind === "page" && !e.published) : [];

  // Entri terbaru di atas. Entri ditambahkan berurutan, jadi cukup dibalik.
  // Hari istirahat tidak punya skill, jadi hanya tampil saat filter "All".
  const rows = entries
    .filter((e) => e.published)
    .reverse()
    .filter((e) => filter === "All" || (e.kind === "page" && e.skills.includes(filter)));

  return (
    <>
      {/* Judul + statistik kecil */}
      <section className="flex flex-wrap items-end justify-between gap-8 pt-16 md:pt-22">
        <div>
          <p className="mb-3.5 font-mono text-[13px] tracking-[0.12em] text-terracotta">
            THE DAILY LOG
          </p>
          <h1 className="font-display text-6xl leading-[0.95] tracking-[-0.03em] md:text-[104px]">
            Every day, <span className="italic text-terracotta">one page.</span>
          </h1>
        </div>
        <div className="flex gap-10 pb-3">
          {[
            ["STREAK", pad(stats.streak, 2)],
            ["LONGEST", pad(stats.longest, 2)],
            ["THIS YEAR", pad(stats.thisYear, 3)],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="font-mono text-[11px] tracking-widest text-muted">{label}</p>
              <p className="font-display text-5xl leading-none">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Baris 1: kalender tinta + minggu ini */}
      <section className="mt-16 grid items-stretch gap-6 md:grid-cols-12">
        <div className="border-[1.5px] border-ink bg-paper p-6 shadow-stamp md:col-span-8 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-3xl tracking-tight">
              Ink calendar <span className="text-muted italic">— last 18 weeks</span>
            </h2>
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
              <span>LESS</span>
              {[0, 1, 2, 3].map((level) => (
                <InkDot key={level} level={level} size={16} />
              ))}
              <span>MORE</span>
              <span className="ml-2.5">
                <InkDot level={0} rest size={16} />
              </span>
              <span>REST DAY</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[620px] grid-cols-[36px_1fr] gap-2.5">
              <div className="grid grid-rows-[repeat(7,26px)] items-center gap-y-[7px] font-mono text-[10px] text-muted">
                <span>Mon</span>
                <span />
                <span>Wed</span>
                <span />
                <span>Fri</span>
                <span />
                <span>Sun</span>
              </div>
              {/* grid-flow-col: sel terisi per kolom (satu kolom = satu minggu) */}
              <div className="grid auto-cols-fr grid-flow-col grid-rows-[repeat(7,26px)] justify-items-center gap-[7px]">
                {cells.map((c, i) => (
                  <InkDot
                    delay={Math.min(Math.floor(i / 7) * 15, 700)}
                    key={c.key}
                    title={c.key}
                    level={c.level}
                    rest={c.rest}
                    rot={c.rot}
                    faded={c.future}
                    size={24}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 font-serif text-sm text-muted italic">
            Each stamped page lights one circle. Darker means more pages that day.
          </p>
        </div>

        <div className="md:col-span-4">
          <ThisWeek stats={stats} today={today} />
        </div>
      </section>

      {/* Baris 2: review (hanya pemilik) + jam per skill */}
      <section className="mt-14 grid items-start gap-6 md:grid-cols-12">
        {signedIn && (
          <div className="md:col-span-7">
            <ReviewList entries={entries} today={today} />
          </div>
        )}
        <div className={signedIn ? "md:col-span-5" : "md:col-span-12"}>
          <HoursBySkill stats={stats} />
        </div>
      </section>

      <OpenQuestions entries={entries} />

      {/* Filter skill */}
      <div className="mt-16 flex flex-wrap items-center gap-3.5">
        <span className="mr-2 font-mono text-xs tracking-widest text-muted">FILTER BY SKILL</span>
        {["All", ...skillNames(skillRows, entries, projects)].map((s) => (
          <Chip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
        ))}
        <span className="font-mono text-xs text-muted md:ml-auto">SHOWING PUBLISHED PAGES ONLY</span>
      </div>

      {/* Draft: hanya Anda yang bisa melihat, tidak masuk daftar di bawah */}
      {drafts.length > 0 && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
          DRAFTS (PRIVATE):
          {drafts.map((d) => (
            <Link key={d.id} href={`/read?n=${d.page}`} className="text-terracotta underline">
              {pad(d.page, 2)} · {d.title}
            </Link>
          ))}
        </p>
      )}

      {error && <p role="alert" className="mt-6 font-serif text-base text-terracotta">{error}</p>}

      {/* Daftar entri */}
      <section className="mt-8 border-t-2 border-ink">
        {!loaded && <p className="py-14 font-serif text-xl text-muted italic">Loading…</p>}
        {loaded && rows.length === 0 && (
          <p className="py-14 font-serif text-xl text-ink-soft">
            {entries.some((e) => e.published) ? "No pages for this skill." : "No pages yet."}{" "}
            {signedIn && (
              <Link href="/entry" className="text-terracotta underline">
                Write today&apos;s page
              </Link>
            )}
          </p>
        )}
        {rows.map((e) =>
          e.kind === "rest" ? (
            // Hari istirahat: tidak punya halaman detail
            <article
              key={e.id}
              className="grid gap-x-8 gap-y-3 border-b border-ink/35 py-8 md:grid-cols-[110px_minmax(0,1fr)_230px_44px] md:items-start"
            >
              <div className="flex flex-col gap-1">
                <p className="font-display text-[56px] leading-none text-terracotta/45">—</p>
                <p className="font-mono text-[11px] tracking-widest text-muted">{formatShort(e.date)}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-display text-[32px] leading-[1.1] text-muted italic">Rest day</h3>
                <p className="font-serif text-[17px] leading-normal text-muted">
                  {e.notes || "The streak is kept."}
                </p>
                {signedIn && (
                  <p className="flex gap-4 text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        const note = window.prompt("Note for this rest day", e.notes);
                        if (note !== null) updateRest(e.id, note.trim()).catch((err) => setError(err.message));
                      }}
                      className="cursor-pointer text-terracotta"
                    >
                      Edit note
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Remove this rest day? Your streak may break.")) {
                          deleteRest(e.id).catch((err) => setError(err.message));
                        }
                      }}
                      className="cursor-pointer text-muted"
                    >
                      Remove
                    </button>
                  </p>
                )}
              </div>
              <span className="justify-self-start border-[1.5px] border-dashed border-terracotta px-2 py-1 font-mono text-[11px] text-terracotta">
                REST
              </span>
            </article>
          ) : (
            <Link
              key={e.id}
              href={`/read?n=${e.page}`}
              className="grid gap-x-8 gap-y-3 border-b border-ink/35 py-8 md:grid-cols-[110px_minmax(0,1fr)_230px_44px] md:items-start"
            >
              <div className="flex flex-col gap-1">
                <p className="font-display text-[56px] leading-none text-terracotta">{pad(e.page, 2)}</p>
                <p className="font-mono text-[11px] tracking-widest text-muted">{formatShort(e.date)}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <h3 className="font-display text-[32px] leading-[1.1]">{e.title}</h3>
                <p className="line-clamp-2 font-serif text-[17px] leading-normal text-ink-soft">
                  <span className="mr-2 font-mono text-[10px] tracking-widest text-terracotta">
                    DISCOVERED
                  </span>
                  {e.discovered}
                </p>
                <p className="flex flex-wrap gap-x-3.5 font-mono text-[11px] text-muted">
                  {projects.find((p) => p.no === e.project) && (
                    <span>→ {projects.find((p) => p.no === e.project)?.name}</span>
                  )}
                  {e.featured && <span>★ FEATURED</span>}
                  {openPages.has(e.page) && <span className="text-terracotta">? 1 OPEN QUESTION</span>}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {e.skills.map((s) => (
                    <span key={s} className={tagBox}>{s}</span>
                  ))}
                  <span className={tagBox}>{formatMinutes(e.minutes)}</span>
                </div>
                {e.video && (
                  <span className="flex h-16 w-28 items-center justify-center bg-slab">
                    <span className="flex size-[30px] items-center justify-center rounded-full bg-terracotta">
                      <svg className="fill-on-accent" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </span>
                  </span>
                )}
              </div>
              <span className="hidden size-11 items-center justify-center rounded-full border-[1.5px] border-ink md:flex">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ),
        )}
      </section>
    </>
  );
}
