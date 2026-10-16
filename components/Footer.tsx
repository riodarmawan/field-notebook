// Komponen footer, dipakai di layout.tsx sebagai <Footer />.
// Tanda [ ... ] adalah placeholder, ganti dengan data Anda sendiri.
export default function Footer() {
  return (
    // flex-col = tersusun ke bawah di HP, md:flex-row = berjajar ke samping di layar lebar
    <footer className="mt-32 flex flex-col gap-2 border-t border-ink/30 px-6 py-8 font-mono text-xs tracking-wider text-muted md:flex-row md:justify-between md:px-24">
      <span>[YOUR EMAIL]</span>
      <span>Written daily, published weekly.</span>
      <span>[GITHUB] · [LINKEDIN]</span>
    </footer>
  );
}
