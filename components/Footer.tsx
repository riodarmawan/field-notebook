"use client"; // membaca status login, jadi jalan di browser

import Link from "next/link";
import { signOut, useSignedIn } from "@/lib/entries";

// Komponen footer, dipakai di layout.tsx sebagai <Footer />.
export default function Footer() {
  const signedIn = useSignedIn();

  return (
    // flex-col = tersusun ke bawah di HP, md:flex-row = berjajar ke samping di layar lebar
    <footer className="mt-32 flex flex-col gap-2 border-t border-ink/35 py-6 font-mono text-xs tracking-[0.08em] text-muted md:flex-row md:justify-between">
      <span>Written daily, published weekly.</span>
      <span>
        <a
          href="https://www.linkedin.com/in/rio-d-252b84176/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          LINKEDIN
        </a>{" "}
        ·{" "}
        {signedIn ? (
          <button type="button" onClick={() => signOut()} className="cursor-pointer underline">
            SIGN OUT
          </button>
        ) : (
          <Link href="/login" className="underline">SIGN IN</Link>
        )}
      </span>
    </footer>
  );
}
