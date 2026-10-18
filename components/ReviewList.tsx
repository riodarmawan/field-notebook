"use client";

import Link from "next/link";
import { useState } from "react";
import { type Entry, daysBetween, formatShort, pad, reviewEntry } from "@/lib/entries";

const button = "min-h-10 cursor-pointer rounded-full border-[1.5px] border-on-slab px-4 text-[13px] font-medium disabled:cursor-default";

// Daftar "Due for review today" di Tracker.
export default function ReviewList({ entries, today }: { entries: Entry[]; today: string }) {
  // Hasil jawaban selama kunjungan ini, supaya kartu tidak langsung hilang setelah dijawab.
  const [results, setResults] = useState<Record<number, "ok" | "fuzzy">>({});

  const items = entries.filter(
    (e) =>
      e.kind === "page" && e.published && ((e.due !== "" && e.due <= today) || results[e.page]),
  );

  const [error, setError] = useState("");

  // Tunggu Supabase menyimpan dulu; baru kartu menampilkan hasilnya.
  async function answer(page: number, ok: boolean) {
    try {
      await reviewEntry(page, ok);
      setResults((r) => ({ ...r, [page]: ok ? "ok" : "fuzzy" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    }
  }

  return (
    <div className="bg-slab px-8 py-7 text-on-slab">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs tracking-widest text-blush">SPACED REVIEW</p>
        <p className="font-mono text-[11px] text-sand">Pages return after 1, 3 and 7 days</p>
      </div>
      <h2 className="mb-5 font-display text-4xl">Due for review today</h2>

      {error && <p role="alert" className="mb-3 font-serif text-base text-blush">{error}</p>}

      {items.length === 0 && (
        <p className="border-t border-on-slab/20 pt-5 font-serif text-lg text-sand italic">
          Nothing due today. Stamped pages come back here the next day.
        </p>
      )}

      {items.map((e) => {
        const res = results[e.page];
        const ago = daysBetween(e.date, today);
        return (
          <div
            key={e.id}
            className="grid gap-x-5 gap-y-3 border-t border-on-slab/20 py-[18px] sm:grid-cols-[76px_1fr]"
          >
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[40px] leading-[0.9] text-blush">
                {pad(e.page, 2)}
              </span>
              <span className="font-mono text-[10px] tracking-[0.06em] text-sand">
                {ago === 0 ? "TODAY" : `${ago} DAY${ago > 1 ? "S" : ""} AGO`}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="font-serif text-lg leading-snug italic">
                Without looking: can you explain &ldquo;{e.title}&rdquo; in one sentence?
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={!!res}
                  onClick={() => answer(e.page, true)}
                  className={`${button} ${res === "ok" ? "bg-on-slab text-slab" : ""}`}
                >
                  I remember
                </button>
                <button
                  type="button"
                  disabled={!!res}
                  onClick={() => answer(e.page, false)}
                  className={`${button} ${res === "fuzzy" ? "border-blush bg-blush text-slab" : ""}`}
                >
                  Fuzzy — reread
                </button>
                <Link href={`/read?n=${e.page}`} className="ml-1.5 text-[13px] text-blush">
                  Open page →
                </Link>
                {res && (
                  <span className="font-mono text-[11px] text-sand sm:ml-auto">
                    {res === "fuzzy"
                      ? "BACK TOMORROW"
                      : e.due
                        ? `NEXT: ${formatShort(e.due)}`
                        : "REVIEW COMPLETE"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
