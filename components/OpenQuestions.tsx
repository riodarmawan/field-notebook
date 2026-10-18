import Link from "next/link";
import { type Entry, getQuestions, pad } from "@/lib/entries";

// "Still confusing — and what answered it". Hilang kalau belum ada pertanyaan sama sekali.
export default function OpenQuestions({ entries }: { entries: Entry[] }) {
  const questions = getQuestions(entries);
  if (questions.length === 0) return null;
  const open = questions.filter((q) => !q.answeredBy).length;

  return (
    <section className="mt-14 border-[1.5px] border-dashed border-ink px-6 py-7 md:px-8">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="mb-2 font-mono text-xs tracking-widest text-terracotta">OPEN QUESTIONS</p>
          <h2 className="font-display text-[32px]">
            Still confusing <span className="text-muted italic">— and what answered it</span>
          </h2>
        </div>
        <p className="font-mono text-xs text-muted">
          {open} OPEN · {questions.length - open} ANSWERED
        </p>
      </div>

      {questions.map((q) => (
        <div
          key={q.page}
          className={`flex flex-wrap items-center gap-x-[18px] gap-y-2 border-t border-ink/20 py-3.5 ${
            q.answeredBy ? "opacity-75" : ""
          }`}
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] font-display text-xl ${
              q.answeredBy
                ? "border-moss bg-moss text-cream"
                : "border-terracotta text-terracotta"
            }`}
          >
            {q.answeredBy ? "✓" : "?"}
          </span>
          <p
            className={`min-w-[200px] flex-1 font-serif text-lg ${
              q.answeredBy ? "line-through decoration-ink/40" : ""
            }`}
          >
            {q.text}
          </p>
          <span className={`font-mono text-[11px] ${q.answeredBy ? "text-moss" : "text-muted"}`}>
            {q.answeredBy
              ? `PAGE ${pad(q.page, 2)} → ANSWERED ON PAGE ${pad(q.answeredBy, 2)}`
              : `FROM PAGE ${pad(q.page, 2)}`}
          </span>
          <Link
            href={`/read?n=${q.answeredBy || q.page}`}
            className="text-[13px] font-medium text-terracotta"
          >
            {q.answeredBy ? "See answer →" : "Open →"}
          </Link>
        </div>
      ))}
    </section>
  );
}
