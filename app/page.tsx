"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import TriageInput from "@/components/TriageInput";
import QuickSelect from "@/components/QuickSelect";
import PenilaianFABWrapper from "@/components/PenilaianFABWrapper";

const emptySubscribe = () => () => {};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleSearch = async (situationText: string) => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
      );

      const params = new URLSearchParams({
        situation: situationText,
        lat: String(position.coords.latitude),
        lng: String(position.coords.longitude),
      });

      router.push(`/hasil?${params.toString()}`);
    } catch {
      alert("Mohon izinkan akses lokasi untuk mencari fasilitas terdekat");
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-4xl animate-pulse">🚑</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] flex flex-col safe-top safe-bottom">
      <header className="px-4 sm:px-6 pt-6 pb-4 sm:pt-12 sm:pb-6">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <span className="text-2xl sm:text-3xl">🚑</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
            AmbulansKu
          </h1>
        </div>
        <p className="text-[#8899AA] text-sm">
          Temukan ambulans & fasilitas medis terdekat
        </p>
      </header>

      <section className="px-4 sm:px-6 flex-1">
        <TriageInput onSubmit={handleSearch} loading={loading} />
        <QuickSelect onSelect={handleSearch} disabled={loading} />
      </section>

      <footer className="px-4 sm:px-6 py-4 sm:py-6 text-center safe-bottom">
        <p className="text-[#8899AA] text-xs">
          Darurat? Hubungi{" "}
          <a
            href="tel:119"
            className="text-[#E63946] font-bold underline decoration-[#E63946]"
          >
            119
          </a>{" "}
          (SPGDT Nasional)
        </p>
      </footer>

      <PenilaianFABWrapper />
    </main>
  );
}