"use client";

import { useRouter } from "next/navigation";

export default function FeedbackTopBar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-2.5 border-b border-hairline bg-[#0d1b2a]/95 px-4 py-2 backdrop-blur-md min-[360px]:px-5">
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

      <span className="inline-flex min-h-[44px] min-w-0 items-center gap-2 font-display text-[17px] font-extrabold tracking-[-0.02em] text-ink">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[22px] w-[22px] shrink-0"
        >
          <rect width="24" height="24" rx="5.5" fill="#D0202E" />
          <path d="M10 5h4v5h5v4h-5v5h-4v-5H5v-4h5V5Z" fill="#fff" />
        </svg>
        <span className="truncate">AmbulansKu</span>
      </span>

      <a
        href="tel:119"
        aria-label="Telepon 119, darurat nasional"
        className="ml-auto inline-flex h-12 min-w-[76px] shrink-0 items-center justify-center gap-[7px] rounded-full border border-white/15 bg-danger px-4 text-[15px] font-bold text-white touch-manipulation"
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
        119
      </a>
    </header>
  );
}