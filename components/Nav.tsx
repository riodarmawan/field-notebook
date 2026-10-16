// Komponen = fungsi yang me-return potongan HTML, seperti partial EJS.
// Dipakai di layout.tsx dengan menulis <Nav />.

// <Link> mirip <a>, tapi pindah halaman tanpa reload penuh.
import Link from "next/link";

export default function Nav() {
  return (
    <header className="flex items-center justify-between px-6 py-8 md:px-24">
      <Link href="/" className="font-display text-3xl tracking-tight">
        Field Notebook
      </Link>
      <nav className="flex items-center gap-8 text-sm font-medium">
        <Link href="/">Catalog</Link>
        <Link href="/tracker">Tracker</Link>
        {/* Halaman /entry belum dibuat (belum ada app/entry/page.tsx), jadi masih 404 */}
        <Link href="/entry">New entry</Link>
      </nav>
    </header>
  );
}
