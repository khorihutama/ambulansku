import type { Urgency } from "@/types";

interface UrgencyPanelProps {
  urgency: Urgency;
  message: string;
  variant?: "triage" | "failed";
}

export default function UrgencyPanel({
  urgency,
  message,
  variant = "triage",
}: UrgencyPanelProps) {
  const failed = variant === "failed";
  const emergency = urgency === "emergency" || failed;

  const kicker = failed
    ? "Darurat · perkiraan aman"
    : emergency
      ? "Darurat"
      : "Terjadwal";

  const title = failed
    ? "Kami tidak bisa menganalisis situasi"
    : emergency
      ? "Segera cari bantuan"
      : "Bantuan terjadwal";

  const body = failed
    ? "Layanan triage sedang bermasalah. Untuk keselamatan, anggap ini darurat sampai ada informasi lain."
    : message;

  return (
    <section
      aria-labelledby="urgency-title"
      className={`rounded-[18px] border ${
        emergency
          ? "border-[#4a2028] border-l-4 border-l-danger bg-[#241318]"
          : "border-[#4a3624] border-l-4 border-l-amber bg-[#241d16]"
      } p-4`}
    >
      <p
        className={`mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] ${
          emergency ? "text-danger-ink" : "text-amber"
        }`}
      >
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full bg-current"
        />
        {kicker}
      </p>
      <h1
        id="urgency-title"
        className="font-display text-[24px] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink text-balance"
      >
        {title}
      </h1>
      <p className="mt-2 text-[15.5px] leading-relaxed text-[#E9EDF2]">
        {body}
      </p>
      <p
        className={`mt-3 border-t pt-3 text-[13px] leading-snug text-ink-muted ${
          emergency ? "border-danger-ink/25" : "border-amber/25"
        }`}
      >
        Hasil ini bukan diagnosis medis. Analisis AI hanya panduan awal; ikuti
        arahan tenaga medis. Untuk kondisi mengancam nyawa, hubungi 119.
      </p>
    </section>
  );
}