import { formatHours, getStats } from "@/lib/entries";

// Warna batang dari yang terbanyak (paling pekat) ke yang tersedikit
const SHADES = ["bg-terracotta", "bg-terracotta/75", "bg-terracotta/55", "bg-terracotta/40", "bg-terracotta/30"];

export default function HoursBySkill({ stats }: { stats: ReturnType<typeof getStats> }) {
  const rows = [...stats.minutesBySkill]
    .map(([name, minutes]) => ({ name, minutes }))
    .filter((r) => r.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
  const max = rows[0]?.minutes ?? 1;

  return (
    <div className="border-[1.5px] border-ink bg-paper p-7">
      <p className="mb-2 font-mono text-xs tracking-widest text-terracotta">WHERE THE HOURS WENT</p>
      <h2 className="mb-5 font-display text-[32px]">Hours by skill</h2>

      {rows.length === 0 && (
        <p className="font-serif text-[17px] text-ink-soft italic">
          Hours show up here after your first page.
        </p>
      )}

      {rows.map((r, i) => (
        <div key={r.name} className="mb-4 flex flex-col gap-1.5">
          <p className="flex justify-between text-sm font-medium">
            <span>{r.name}</span>
            <span className="font-mono text-xs text-muted">{formatHours(r.minutes)} h</span>
          </p>
          <div className="h-2.5 bg-ink/8">
            <div
              className={`grow-x h-full ${SHADES[Math.min(i, SHADES.length - 1)]}`}
              style={{ width: `${(r.minutes / max) * 100}%`, animationDelay: `${i * 80}ms` }}
            />
          </div>
        </div>
      ))}
      <p className="font-serif text-sm text-muted italic">
        An entry can count toward more than one skill.
      </p>
    </div>
  );
}
