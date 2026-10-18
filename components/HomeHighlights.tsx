"use client";

import Link from "next/link";
import { formatMinutes, formatShort, pad, useEntries, useProjects } from "@/lib/entries";

// Kemiringan tiap kartu, supaya terasa seperti kertas yang ditempel
const tilt = ["-rotate-[0.6deg]", "md:mt-10", "rotate-[0.5deg]"];

// "Pages worth reading": halaman terbit yang ditandai Featured.
export default function HomeHighlights() {
  const entries = useEntries();
  const projects = useProjects();
  const featured = entries
    .filter((e) => e.kind === "page" && e.published && e.featured)
    .slice(-3)
    .reverse(); // 3 terbaru, yang paling baru di kiri

  return (
    <section className="mt-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3.5 font-mono text-[13px] tracking-[0.12em] text-terracotta">
            FROM THE LOG
          </p>
          <h2 className="font-display text-6xl leading-none tracking-[-0.02em] md:text-7xl">
            Pages worth <span className="italic">reading</span>
          </h2>
        </div>
        <Link
          href="/tracker"
          className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-ink px-[22px] text-sm font-medium"
        >
          Open the whole log →
        </Link>
      </div>

      {featured.length === 0 && (
        <p className="mt-12 font-serif text-xl text-ink-soft">
          Nothing featured yet. Switch on &ldquo;Feature on Home&rdquo; when you write a page.
        </p>
      )}

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {featured.map((e, i) => (
          <Link
            key={e.id}
            href={`/read?n=${e.page}`}
            className={`lift flex flex-col gap-4 border-[1.5px] border-ink bg-paper p-7 shadow-[6px_6px_0_var(--c-shadow)] ${tilt[i]}`}
          >
            <div className="flex items-start justify-between">
              <span className="font-display text-6xl leading-[0.85] text-terracotta">
                {pad(e.page, 2)}
              </span>
              {e.video && (
                <span className="bg-ink px-2 py-1.5 font-mono text-[10px] tracking-[0.08em] text-cream">
                  ▶ VIDEO
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] tracking-[0.08em] text-muted">
              {formatShort(e.date)} · {e.skills.join(", ").toUpperCase() || "NO SKILL"} ·{" "}
              {formatMinutes(e.minutes)}
            </p>
            <h3 className="font-display text-[30px] leading-[1.1]">{e.title}</h3>
            <div className="border-l-2 border-terracotta pl-3.5">
              <p className="mb-1.5 font-mono text-[10px] tracking-widest text-terracotta">
                DISCOVERED
              </p>
              <p className="font-serif text-base leading-normal text-ink-soft italic">
                {e.discovered}
              </p>
            </div>
            {e.answers > 0 ? (
              <p className="font-mono text-[11px] text-moss">
                ✓ Answered an open question from page {pad(e.answers, 2)}
              </p>
            ) : projects.find((p) => p.no === e.project) ? (
              <p className="font-mono text-[11px] text-terracotta">
                → Part of {projects.find((p) => p.no === e.project)?.name}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
