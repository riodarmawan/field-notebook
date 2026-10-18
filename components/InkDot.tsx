// Satu lingkaran tinta di kalender. level 0 (kosong) sampai 3 (paling pekat).
// `rest` = hari istirahat (garis putus-putus).
const LEVEL = [
  "border-ink/40 bg-transparent",
  "border-terracotta/55 bg-terracotta/35",
  "border-terracotta/80 bg-terracotta/65",
  "border-terracotta bg-terracotta",
];

export default function InkDot({
  level,
  rest = false,
  size,
  rot = 0,
  faded = false,
  title,
  delay,
}: {
  level: number;
  rest?: boolean;
  size: number;
  rot?: number;
  faded?: boolean;
  title?: string;
  delay?: number; // ms, untuk muncul bertahap
}) {
  return (
    <span
      title={title}
      style={{ width: size, height: size, animationDelay: delay ? `${delay}ms` : undefined, transform: rot ? `rotate(${rot}deg)` : undefined }}
      className={`pop box-border inline-block rounded-full border-[1.5px] ${
        rest ? "border-dashed border-terracotta bg-transparent" : LEVEL[level]
      } ${faded ? "opacity-30" : ""}`}
    />
  );
}
