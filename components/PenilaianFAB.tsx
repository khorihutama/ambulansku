"use client";

import Link from "next/link";

export default function PenilaianFAB() {
  return (
    <Link
      href="/penilaian"
      className="fixed bottom-6 right-6 z-40 bg-[#1B2A3B] text-white w-14 h-14 rounded-full shadow-lg shadow-black/40 flex items-center justify-center text-2xl active:scale-95 transition-transform border border-[#2A3A4B] hover:bg-[#2A3A4B] safe-bottom"
      aria-label="Penilaian"
    >
      📋
    </Link>
  );
}