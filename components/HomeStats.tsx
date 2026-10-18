"use client";

import { WEEK_GOAL, formatHours, getStats, pad, useEntries, useToday } from "@/lib/entries";

// Baris statistik di Home. Angkanya dihitung dari entri di localStorage.
export default function HomeStats() {
  const entries = useEntries();
  const today = useToday();
  const stats = getStats(entries, today);

  const label = "font-mono text-xs tracking-widest text-muted";
  const number = "font-display text-6xl leading-none";
  const small = "font-serif text-[15px] text-muted italic";

  return (
    <section className="mt-24 grid grid-cols-2 gap-8 border-y border-y-ink/35 border-t-2 border-t-ink py-8 md:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <p className={label}>PAGES WRITTEN</p>
        <p className={number}>{pad(stats.pageCount, 3)}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className={label}>CURRENT STREAK</p>
        <p className={number}>
          {pad(stats.streak, 2)} <span className="text-2xl text-muted italic">days</span>
        </p>
        <p className={small}>
          {stats.restLeft ? "1 rest day" : "No rest day"} left this week
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className={label}>HOURS STUDIED</p>
        <p className={number}>{pad(Math.round(stats.minutes / 60), 3)}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <p className={label}>THIS WEEK&apos;S GOAL</p>
        <p className="font-display text-[40px] leading-none">
          {stats.goalDays}{" "}
          <span className="text-[22px] text-muted italic">of {WEEK_GOAL.days} days</span>
        </p>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${WEEK_GOAL.days}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: WEEK_GOAL.days }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 rounded-xs border-[1.5px] border-terracotta ${
                i < stats.goalDays ? "bg-terracotta" : ""
              }`}
            />
          ))}
        </div>
        <p className="font-mono text-xs text-muted">
          {formatHours(stats.weekMinutes)} of {WEEK_GOAL.hours} hours
        </p>
      </div>
    </section>
  );
}
