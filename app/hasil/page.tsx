"use client";

import { useEffect, useState, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FacilityCard from "@/components/FacilityCard";
import MapView from "@/components/MapView";
import UrgencyBadge from "@/components/UrgencyBadge";
import EmergencyCallBar from "@/components/EmergencyCallBar";
import { TriageRequestError, requestTriage } from "@/lib/triage-client";
import type { TriageResponse } from "@/types";

function PageFrame({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#0D1B2A] flex flex-col pb-28">
      <div
        className={
          centered
            ? "flex flex-1 items-center justify-center px-4 sm:px-6"
            : "flex-1"
        }
      >
        {children}
      </div>
      <EmergencyCallBar />
    </main>
  );
}

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
    let active = true;

    const fetchResults = async () => {
      try {
        const result = await requestTriage({ situation, lat, lng });
        if (active) setData(result);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof TriageRequestError
            ? err.message
            : "Gagal memuat hasil. Silakan coba lagi."
        );
        setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [situation, lat, lng]);

  if (loading) {
    return (
      <PageFrame centered>
        <div className="text-center" role="status" aria-live="polite">
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
      </PageFrame>
    );
  }

  if (error || !data) {
    return (
      <PageFrame centered>
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
      </PageFrame>
    );
  }

  return (
    <PageFrame>
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
        <p className="text-[#8899AA] text-xs leading-relaxed mt-3">
          Hasil ini bukan diagnosis medis. Analisis AI hanya panduan awal;
          ikuti arahan tenaga medis. Untuk kondisi mengancam nyawa, hubungi
          119.
        </p>
        <p className="text-[#8899AA] text-xs leading-relaxed mt-1.5">
          Cerita yang Anda kirim diproses oleh layanan AI untuk mencari
          fasilitas terdekat. Jangan menulis nama, nomor telepon, atau alamat
          lengkap.
        </p>
      </div>

      {data.facilities.length > 0 && (
        <div className="mx-4 sm:mx-6 mb-3 sm:mb-4 rounded-2xl overflow-hidden h-40 sm:h-48">
          <MapView
            userLat={lat}
            userLng={lng}
            facilities={data.facilities}
          />
        </div>
      )}

      {data.facilities.length === 0 ? (
        <div className="mx-4 sm:mx-6 rounded-2xl border border-[#2A3A4B] bg-[#1B2A3B] p-5 text-center">
          <p className="text-white font-semibold text-sm">
            Tidak ada fasilitas ditemukan di sekitar lokasi ini.
          </p>
          <p className="text-[#8899AA] text-sm mt-1">
            Coba lagi, atau hubungi 119 jika kondisi darurat.
          </p>
        </div>
      ) : (
        <section className="px-4 sm:px-6 space-y-2 sm:space-y-3">
          {data.facilities.map((facility, i) => (
            <FacilityCard
              key={facility.place_id}
              facility={facility}
              rank={i + 1}
            />
          ))}
        </section>
      )}
    </PageFrame>
  );
}

export default function HasilPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0D1B2A] flex flex-col pb-28">
          <div className="flex flex-1 items-center justify-center">
            <div className="text-4xl animate-pulse">🚑</div>
          </div>
          <EmergencyCallBar />
        </main>
      }
    >
      <HasilContent />
    </Suspense>
  );
}