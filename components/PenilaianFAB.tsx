"use client";

import Link from "next/link";

export default function PenilaianFAB() {
  return (
    <Link
      href="/penilaian"
      className="fab-pulse group fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#E63946] text-white rounded-full shadow-xl shadow-[#E63946]/30 flex items-center justify-center active:scale-90 transition-transform touch-manipulation safe-bottom"
      aria-label="Feedback"
    >
      <span className="text-xl leading-none">💬</span>
      <span className="fab-tooltip">Feedback</span>
    </Link>
  );
}