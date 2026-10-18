"use client"; // butuh usePathname (data di browser), jadi komponen ini "client component"

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useSignedIn } from "@/lib/entries";
import { formatClock, useTimer } from "@/lib/timer";

const publicLinks = [
  { href: "/", label: "Catalog" },
  { href: "/tracker", label: "Tracker" },
];

export default function Nav() {
  const pathname = usePathname(); // URL halaman yang sedang dibuka, misal "/tracker"
  const onEntry = pathname === "/entry" || pathname === "/edit";
  const signedIn = useSignedIn();
  const clock = useTimer();
  // "New entry" dan tombol tulis hanya muncul untuk pemilik (sudah login)
  const links = signedIn
    ? [...publicLinks, { href: "/projects", label: "Projects" }, { href: "/entry", label: "New entry" }]
    : publicLinks;

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-4 pt-9">
      <div className="flex items-baseline gap-3.5">
        <Link href="/" className="font-display text-3xl tracking-tight">
          Field Notebook
        </Link>
        <span className="font-mono text-xs tracking-[0.08em] text-muted">
          VOL. 01
        </span>
      </div>
      <nav className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[15px] font-medium">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            // Link halaman yang sedang dibuka diberi garis bawah
            className={`link-u pb-1 ${
              // halaman baca (/read) dianggap bagian dari Tracker
              pathname === l.href || (l.href === "/tracker" && (pathname === "/read" || pathname === "/edit"))
                ? "border-b-2 border-terracotta"
                : ""
            }`}
          >
            {l.label}
          </Link>
        ))}
        {/* Timer yang sedang berjalan/berisi tetap terlihat di halaman lain */}
        {signedIn && !onEntry && clock.ms >= 1000 && (
          <Link href="/entry" title="Open the entry form" className="font-mono text-sm tabular-nums text-terracotta">
            ⏱ {formatClock(clock.ms)}
          </Link>
        )}
        {signedIn && (
          <Link
            href={onEntry ? "/tracker" : "/entry"}
            className={`inline-flex min-h-11 items-center rounded-full px-[22px] text-sm ${
              onEntry ? "border-[1.5px] border-ink" : "bg-ink text-cream"
            }`}
          >
            {onEntry ? "Back to log" : "Write today's page"}
          </Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
