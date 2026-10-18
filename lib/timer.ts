// Timer belajar. Disimpan di localStorage, jadi tetap jalan saat pindah halaman,
// menutup tab, atau memuat ulang. Yang disimpan bukan "detik ke-berapa", tapi
// kapan timer mulai (jam dinding). Dari situ waktu dihitung ulang setiap saat,
// jadi tidak ada yang "terlewat" kalau tab di background.
//
// Catatan: waktu tetap berjalan saat komputer tidur. Kalau lupa menghentikan,
// koreksi dengan isian jam/menit manual di form.

import { useSyncExternalStore } from "react";

const KEY = "field-notebook-timer";
const CHANGED = "timer-changed";

// base = milidetik yang sudah terkumpul sebelum jeda. startedAt = jam mulai (ms), null = sedang berhenti.
type Saved = { base: number; startedAt: number | null };

function read() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): Saved {
  try {
    const v = JSON.parse(raw);
    if (typeof v.base === "number") {
      return { base: Math.max(0, v.base), startedAt: typeof v.startedAt === "number" ? v.startedAt : null };
    }
  } catch {}
  return { base: 0, startedAt: null };
}

function write(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  window.dispatchEvent(new Event(CHANGED)); // kabari komponen lain di tab ini
}

const elapsed = (s: Saved, now: number) => s.base + (s.startedAt ? Math.max(0, now - s.startedAt) : 0);

export const timer = {
  start() {
    const s = parse(read());
    if (s.startedAt === null) write({ base: s.base, startedAt: Date.now() });
  },
  pause() {
    write({ base: elapsed(parse(read()), Date.now()), startedAt: null });
  },
  reset() {
    write({ base: 0, startedAt: null });
  },
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback); // tab lain mengubah timer
  window.addEventListener(CHANGED, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGED, callback);
  };
}

// Detak per detik, hanya aktif selama timer berjalan.
function subscribeTick(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
const noTick = () => () => {};
const nowSeconds = () => Math.floor(Date.now() / 1000);

// ms = waktu terkumpul. Di server selalu 0 (belum ada localStorage).
export function useTimer() {
  const saved = parse(useSyncExternalStore(subscribe, read, () => ""));
  const running = saved.startedAt !== null;
  const seconds = useSyncExternalStore(running ? subscribeTick : noTick, nowSeconds, () => 0);
  return { running, ms: running ? elapsed(saved, Math.max(seconds * 1000, saved.startedAt ?? 0)) : saved.base };
}

// 3725000 -> "1:02:05"
export function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${Math.floor(s / 3600)}:${mm}:${ss}`;
}
