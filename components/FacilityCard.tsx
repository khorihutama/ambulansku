import type { NearbyFacility } from "@/types";

interface FacilityCardProps {
  facility: NearbyFacility;
  rank: number;
}

function formatDistance(distance: number): string {
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(1).replace(".", ",")} km`;
}

export default function FacilityCard({ facility, rank }: FacilityCardProps) {
  const mapsUrl = `https://maps.google.com/?q=${facility.geometry.location.lat},${facility.geometry.location.lng}`;
  const isOpen = facility.opening_hours?.open_now;

  return (
    <article className="rounded-[18px] border border-hairline bg-surface p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="pt-px font-display text-[17px] font-extrabold leading-tight text-ink-dim tabular-nums"
        >
          {String(rank).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-snug tracking-[-0.015em] text-ink">
            {facility.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-ink-muted">
            {facility.vicinity}
          </p>
        </div>

        {facility.distance !== undefined && (
          <span className="shrink-0 whitespace-nowrap rounded-lg border border-[#4a3624] bg-[#2a2118] px-2 py-[5px] text-[14px] font-bold leading-tight text-amber">
            {formatDistance(facility.distance)}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
        {isOpen !== undefined && (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              isOpen ? "text-green" : "text-danger-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-current"
            />
            {isOpen ? "Buka" : "Tutup"}
          </span>
        )}
        {isOpen === false && <span>Telepon tetap bisa dihubungi</span>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {facility.formatted_phone_number ? (
          <a
            href={`tel:${facility.formatted_phone_number}`}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] border border-hairline-strong bg-surface-raised px-3 text-[15px] font-bold text-ink touch-manipulation"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[17px] w-[17px]"
            >
              <path
                fill="currentColor"
                d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"
              />
            </svg>
            Telepon
          </a>
        ) : (
          <div className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] bg-[#0d1b2a] px-3 text-[14px] text-ink-muted">
            No. tidak tersedia
          </div>
        )}

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] border border-hairline-strong px-3 text-[15px] font-bold text-ink touch-manipulation"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[17px] w-[17px]"
          >
            <path d="M5 19a2 2 0 1 1 0-4h9a3 3 0 0 0 0-6H8" />
            <path d="m10 6-3 3 3 3" />
          </svg>
          Rute
        </a>
      </div>
    </article>
  );
}