// URL "/edit?n=24" = ubah halaman nomor 24. Sama seperti /read, nomor dibawa lewat "?n="
// dan useSearchParams wajib dibungkus <Suspense> di situs statis.

import { Suspense } from "react";
import EditEntry from "@/components/EditEntry";

export default function EditPage() {
  return (
    <Suspense>
      <EditEntry />
    </Suspense>
  );
}
