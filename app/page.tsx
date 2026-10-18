// page.tsx di folder app/ = halaman untuk URL "/".
// Halaman ini hanya menyusun bagian-bagiannya. Bagian yang butuh data/klik
// dipisah ke komponen sendiri (HomeStats, Catalog).
//
// Cara baca className (Tailwind): satu kata = satu aturan CSS.
//   mt-10 = margin atas, text-6xl = ukuran font besar.
//   "md:col-span-8" = pakai col-span-8 hanya di layar lebar (md ke atas).

import Catalog from "@/components/Catalog";
import HomeHighlights from "@/components/HomeHighlights";
import HomeStats from "@/components/HomeStats";
import QuoteCard from "@/components/QuoteCard";

export default function Home() {
  return (
    <>
      <section className="grid grid-cols-1 gap-x-6 pt-16 md:grid-cols-12 md:pt-28">
        <div className="fade-up md:col-span-8">
          <p className="mb-7 font-mono text-[13px] tracking-[0.12em] text-terracotta">
            RIO DARMAWAN — SOFTWARE ENGINEER
          </p>
          <h1 className="font-display text-6xl leading-[0.92] tracking-[-0.03em] text-balance md:text-[132px]">
            Things I made,
            <br />
            <span className="italic text-terracotta">and how I learned</span> to
            make them.
          </h1>
        </div>
        <p className="fade-up delay-2 mt-10 max-w-md font-serif text-lg leading-relaxed text-ink-soft text-pretty md:col-span-3 md:col-start-10 md:mt-0 md:pt-40">
          A catalog of finished work, beside a daily log of what I studied each
          day — so you can see the projects and the practice behind them.
        </p>
      </section>

      <QuoteCard />
      <HomeStats />
      <HomeHighlights />
      <Catalog />
    </>
  );
}
