"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import EntryForm from "@/components/EntryForm";
import { useEntries, useLoaded } from "@/lib/entries";

// Mencari halaman dari "?n=", lalu memberikannya ke form.
// Pengunjung belum login ditangani oleh EntryForm (menampilkan ajakan login).
export default function EditEntry() {
  const n = Number(useSearchParams().get("n"));
  const entries = useEntries();
  const loaded = useLoaded();

  if (!loaded) return null;
  const entry = entries.find((e) => e.kind === "page" && e.page === n);
  if (!entry) {
    return (
      <p className="py-24 font-serif text-xl text-ink-soft">
        This page doesn&apos;t exist. <Link href="/tracker" className="text-terracotta underline">Back to the log</Link>.
      </p>
    );
  }
  // key = id: pindah ke halaman lain memulai form dari nol
  return <EntryForm key={entry.id} editing={entry} />;
}
