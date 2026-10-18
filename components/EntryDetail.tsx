"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  REVIEW_STEPS,
  deleteEntry,
  formatMinutes,
  formatHours,
  formatShort,
  getQuestions,
  pad,
  parseKey,
  publishEntry,
  reviewEntry,
  useEntries,
  useLoaded,
  useProjects,
  useSignedIn,
  useToday,
  youtubeEmbed,
} from "@/lib/entries";

const tagBox = "border border-ink px-2.5 py-1.5 font-mono text-xs uppercase";
const reviewButton = "min-h-[52px] cursor-pointer rounded-full border-[1.5px] border-on-slab px-[22px] text-[15px] font-semibold";

// Halaman baca satu entri: video, tiga baris, catatan, proyek, review, dan halaman sebelum/sesudahnya.
export default function EntryDetail() {
  const router = useRouter();
  const n = Number(useSearchParams().get("n"));
  const entries = useEntries();
  const today = useToday();
  const loaded = useLoaded();
  const projects = useProjects();
  const signedIn = useSignedIn();
  const [res, setRes] = useState<"ok" | "fuzzy" | null>(null);
  const [error, setError] = useState("");

  if (!today || !loaded) return null; // masih di server / belum selesai mengambil dari Supabase

  const pages = entries.filter((e) => e.kind === "page");
  const e = pages.find((p) => p.page === n);
  if (!e) {
    return (
      <p className="py-24 font-serif text-xl text-ink-soft">
        This page doesn&apos;t exist, or it is still a draft.{" "}
        <Link href="/tracker" className="text-terracotta underline">Back to the log</Link>.
      </p>
    );
  }

  const published = pages.filter((p) => p.published);
  const prev = published.filter((p) => p.page < e.page).at(-1);
  const next = published.find((p) => p.page > e.page);
  const embed = e.video ? youtubeEmbed(e.video) : null;
  const question = getQuestions(entries).find((q) => q.page === e.page);
  const project = projects.find((p) => p.no === e.project) ?? null;
  const sessions = published.filter((p) => p.project === e.project);
  const sessionNo = sessions.findIndex((p) => p.page === e.page) + 1;
  const projectMinutes = sessions.reduce((sum, p) => sum + p.minutes, 0);

  const reviewStage =
    res === "fuzzy"
      ? "BACK TOMORROW"
      : e.stage >= REVIEW_STEPS.length
        ? "REVIEW COMPLETE"
        : e.due <= today
          ? `DUE TODAY (DAY ${REVIEW_STEPS[e.stage]})`
          : `NEXT REVIEW ${formatShort(e.due)}`;
  const reviewNote =
    res === "ok"
      ? "Nice — the gap before the next review gets longer."
      : res === "fuzzy"
        ? "No problem. Reread the three lines above; this page returns tomorrow."
        : "Answer in your head first, then be honest.";

  // Tunggu Supabase menyimpan dulu; baru tampilan berubah.
  async function answer(ok: boolean) {
    try {
      await reviewEntry(e!.page, ok);
      setRes(ok ? "ok" : "fuzzy");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete page ${pad(e!.page, 2)} "${e!.title}"? This cannot be undone.`)) return;
    try {
      await deleteEntry(e!.page);
      router.push("/tracker");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  async function publish() {
    try {
      await publishEntry(e!.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  const lineCard = "border-[1.5px] border-ink bg-paper px-5 py-[18px]";
  const lineLabel = "mb-2 font-mono text-[11px] tracking-widest text-terracotta";
  const lineText = "font-serif text-lg leading-normal";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-14">
        <Link href="/tracker" className="text-sm font-medium text-terracotta">← Back to the log</Link>
        <p className="font-mono text-xs tracking-widest text-muted">
          PAGE {pad(e.page, 2)} OF {pad(pages.length, 2)} · {e.published ? "PUBLISHED" : "DRAFT"}
        </p>
      </div>

      {!e.published && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-[1.5px] border-dashed border-ink px-6 py-4">
          <p className="font-serif text-lg text-ink-soft">This page is a draft. Only you can see it.</p>
          <button
            type="button"
            onClick={publish}
            className="min-h-11 cursor-pointer rounded-full bg-terracotta px-6 text-sm font-semibold text-on-accent"
          >
            Publish this page
          </button>
        </div>
      )}

      {signedIn && (
        <div className="mt-6 flex gap-5 text-sm font-medium">
          <Link href={`/edit?n=${e.page}`} className="text-terracotta">Edit this page</Link>
          <button type="button" onClick={remove} className="cursor-pointer text-muted">Delete</button>
        </div>
      )}

      {error && <p role="alert" className="mt-6 font-serif text-base text-terracotta">{error}</p>}

      {/* Judul */}
      <section className="mt-10 grid items-end gap-x-6 gap-y-4 md:grid-cols-12">
        <p className="font-display text-[100px] leading-[0.8] text-terracotta md:col-span-2 md:text-[170px]">
          {pad(e.page, 2)}
        </p>
        <div className="flex flex-col gap-[18px] pb-2 md:col-span-10">
          <p className="font-mono text-[13px] tracking-widest text-muted">
            {parseKey(e.date)
              .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              .toUpperCase()}{" "}
            · {formatMinutes(e.minutes)} OF STUDY
          </p>
          <h1 className="font-display text-5xl leading-none tracking-[-0.02em] text-balance md:text-7xl">
            {e.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            {e.skills.map((s) => (
              <span key={s} className={tagBox}>{s}</span>
            ))}
            {e.featured && (
              <span className="bg-terracotta px-2.5 py-1.5 font-mono text-xs text-on-accent">★ FEATURED</span>
            )}
            {project && (
              <Link href="/" className="ml-2 text-sm font-medium text-terracotta">→ Part of {project.name}</Link>
            )}
            {e.answers > 0 && (
              <Link href={`/read?n=${e.answers}`} className="ml-2 text-sm font-medium text-moss">
                ✓ Answers the question from page {pad(e.answers, 2)}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Video + tiga baris. Tanpa video, tiga baris memakai lebar penuh. */}
      <section className="mt-14 grid items-start gap-x-6 gap-y-8 md:grid-cols-12">
        {e.video && (
          <div className="md:col-span-8">
            {embed ? (
              <iframe
                src={embed}
                title="Progress video"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="aspect-video w-full border-[1.5px] border-ink bg-slab"
              />
            ) : (
              <a
                href={e.video}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-video items-center justify-center border-[1.5px] border-ink bg-slab font-mono text-sm text-cream"
              >
                Watch the progress video ↗
              </a>
            )}
          </div>
        )}
        <div className={e.video ? "md:col-span-4 md:col-start-9" : "md:col-span-12"}>
          <p className="mb-[18px] font-mono text-xs tracking-widest text-terracotta">THE THREE LINES</p>
          <div className={`grid gap-[18px] ${e.video ? "" : "md:grid-cols-3"}`}>
            <div className={lineCard}>
              <p className={lineLabel}>1 · DISCOVERED</p>
              <p className={lineText}>{e.discovered}</p>
            </div>
            <div className={lineCard}>
              <div className="flex items-baseline justify-between">
                <p className={lineLabel}>2 · STILL CONFUSING</p>
                {question?.answeredBy ? (
                  <span className="mb-2 bg-moss px-1.5 py-0.5 font-mono text-[10px] text-cream">✓ ANSWERED</span>
                ) : null}
              </div>
              <p className={`${lineText} ${e.confused ? "" : "text-muted italic"}`}>
                {e.confused || "Nothing left open."}
              </p>
              {question?.answeredBy ? (
                <Link
                  href={`/read?n=${question.answeredBy}`}
                  className="mt-2.5 inline-block font-mono text-[11px] tracking-[0.06em] text-terracotta"
                >
                  ANSWERED ON PAGE {pad(question.answeredBy, 2)} →
                </Link>
              ) : null}
            </div>
            <div className={lineCard}>
              <p className={lineLabel}>3 · NEXT STEP</p>
              <p className={`${lineText} ${e.next ? "" : "text-muted italic"}`}>{e.next || "—"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catatan + proyek */}
      {(e.notes || sessionNo > 0) && (
        <section className="mt-16 grid items-start gap-x-6 gap-y-10 md:grid-cols-12">
          {e.notes && (
            <div className="flex flex-col gap-[18px] md:col-span-7">
              <p className="font-mono text-xs tracking-widest text-muted">NOTES</p>
              {e.notes.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="font-serif text-xl leading-[1.65] whitespace-pre-line text-pretty">{p}</p>
              ))}
            </div>
          )}
          {sessionNo > 0 && project && (
            <Link
              href="/"
              className="flex flex-col gap-2.5 border-[1.5px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--c-shadow)] md:col-span-4 md:col-start-9"
            >
              <p className="font-mono text-[11px] tracking-widest text-terracotta">PART OF A PROJECT</p>
              <p className="font-display text-[30px] leading-[1.1]">{project.name}</p>
              <p className="font-mono text-xs text-muted">
                THIS IS SESSION {pad(sessionNo, 2)} OF {pad(sessions.length, 2)} · {formatHours(projectMinutes)} H TOTAL
              </p>
              <div className="flex gap-1">
                {sessions.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-2 flex-1 border border-terracotta ${
                      i + 1 < sessionNo ? "bg-terracotta/50" : i + 1 === sessionNo ? "bg-terracotta" : ""
                    }`}
                  />
                ))}
              </div>
            </Link>
          )}
        </section>
      )}

      {/* Proof of work: gambar bisa dibuka ukuran penuh, PDF dibuka di tab baru */}
      {e.attachments.length > 0 && (
        <section className="mt-16">
          <p className="mb-[18px] font-mono text-xs tracking-widest text-muted">PROOF OF WORK</p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {e.attachments.map((url) =>
              url.endsWith(".pdf") ? (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-40 items-center justify-center border-[1.5px] border-ink bg-paper font-mono text-sm text-terracotta"
                >
                  Open PDF ↗
                </a>
              ) : (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block border-[1.5px] border-ink bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element -- situs statis, tanpa optimasi gambar */}
                  <img src={url} alt="Proof of work" loading="lazy" className="h-40 w-full object-cover" />
                </a>
              ),
            )}
          </div>
        </section>
      )}

      {/* Review: hanya pemilik */}
      {signedIn && e.published && (
        <section className="mt-18 grid items-center gap-8 bg-slab px-6 py-8 text-on-slab md:grid-cols-[minmax(0,1fr)_auto] md:px-9">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-widest text-blush">SPACED REVIEW · {reviewStage}</p>
            <p className="font-display text-[38px] leading-[1.15]">
              Without looking: can you explain <span className="text-blush italic">&ldquo;{e.title}&rdquo;</span> in one sentence?
            </p>
            <p className="font-serif text-base text-sand italic">{reviewNote}</p>
          </div>
          <div className="flex min-w-[220px] flex-col gap-3">
            <button
              type="button"
              disabled={!!res}
              onClick={() => answer(true)}
              className={`${reviewButton} ${res === "ok" ? "bg-on-slab text-slab" : ""}`}
            >
              I remember
            </button>
            <button
              type="button"
              disabled={!!res}
              onClick={() => answer(false)}
              className={`${reviewButton} ${res === "fuzzy" ? "border-blush bg-blush text-slab" : ""}`}
            >
              Fuzzy — I&apos;ll reread
            </button>
          </div>
        </section>
      )}

      {/* Sebelumnya / berikutnya */}
      <nav className="mt-14 grid border-y border-t-2 border-y-ink/35 border-t-ink sm:grid-cols-2">
        {prev ? (
          <Link href={`/read?n=${prev.page}`} className="flex flex-col gap-1.5 py-6 pr-6 sm:border-r sm:border-ink/35">
            <span className="font-mono text-[11px] tracking-widest text-muted">← PREVIOUS · PAGE {pad(prev.page, 2)}</span>
            <span className="font-display text-[28px] text-ink">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/read?n=${next.page}`} className="flex flex-col gap-1.5 py-6 pl-6 sm:text-right">
            <span className="font-mono text-[11px] tracking-widest text-muted">NEXT · PAGE {pad(next.page, 2)} →</span>
            <span className="font-display text-[28px] text-ink">{next.title}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
