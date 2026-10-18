"use client";

import Link from "next/link";
import { useState } from "react";
import Chip from "@/components/Chip";
import { formatHours, pad, useEntries, useLoaded, useProjects, useSignedIn } from "@/lib/entries";

// Posisi dan ukuran kartu di grid (hanya di layar lebar), diulang bergantian untuk
// proyek ke-1, 2, 3, 4, lalu kembali ke pola pertama.
// `cover` = tinggi + warna sampul kalau proyek belum punya gambar.
const layouts = [
  { box: "md:col-span-7", cover: "h-[460px] bg-tan-1", titleSize: "text-[40px]" },
  { box: "md:col-start-8 md:col-span-5 md:mt-[120px]", cover: "h-[340px] bg-tan-2", titleSize: "text-[34px]" },
  { box: "md:col-span-5", cover: "h-[340px] bg-tan-3", titleSize: "text-[34px]" },
  { box: "md:col-start-6 md:col-span-7 md:mt-20", cover: "h-[420px] bg-tan-4", titleSize: "text-[40px]" },
];

export default function Catalog() {
  const entries = useEntries();
  const projects = useProjects();
  const loaded = useLoaded();
  const signedIn = useSignedIn();
  const [filter, setFilter] = useState("All"); // skill yang sedang dipilih

  // Filter hanya menampilkan skill yang benar-benar dipakai oleh proyek.
  const skills = [...new Set(projects.map((p) => p.skill).filter(Boolean))];
  const shown = projects.filter((p) => filter === "All" || p.skill === filter);

  return (
    <section className="mt-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3.5 font-mono text-[13px] tracking-[0.12em] text-terracotta">
            INDEX OF WORK
          </p>
          <h2 className="font-display text-6xl leading-none tracking-[-0.02em] md:text-7xl">
            The catalog
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {skills.length > 1 &&
            ["All", ...skills].map((s) => (
              <Chip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
            ))}
          {signedIn && (
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-dashed border-terracotta px-5 text-sm font-medium text-terracotta"
            >
              Manage projects
            </Link>
          )}
        </div>
      </div>

      {loaded && projects.length === 0 && (
        <p className="mt-14 font-serif text-xl text-ink-soft">
          {signedIn ? (
            <>
              No projects yet.{" "}
              <Link href="/projects" className="text-terracotta underline">Add your first one</Link>.
            </>
          ) : (
            "Projects are on their way."
          )}
        </p>
      )}

      <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-[72px] md:grid-cols-12">
        {shown.map((p, i) => {
          const l = layouts[i % layouts.length];
          // Sesi = halaman terbit yang ditautkan ke proyek ini
          const sessions = entries.filter(
            (e) => e.kind === "page" && e.published && e.project === p.no,
          );
          const minutes = sessions.reduce((sum, e) => sum + e.minutes, 0);
          return (
            <article key={p.id} className={`reveal flex flex-col gap-4 ${l.box}`}>
              <div
                className={`relative flex items-center justify-center overflow-hidden border-[1.5px] border-ink ${l.cover}`}
              >
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- situs statis, tanpa optimasi gambar
                  <img src={p.cover} alt={p.name} className="size-full object-cover" />
                ) : (
                  <span className="px-6 text-center font-display text-3xl text-muted/70 italic">
                    {p.name}
                  </span>
                )}
                <span className="absolute top-4 left-4 border border-ink bg-cream px-2.5 py-1.5 font-mono text-xs">
                  No. {pad(p.no, 2)}
                </span>
                {p.inProgress && (
                  <span className="absolute top-4 right-4 bg-terracotta px-2.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-on-accent">
                    IN PROGRESS
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-6">
                <h3 className={`font-display tracking-tight ${l.titleSize}`}>{p.name}</h3>
                <span className="font-mono text-xs tracking-[0.08em] text-muted">
                  {[p.skill.toUpperCase(), p.year].filter(Boolean).join(" · ")}
                </span>
              </div>
              {p.about && (
                <p className="max-w-[560px] font-serif text-[17px] leading-normal text-ink-soft">
                  {p.about}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-ink/40 pt-3.5">
                <p className="font-mono text-xs tracking-[0.06em]">
                  BUILT FROM{" "}
                  <span className="text-terracotta">{pad(sessions.length, 2)} SESSIONS</span>
                  {p.inProgress && " SO FAR"} · {formatHours(minutes)} H
                </p>
                <span className="flex gap-4 text-sm font-medium text-terracotta">
                  <Link href="/tracker">See the pages →</Link>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer">Visit ↗</a>
                  )}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
