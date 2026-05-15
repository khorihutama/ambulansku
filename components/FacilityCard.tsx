import type { NearbyFacility } from "@/types";

interface FacilityCardProps {
  facility: NearbyFacility;
  rank: number;
}

export default function FacilityCard({ facility, rank }: FacilityCardProps) {
  const mapsUrl = `https://maps.google.com/?q=${facility.geometry.location.lat},${facility.geometry.location.lng}`;
  const isOpen = facility.opening_hours?.open_now;

  return (
    <div className="bg-[#1B2A3B] rounded-2xl p-3 sm:p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#8899AA] text-xs font-bold">#{rank}</span>
            {isOpen !== undefined && (
              <span
                className={`text-xs font-semibold ${isOpen ? "text-[#2DC653]" : "text-[#E63946]"}`}
              >
                {isOpen ? "● Buka" : "● Tutup"}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm sm:text-base leading-tight truncate">
            {facility.name}
          </h3>
          <p className="text-[#8899AA] text-xs mt-0.5 sm:mt-1 truncate">
            {facility.vicinity}
          </p>
        </div>
        {facility.distance !== undefined && (
          <span className="text-[#F4A261] font-bold text-sm ml-3 shrink-0">
            {facility.distance < 1
              ? `${Math.round(facility.distance * 1000)}m`
              : `${facility.distance.toFixed(1)}km`}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {facility.formatted_phone_number ? (
          <a
            href={`tel:${facility.formatted_phone_number}`}
            className="flex-1 bg-[#E63946] text-white py-2.5 rounded-xl text-sm font-semibold text-center active:scale-[0.97] transition-transform touch-manipulation"
          >
            📞 Telepon
          </a>
        ) : (
          <div className="flex-1 bg-[#0D1B2A] text-[#8899AA] py-2.5 rounded-xl text-sm text-center">
            No. tidak tersedia
          </div>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#0D1B2A] text-white py-2.5 rounded-xl text-sm font-semibold text-center active:scale-[0.97] transition-transform border border-[#2A3A4B] touch-manipulation"
        >
          🗺️ Maps
        </a>
      </div>
    </div>
  );
}