// URL "/read?n=24" = halaman baca untuk entri nomor 24.
// Entri disimpan di browser, jadi tidak bisa dibuatkan URL per entri saat build.
// Nomor halaman dibawa lewat "?n=", dan dibaca di EntryDetail.
// useSearchParams wajib dibungkus <Suspense> di situs statis.

import { Suspense } from "react";
import EntryDetail from "@/components/EntryDetail";

export default function ReadPage() {
  return (
    <Suspense>
      <EntryDetail />
    </Suspense>
  );
}
