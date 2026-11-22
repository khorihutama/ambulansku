"use client";

import { useEffect, useState, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FacilityCard from "@/components/FacilityCard";
import MapDisclosure from "@/components/MapDisclosure";
import UrgencyPanel from "@/components/UrgencyPanel";
import EmergencyCallBar from "@/components/EmergencyCallBar";
import HasilTopBar from "@/components/HasilTopBar";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-[#0d1b2a] pb-28 text-ink min-[520px]:border-x min-[520px]:border-hairline">
      <HasilTopBar />
      <div
        className={
          centered
            ? "flex flex-1 items-center justify-center px-4 py-8"
            : "flex-1 px-4 pt-4 min-[360px]:px-5"
        }
      >
        {children}
      </div>
      <EmergencyCallBar />
    </main>
  );
}

function LoadingState() {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className="mx-auto mb-4 block h-9 w-9 animate-spin rounded-full border-[3px] border-ink-muted border-t-transparent"
      />
      <p className="text-base font-semibold text-ink">
        Mencari fasilitas terdekat...
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        AI sedang menganalisis situasi
      </p>
    </div>
  );
}

function EmptyState({
  kind,
  detail,
  onRetry,
}: {
  kind: "empty" | "failed";
  detail?: string;
  onRetry: () => void;
}) {
  const failed = kind === "failed";

  return (
    <div className="rounded-[18px] border border-hairline bg-surface p-5 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong text-ink-muted">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {failed ? (
            <>
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 9v5M12 17.2v.1" />
            </>
          ) : (
            <>
              <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
              <path d="M9 3v15M15 6v15" />
            </>
          )}
        </svg>
      </div>
      <h2 className="font-display text-[18px] font-bold leading-snug text-ink">
        {failed ? "Fasilitas belum bisa dimuat" : "Tidak ada fasilitas ditemukan"}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        {failed
          ? "Analisis AI gagal, jadi kami belum bisa menampilkan fasilitas. Anggap ini darurat dan telepon 119."
          : "Kami tidak menemukan fasilitas di sekitar lokasi ini. Coba lagi atau hubungi 119 jika kondisi darurat."}
      </p>
      {failed && detail && (
        <p className="mt-2 text-xs leading-snug text-ink-dim">{detail}</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border border-hairline-strong bg-surface-raised px-3 text-sm font-bold text-ink touch-manipulation"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border border-hairline-strong px-3 text-sm font-bold text-ink touch-manipulation"
        >
          Ubah cerita
        </Link>
      </div>
    </div>
  );
}

function HasilContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const situation = searchParams.get("situation") ?? "";
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");

  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      setLoading(true);
      setError("");
      setData(null);

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
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [situation, lat, lng, attempt]);

  const retry = () => setAttempt((current) => current + 1);

  if (loading) {
    return (
      <PageFrame centered>
        <LoadingState />
      </PageFrame>
    );
  }

  if (error || !data) {
    return (
      <PageFrame>
        <UrgencyPanel
          urgency="emergency"
          message=""
          variant="failed"
        />
        <section aria-labelledby="facilities-title" className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="facilities-title"
              className="font-display text-[18px] font-bold leading-snug tracking-[-0.02em] text-ink"
            >
              Fasilitas terdekat
            </h2>
            <span className="whitespace-nowrap text-[13px] text-ink-muted">
              Belum tersedia
            </span>
          </div>
          <div className="mt-3">
            <EmptyState kind="failed" detail={error} onRetry={retry} />
          </div>
        </section>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
          Data fasilitas berasal dari Google Places dan bisa belum diperbarui.
          Telepon dulu sebelum berangkat. Untuk darurat nasional, hubungi{" "}
          <a
            href="tel:119"
            className="font-bold text-danger-ink underline underline-offset-4"
          >
            119
          </a>
          .
        </p>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <UrgencyPanel
        urgency={data.triage.urgency}
        message={data.triage.responseMessage}
      />

      <section aria-labelledby="facilities-title" className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="facilities-title"
            className="font-display text-[18px] font-bold leading-snug tracking-[-0.02em] text-ink"
          >
            Fasilitas terdekat
          </h2>
          <span className="whitespace-nowrap text-[13px] text-ink-muted">
            {data.facilities.length} ditemukan
          </span>
        </div>

        {data.facilities.length > 0 && (
          <p className="mt-1 text-[13px] text-ink-muted">
            Urut dari yang paling dekat.
          </p>
        )}

        {data.facilities.length === 0 ? (
          <div className="mt-3">
            <EmptyState kind="empty" onRetry={retry} />
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {data.facilities.map((facility, index) => (
              <FacilityCard
                key={facility.place_id}
                facility={facility}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </section>

      {data.facilities.length > 0 && (
        <MapDisclosure
          userLat={lat}
          userLng={lng}
          facilities={data.facilities}
        />
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
        Data fasilitas berasal dari Google Places dan bisa belum diperbarui.
        Telepon dulu sebelum berangkat. Untuk darurat nasional, hubungi{" "}
        <a
          href="tel:119"
          className="font-bold text-danger-ink underline underline-offset-4"
        >
          119
        </a>
        .
      </p>
    </PageFrame>
  );
}

export default function HasilPage() {
  return (
    <Suspense
      fallback={
        <PageFrame centered>
          <LoadingState />
        </PageFrame>
      }
    >
      <HasilContent />
    </Suspense>
  );
}