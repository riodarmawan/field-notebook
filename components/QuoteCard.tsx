"use client";

import { useEffect, useState } from "react";
import core from "@/lib/quotes.json";
import { parseKey, useToday } from "@/lib/entries";

// Sumber, status lisensi, dan cara menghapusnya: lib/quotes-NOTICE.md
//
// 100 ribu kutipan itu sekitar 15 MB, terlalu besar untuk diunduh semuanya demi satu kutipan sehari.
// Jadi data dipecah per tema jadi potongan 2.000 kutipan di public/quotes/ (tema-0.json, tema-1.json, ...)
// dan browser hanya mengambil potongan yang berisi kutipan hari ini (sekitar 250 KB).
type Quote = { kind: string; text: string; author: string; extra?: string };
type Row = [string, string] | [string, string, string]; // [teks, pengarang] atau [teks, pengarang, sumber]
type Meta = { size: number; kinds: Record<string, number> }; // size = isi satu potongan, kinds = jumlah per tema

// Tema bergiliran supaya tidak didominasi satu tema.
const KIND_ORDER = ["philosophy", "literature", "tech", "science", "humor", "life", "love"];

// Satu file hanya diunduh sekali per kunjungan (hasilnya disimpan di sini), dan diulang kalau sempat gagal.
const cache = new Map<string, Promise<unknown>>();
function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(path).then((r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    });
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return p as Promise<T>;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// Langkah yang tidak punya faktor sama dengan jumlah kutipan: urutannya terasa acak dan melompat
// antar potongan, tapi tetap menjangkau semua kutipan sebelum mengulang.
function stepFor(total: number, start: number) {
  let step = start;
  while (gcd(step, total) !== 1) step++;
  return step;
}

// n = nomor hari + angka acak, jadi kutipan berbeda tiap kunjungan.
async function pickRemote(n: number): Promise<Quote> {
  const meta = await getJson<Meta>("/quotes/meta.json");
  const kinds = KIND_ORDER.filter((k) => meta.kinds[k]);
  const kind = kinds[n % kinds.length];
  const total = meta.kinds[kind];
  const i = (Math.floor(n / kinds.length) * stepFor(total, 7919)) % total;
  const shard = await getJson<Row[]>(`/quotes/${kind}-${Math.floor(i / meta.size)}.json`);
  const [text, author, extra] = shard[i % meta.size];
  return { kind, text, author, extra };
}

// Cadangan kalau potongan gagal diambil: 248 kutipan terverifikasi yang ikut dibundel (lib/quotes.json).
type CoreQuote = { kind: string; text: string; author: string; work?: string; translator?: string; role?: string };
const localPools = ["philosophy", "literature", "tech"].map((k) => (core as CoreQuote[]).filter((q) => q.kind === k));
function pickLocal(n: number): Quote {
  const list = localPools[n % localPools.length];
  const c = list[(Math.floor(n / localPools.length) * stepFor(list.length, 11)) % list.length];
  const extra = c.role ?? (c.work && `${c.work}${c.translator ? `, trans. ${c.translator}` : ""}`);
  return { kind: c.kind, text: c.text, author: c.author, extra };
}

const randomN = () => Math.floor(Math.random() * 10_000_000);

export default function QuoteCard() {
  const today = useToday(); // "" di server: kutipan baru dipilih setelah tampil di browser
  const [extra, setExtra] = useState(randomN); // angka acak baru tiap halaman dibuka dan tiap "Another one" ditekan
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!today) return;
    const n = Math.floor(parseKey(today).getTime() / 86400000) + extra;
    let live = true;
    pickRemote(n)
      .catch(() => pickLocal(n))
      .then((q) => live && setQuote(q)); // kutipan lama tetap tampil sampai yang baru siap
    return () => {
      live = false;
    };
  }, [today, extra]);

  return (
    // min-h menjaga tinggi tetap sama sebelum kutipan muncul, supaya halaman tidak melompat
    <section className="mt-20 min-h-[190px] border-y border-dashed border-ink/40 py-8">
      {quote && (
        <figure key={quote.text} aria-live="polite" className="fade-up">
          <blockquote className="max-w-4xl font-serif text-2xl leading-snug text-pretty italic md:text-3xl">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="mt-4 font-mono text-xs tracking-widest text-muted uppercase">
            — {[quote.author, quote.extra].filter(Boolean).join(" · ")}
          </figcaption>
          <button
            type="button"
            onClick={() => setExtra(randomN())}
            className="mt-5 min-h-11 cursor-pointer text-sm font-medium text-terracotta"
          >
            Another one →
          </button>
        </figure>
      )}
    </section>
  );
}
