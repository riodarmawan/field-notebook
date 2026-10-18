// layout.tsx = "template induk" yang membungkus SEMUA halaman.
// Seperti header + footer yang sama di setiap halaman EJS.

import type { Metadata } from "next";
import {
  Instrument_Serif,
  Newsreader,
  DM_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav"; // "@/" artinya "dari folder root proyek"
import Footer from "@/components/Footer";

// ---- Font ----
// Next mengunduh font dari Google, lalu menyimpannya sebagai CSS variable
// (misal --font-instrument). Variable itu dipakai di globals.css.
// Bagian ini murni urusan tampilan, tidak ada logika.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

// Isi <title> dan <meta description> di <head>. Next yang memasangnya otomatis.
export const metadata: Metadata = {
  title: "Field Notebook",
  description: "Portfolio dan log belajar harian",
};

// Fungsi ini me-return HTML (disebut JSX).
// `children` = isi halaman yang sedang dibuka:
//   buka "/"        -> children = hasil app/page.tsx
//   buka "/tracker" -> children = hasil app/tracker/page.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Keempat variable font ditempel ke <html> supaya bisa dipakai di mana saja.
    <html
      lang="id"
      data-theme="light"
      suppressHydrationWarning // atribut data-theme diubah skrip sebelum React jalan
      className={`${instrument.variable} ${newsreader.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* Pasang tema tersimpan (atau preferensi sistem) sebelum halaman tergambar, supaya tidak berkedip terang */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()',
          }}
        />
      </head>
      {/* bg-cream = background warna cream, text-ink = warna teks ink (lihat globals.css) */}
      <body className="bg-cream font-sans text-ink antialiased">
        {/* Bungkus semua dengan padding yang sama. Kiri lebih lebar (pl-36)
            untuk memberi ruang pada garis margin merah di globals.css */}
        <div className="px-6 md:pr-24 md:pl-36">
          <Nav />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
