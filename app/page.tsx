// page.tsx di folder app/ = halaman untuk URL "/".
// (app/tracker/page.tsx = URL "/tracker". Nama folder = URL.)
// Isinya cuma satu fungsi yang me-return HTML. Belum ada logika.
//
// Cara baca className (Tailwind): satu kata = satu aturan CSS.
//   px-6 = padding kiri-kanan, mt-10 = margin atas, text-6xl = ukuran font besar.
//   "md:px-24" = pakai px-24 hanya di layar lebar (md ke atas).

export default function Home() {
  return (
    <div className="px-6 md:px-24">
      {/* Bagian atas: judul besar */}
      <section className="pt-16 md:pt-28">
        <p className="font-mono text-[13px] tracking-[0.12em] text-terracotta">
          [YOUR NAME] — [YOUR FIELD]
        </p>
        <h1 className="mt-7 max-w-5xl font-display text-6xl leading-[0.92] tracking-tight md:text-[132px]">
          Things I made,
          <br />
          <span className="italic text-terracotta">and how I learned</span> to
          make them.
        </h1>
        <p className="mt-10 max-w-md font-serif text-lg leading-relaxed text-ink-soft">
          Katalog karya yang sudah selesai, berdampingan dengan log harian apa
          yang saya pelajari setiap hari.
        </p>
      </section>

      {/* Bagian statistik: 3 kotak. Angkanya masih placeholder, nanti diganti data asli. */}
      {/* grid-cols-2 = 2 kolom di HP, md:grid-cols-3 = 3 kolom di layar lebar */}
      <section className="mt-24 grid grid-cols-2 gap-6 border-t-2 border-ink py-8 md:grid-cols-3">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted">
            PAGES WRITTEN
          </p>
          <p className="font-display text-6xl">[000]</p>
        </div>
        <div>
          <p className="font-mono text-xs tracking-widest text-muted">
            CURRENT STREAK
          </p>
          <p className="font-display text-6xl">[00]</p>
        </div>
        <div>
          <p className="font-mono text-xs tracking-widest text-muted">
            HOURS STUDIED
          </p>
          <p className="font-display text-6xl">[000]</p>
        </div>
      </section>
    </div>
  );
}
