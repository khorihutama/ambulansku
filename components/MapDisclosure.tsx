"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import type { NearbyFacility } from "@/types";

interface MapDisclosureProps {
  userLat: number;
  userLng: number;
  facilities: NearbyFacility[];
}

export default function MapDisclosure({
  userLat,
  userLng,
  facilities,
}: MapDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-labelledby="map-title"
      className="mt-4 overflow-hidden rounded-[18px] border border-hairline bg-surface"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="map-canvas"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[54px] w-full items-center justify-between gap-3 px-3.5 text-left text-[15px] font-semibold text-ink touch-manipulation"
      >
        <span id="map-title">
          {open ? "Sembunyikan peta" : "Lihat peta fasilitas"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-[18px] w-[18px] text-ink-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <p className="px-3.5 pb-3 text-[13px] leading-snug text-ink-muted">
        Peta dimuat hanya saat dibuka, supaya hasil tetap cepat di koneksi
        lambat.
      </p>
      {open && (
        <div id="map-canvas" className="h-[180px] border-t border-hairline">
          <MapView
            userLat={userLat}
            userLng={userLng}
            facilities={facilities}
          />
        </div>
      )}
    </section>
  );
}