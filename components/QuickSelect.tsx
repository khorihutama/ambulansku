import type { QuickSituation } from "@/types";

const QUICK_SITUATIONS: QuickSituation[] = [
  {
    icon: "\uD83D\uDEA8",
    label: "Kecelakaan",
    value: "Terjadi kecelakaan, butuh ambulans segera",
  },
  {
    icon: "\u2764\uFE0F",
    label: "Jantung / Stroke",
    value: "Ada orang dengan gejala serangan jantung atau stroke",
  },
  {
    icon: "\uD83E\uDD30",
    label: "Melahirkan",
    value: "Istri akan segera melahirkan, butuh ambulans",
  },
  {
    icon: "\uD83D\uDC89",
    label: "Cuci Darah",
    value: "Pasien butuh transport untuk jadwal cuci darah",
  },
  {
    icon: "\uD83C\uDFE5",
    label: "Kontrol Rutin",
    value: "Butuh transport untuk kontrol kesehatan rutin",
  },
  {
    icon: "\uD83D\uDC74",
    label: "Lansia Darurat",
    value: "Lansia pingsan / tidak sadarkan diri di rumah",
  },
];

interface QuickSelectProps {
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export default function QuickSelect({
  onSelect,
  disabled,
}: QuickSelectProps) {
  return (
    <>
      <p className="text-[#8899AA] text-xs uppercase tracking-widest mb-2 sm:mb-3">
        Atau pilih situasi
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {QUICK_SITUATIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSelect(s.value)}
            disabled={disabled}
            className="bg-[#1B2A3B] rounded-xl p-3 sm:p-4 text-left active:scale-[0.97] transition-transform disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            <span className="text-xl sm:text-2xl block mb-0.5 sm:mb-1">
              {s.icon}
            </span>
            <span className="text-white text-xs sm:text-sm font-medium leading-tight">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

export { QUICK_SITUATIONS };