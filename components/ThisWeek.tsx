"use client";

import InkDot from "@/components/InkDot";
import { useState } from "react";
import { WEEK_GOAL, formatHours, getStats, saveRest, useSignedIn } from "@/lib/entries";

const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];

// Kartu "This week" di Tracker: target hari, target jam, dan hari istirahat.
export default function ThisWeek({
  stats,
  today,
}: {
  stats: ReturnType<typeof getStats>;
  today: string;
}) {
  const hoursPercent = Math.min(100, (stats.weekMinutes / (WEEK_GOAL.hours * 60)) * 100);
  const signedIn = useSignedIn();
  const [error, setError] = useState("");
  const canRest = !!signedIn && !!today && stats.restLeft > 0 && !stats.kept(today);

  return (
    <div className="flex flex-col gap-5 border-[1.5px] border-ink p-7">
      <p className="font-mono text-xs tracking-widest text-terracotta">THIS WEEK</p>

      <div>
        <p className="font-display text-[52px] leading-none">
          {stats.goalDays}{" "}
          <span className="text-2xl text-muted italic">of {WEEK_GOAL.days} days</span>
        </p>
        <div
          className="mt-3 grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${WEEK_GOAL.days}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: WEEK_GOAL.days }, (_, i) => (
            <span
              key={i}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`grow-x h-3 rounded-xs border-[1.5px] border-terracotta ${
                i < stats.goalDays ? "bg-terracotta" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 flex justify-between font-mono text-xs text-muted">
          <span>HOURS</span>
          <span>
            {formatHours(stats.weekMinutes)} / {WEEK_GOAL.hours} h
          </span>
        </p>
        <div className="h-3 border-[1.5px] border-ink bg-paper">
          <div className="grow-x h-full bg-ink" style={{ width: `${hoursPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {stats.week.map((d, i) => (
          <div key={d.key} className="flex flex-col items-center gap-1.5">
            <InkDot level={d.level} rest={d.rest} size={30} delay={i * 70} />
            <span className="font-mono text-[10px] text-muted">{DAY_NAMES[i]}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-ink/40 pt-3.5 font-serif text-[15px] leading-normal text-ink-soft italic">
        One rest day a week keeps the streak alive.{" "}
        <b className="not-italic">{stats.restLeft} left.</b>
        {canRest && (
          <button
            type="button"
            onClick={() => {
              const note = window.prompt("Add a note? (optional)", "");
              if (note !== null) saveRest(note.trim()).catch((e) => setError(e.message));
            }}
            className="mt-3 block min-h-11 cursor-pointer rounded-full border-[1.5px] border-dashed border-terracotta px-5 font-sans text-sm font-medium text-terracotta not-italic"
          >
            Log today as a rest day
          </button>
        )}
        {error && <p role="alert" className="mt-2 text-sm text-terracotta not-italic">{error}</p>}
      </div>
    </div>
  );
}
