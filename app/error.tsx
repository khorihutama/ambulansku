"use client";

import EmergencyCallBar from "@/components/EmergencyCallBar";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#0D1B2A] flex flex-col pb-28">
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-white font-bold text-lg">Terjadi kesalahan</h1>
          <p className="text-[#8899AA] text-sm mt-1">
            Muat ulang halaman atau coba lagi.
          </p>
          <button
            onClick={reset}
            className="mt-4 text-[#E63946] underline text-sm sm:text-base cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      </div>
      <EmergencyCallBar />
    </main>
  );
}