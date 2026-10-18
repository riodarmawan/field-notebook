// URL "/entry" = halaman baru. Formnya ada di components/EntryForm.tsx
// (dipakai juga oleh "/edit" untuk mengubah halaman yang sudah ada).

import EntryForm from "@/components/EntryForm";

export default function EntryPage() {
  return <EntryForm />;
}
