"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FacilityCard from "@/components/FacilityCard";
import MapView from "@/components/MapView";
import UrgencyBadge from "@/components/UrgencyBadge";
import PenilaianFABWrapper from "@/components/PenilaianFABWrapper";
import type { TriageResponse } from "@/types";

function HasilContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const situation = searchParams.get("situation") ?? "";
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situation, lat, lng }),
        });
        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      } catch {
        setError("Gagal memuat hasil. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [situation, lat, lng]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl sm:text-5xl mb-4 animate-pulse">🚑</div>
          <p className="text-white font-semibold text-base sm:text-lg">
            Mencari fasilitas terdekat...
          </p>
          <p className="text-[#8899AA] text-sm mt-1">
            AI sedang menganalisis situasi
          </p>
          <div className="mt-6 flex justify-center gap-1">
            <span className="w-2 h-2 bg-[#E63946] rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-[#E63946] rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-[#E63946] rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white mb-4 text-sm sm:text-base">
            {error || "Terjadi kesalahan"}
          </p>
          <button
            onClick={() => router.back()}
            className="text-[#E63946] underline cursor-pointer text-sm sm:text-base"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] safe-top pb-24 sm:pb-8">
      <header className="px-4 sm:px-6 pt-4 sm:pt-10 pb-3 sm:pb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[#8899AA] text-xl sm:text-2xl cursor-pointer p-1 -ml-1 touch-manipulation"
          aria-label="Kembali"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-white font-bold text-base sm:text-lg truncate">
              Hasil Pencarian
            </h2>
            <UrgencyBadge urgency={data.triage.urgency} />
          </div>
          <p className="text-[#8899AA] text-xs mt-0.5">
            {data.facilities.length} fasilitas ditemukan
          </p>
        </div>
      </header>

      <div className="mx-4 sm:mx-6 mb-3 sm:mb-4 bg-[#1B2A3B] rounded-xl p-3 sm:p-4 border border-[#2DC653]/20">
        <p className="text-[#2DC653] text-xs font-semibold mb-1">
          ✦ AI Triage
        </p>
        <p className="text-white text-sm">{data.triage.responseMessage}</p>
      </div>

      {data.triage.urgency === "emergency" && (
        <div className="mx-4 sm:mx-6 mb-3 sm:mb-4">
          <a
            href="tel:119"
            className="flex items-center justify-center gap-2 w-full bg-[#E63946] text-white py-3.5 rounded-xl font-bold text-base active:scale-[0.97] transition-transform touch-manipulation animate-pulse"
          >
            📞 Hubungi 119 (Darurat Nasional)
          </a>
        </div>
      )}

      {data.facilities.length > 0 && (
        <div className="mx-4 sm:mx-6 mb-3 sm:mb-4 rounded-2xl overflow-hidden h-40 sm:h-48">
          <MapView
            userLat={lat}
            userLng={lng}
            facilities={data.facilities}
          />
        </div>
      )}

      <section className="px-4 sm:px-6 space-y-2 sm:space-y-3">
        {data.facilities.map((facility, i) => (
          <FacilityCard
            key={facility.place_id}
            facility={facility}
            rank={i + 1}
          />
        ))}
      </section>

      {data.triage.urgency === "emergency" && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0D1B2A]/95 backdrop-blur-sm border-t border-[#2A3A4B] px-4 py-3 safe-bottom sm:hidden z-50">
          <a
            href="tel:119"
            className="flex items-center justify-center gap-2 w-full bg-[#E63946] text-white py-3 rounded-xl font-bold text-base active:scale-[0.97] transition-transform touch-manipulation"
          >
            📞 Hubungi 119
          </a>
        </div>
      )}

      <PenilaianFABWrapper />
    </main>
  );
}

export default function HasilPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
          <div className="text-4xl animate-pulse">🚑</div>
        </div>
      }
    >
      <HasilContent />
    </Suspense>
  );
}