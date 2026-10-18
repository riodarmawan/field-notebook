"use client";

import { useSyncExternalStore } from "react";

// Tema disimpan di atribut data-theme pada <html> (diatur lebih awal oleh skrip di layout.tsx).
// Komponen ini hanya membaca atribut itu dan menggantinya.
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? "light",
    () => "light", // di server belum tahu; setelah hydrate otomatis dibaca ulang
  );
  const dark = theme === "dark";

  function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-anim"); // peralihan warna halus, dilepas lagi sebentar kemudian
    root.dataset.theme = dark ? "light" : "dark";
    setTimeout(() => root.classList.remove("theme-anim"), 400);
    try {
      localStorage.setItem("theme", root.dataset.theme);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
