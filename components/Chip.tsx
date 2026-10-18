// Tombol pilihan (filter, skill, durasi, proyek). Bulat secara bawaan, `square` untuk kotak.
export default function Chip({
  label,
  active,
  onClick,
  mono = false,
  square = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  mono?: boolean;
  square?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 cursor-pointer border-[1.5px] border-ink px-5 text-sm font-medium ${
        square ? "" : "rounded-full"
      } ${mono ? "font-mono text-[13px]" : ""} ${active ? "bg-ink text-cream" : "text-ink"}`}
    >
      {label}
    </button>
  );
}
