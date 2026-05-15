import type { Urgency } from "@/types";

export default function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return urgency === "emergency" ? (
    <span className="bg-[#E63946]/20 text-[#E63946] text-xs sm:text-sm font-bold px-2 py-0.5 rounded-full animate-pulse">
      🔴 DARURAT
    </span>
  ) : (
    <span className="bg-[#F4A261]/20 text-[#F4A261] text-xs sm:text-sm font-bold px-2 py-0.5 rounded-full">
      🟡 TERJADWAL
    </span>
  );
}