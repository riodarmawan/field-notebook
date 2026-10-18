# Sumber kutipan (lib/quotes.json)

**philosophy / literature** (38 kutipan): domain publik. Dikutip persis dari teks Project Gutenberg
(Marcus Aurelius, terj. Meric Casaubon 1634 · Epictetus, terj. George Long · Nietzsche, terj. Thomas Common ·
Sun Tzu, terj. Lionel Giles · Emerson · Thoreau · Austen · Wilde · Carroll · Shakespeare).
Perubahan hanya: huruf awal dikapitalkan, dan tanda "…" bila kutipan dipotong di tengah kalimat.

**tech** (kutipan lain): dari https://github.com/FullStackBulletin/tech-quotes, lisensi MIT.
Teks lisensi wajib disertakan:

MIT License

Copyright (c) 2023 Luciano Mammino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


---

# public/quotes/ (sekitar 100.000 kutipan, dipecah per tema)

Disaring dari `quotes.csv` (dataset "Quotes-500K", diunduh pengguna dalam `archive.zip`).
Tema ditentukan dari tag kategori. Kutipan terverifikasi di atas (lib/quotes.json) ikut digabung ke
tiap tema. Kolom ketiga (jika ada) = sumber/judul buku bila tertulis di dataset.

**Status lisensi: TIDAK DIKETAHUI.** Dataset ini hasil scraping situs kutipan; tidak ada berkas lisensi.
**Atribusi TIDAK diverifikasi.** Dataset banyak berisi kutipan yang salah dicatut dan kategori yang
tidak selalu tepat (mis. tokoh pop di tema filsafat).
Penyaringan yang dilakukan: tag "attributed-no-source" dibuang; penulis yang paling sering dicatut
dikeluarkan (Einstein, Twain, Churchill, Lincoln, Franklin, Wilde, Gandhi, Jobs, dll.); penulis dengan >1.500
kutipan (swa-terbit/spam) dikeluarkan; panjang 25-250 karakter; tanpa duplikat/umpatan; maksimal 60 per penulis.

Untuk menghapus seluruhnya: hapus folder public/quotes/. QuoteCard otomatis memakai 248 kutipan bawaan.
