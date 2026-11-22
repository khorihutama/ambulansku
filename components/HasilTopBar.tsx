"use client";

import { useRouter } from "next/navigation";

export default function HasilTopBar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-hairline bg-[#0d1b2a]/95 px-4 py-2 backdrop-blur-md min-[360px]:px-5">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Kembali"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-hairline text-ink touch-manipulation"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-ink">
        Hasil triage
      </span>
    </header>
  );
}