"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeTopBar from "@/components/HomeTopBar";
import TriageInput from "@/components/TriageInput";
import QuickSelect from "@/components/QuickSelect";

type LocationError = "denied" | "unavailable" | "network" | null;

export default function HomePage() {
  const router = useRouter();
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<LocationError>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => setLocationError("network");
    const handleOnline = () =>
      setLocationError((current) => (current === "network" ? null : current));

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleSearch = async (text: string = situation) => {
    const query = text.trim();
    if (!query) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setLocationError("network");
      return;
    }

    setLocationError(null);
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
        situation: query,
        lat: String(position.coords.latitude),
        lng: String(position.coords.longitude),
      });

      router.push(`/hasil?${params.toString()}`);
    } catch (reason) {
      const code = (reason as GeolocationPositionError | undefined)?.code;
      setLocationError(code === 1 ? "denied" : "unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-[#0d1b2a] text-ink min-[520px]:border-x min-[520px]:border-hairline">
      <HomeTopBar />

      {locationError === "network" && (
        <div
          role="status"
          className="flex items-start gap-3 border-b border-hairline bg-[#241318] px-4 py-3 min-[360px]:px-5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-5 w-5 shrink-0 text-danger-ink"
          >
            <path d="M12 3 2.5 20h19L12 3Z" />
            <path d="M12 9v5M12 17.2v.1" />
          </svg>
          <div className="min-w-0 flex-1">
            <strong className="block text-sm font-bold text-danger-ink">
              Koneksi terputus
            </strong>
            <p className="mt-0.5 text-[13px] leading-snug text-[#E9EDF2]">
              Pencarian fasilitas butuh internet. Periksa jaringan, lalu coba
              lagi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSearch()}
            className="min-h-[44px] shrink-0 rounded-[10px] border border-hairline-strong bg-surface-raised px-3 text-sm font-bold text-ink touch-manipulation"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col px-4 pt-[26px] min-[360px]:px-5">
        <section aria-labelledby="home-title">
          <h1
            id="home-title"
            className="max-w-[14ch] font-display text-[clamp(26px,7.2vw,32px)] font-extrabold leading-[1.12] tracking-[-0.035em] text-balance text-ink"
          >
            Apa yang terjadi?
          </h1>
          <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-ink-muted">
            Tulis singkat. Kami carikan fasilitas medis terdekat dari lokasimu.
          </p>
          <p className="mt-3 text-[14.5px] leading-snug text-ink-muted">
            Mengancam nyawa?{" "}
            <a
              href="tel:119"
              className="font-bold text-danger-ink underline underline-offset-4"
            >
              Telepon 119 sekarang
            </a>
            .
          </p>
        </section>

        <div className="mt-[18px]">
          <TriageInput
            value={situation}
            onChange={setSituation}
            onSubmit={() => void handleSearch()}
            loading={loading}
            locationError={
              locationError === "network" ? null : locationError
            }
            networkError={locationError === "network"}
          />
        </div>

        <QuickSelect
          onSelect={(value) => {
            setSituation(value);
            void handleSearch(value);
          }}
          disabled={loading}
        />

        <footer className="mt-auto border-t border-hairline pb-[calc(34px+env(safe-area-inset-bottom))] pt-5 text-[13px] leading-relaxed text-ink-muted">
          <p>
            AmbulansKu membantu menemukan fasilitas, bukan menggantikan layanan
            darurat atau diagnosis medis.
          </p>
          <p className="mt-2.5 font-medium text-ink">
            Darurat? Hubungi{" "}
            <a
              href="tel:119"
              className="font-bold text-danger-ink underline underline-offset-4"
            >
              119
            </a>{" "}
            (SPGDT Nasional).
          </p>
          <div className="mt-2.5 flex flex-wrap gap-x-[18px] gap-y-2">
            <Link
              href="/feedback"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-ink underline underline-offset-4"
            >
              Beri masukan
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}