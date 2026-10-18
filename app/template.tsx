// Tidak seperti layout.tsx, template dibuat ulang di setiap pindah halaman,
// jadi animasi masuknya berjalan lagi tiap kali.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
