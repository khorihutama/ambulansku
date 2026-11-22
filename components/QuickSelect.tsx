interface QuickSituation {
  label: string;
  value: string;
  sublabel?: string;
  wide?: boolean;
}

const EMERGENCY_SITUATIONS: QuickSituation[] = [
  {
    label: "Kecelakaan",
    value: "Terjadi kecelakaan, butuh ambulans segera",
  },
  {
    label: "Nyeri dada / stroke",
    value: "Ada orang dengan nyeri dada atau gejala stroke",
  },
  {
    label: "Sesak napas",
    value: "Ada orang yang sesak napas berat",
  },
  {
    label: "Pingsan",
    value: "Ada orang pingsan / tidak sadarkan diri",
  },
  {
    label: "Melahirkan",
    value: "Persalinan mendesak, butuh ambulans",
    sublabel: "Persalinan mendesak",
    wide: true,
  },
];

const SCHEDULED_SITUATIONS: QuickSituation[] = [
  {
    label: "Cuci darah",
    value: "Pasien butuh transport untuk jadwal cuci darah",
  },
  {
    label: "Kontrol rutin",
    value: "Butuh transport untuk kontrol kesehatan rutin",
  },
];

interface QuickSelectProps {
  onSelect: (value: string) => void;
  disabled?: boolean;
}

function SituationChip({
  situation,
  onSelect,
  disabled,
}: {
  situation: QuickSituation;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(situation.value)}
      disabled={disabled}
      className={`flex min-h-[56px] items-center justify-between gap-2 rounded-[14px] border border-hairline bg-surface px-3 py-2.5 text-left text-[14.5px] font-semibold leading-tight text-ink transition-colors hover:bg-surface-raised disabled:opacity-50 touch-manipulation ${
        situation.wide ? "col-span-2" : ""
      }`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>{situation.label}</span>
        {situation.sublabel && (
          <span className="text-[13px] font-normal leading-snug text-ink-muted">
            {situation.sublabel}
          </span>
        )}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[15px] w-[15px] shrink-0 text-ink-dim"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}

export default function QuickSelect({
  onSelect,
  disabled,
}: QuickSelectProps) {
  return (
    <section aria-labelledby="quick-title" className="mt-[26px]">
      <h2
        id="quick-title"
        className="font-display text-[18px] font-bold leading-snug tracking-[-0.02em] text-ink"
      >
        Atau pilih situasi
      </h2>
      <p className="mt-1 text-[13px] leading-snug text-ink-muted">
        Satu ketukan, tanpa menulis.
      </p>

      <h3 className="mb-2 mt-[18px] text-xs font-bold uppercase leading-none tracking-[0.13em] text-ink-muted">
        Darurat
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {EMERGENCY_SITUATIONS.map((situation) => (
          <SituationChip
            key={situation.label}
            situation={situation}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>

      <h3 className="mb-2 mt-[18px] text-xs font-bold uppercase leading-none tracking-[0.13em] text-ink-muted">
        Terjadwal
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {SCHEDULED_SITUATIONS.map((situation) => (
          <SituationChip
            key={situation.label}
            situation={situation}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}