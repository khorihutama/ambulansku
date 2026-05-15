"use client";

import { useState } from "react";

interface TriageInputProps {
  onSubmit: (situation: string) => void;
  loading: boolean;
}

export default function TriageInput({ onSubmit, loading }: TriageInputProps) {
  const [situation, setSituation] = useState("");

  return (
    <div className="bg-[#1B2A3B] rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
      <label className="text-white text-sm font-medium mb-2 block">
        Ceritakan situasinya
      </label>
      <textarea
        className="w-full bg-transparent text-white placeholder-[#8899AA] resize-none outline-none text-base leading-relaxed min-h-[5rem]"
        placeholder="Contoh: Bapak saya pingsan mendadak di rumah, butuh ambulans segera..."
        rows={4}
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
      />
      <button
        onClick={() => situation.trim() && onSubmit(situation)}
        disabled={!situation.trim() || loading}
        className="w-full mt-2 sm:mt-3 bg-[#E63946] text-white py-3 sm:py-3.5 rounded-xl font-semibold text-base disabled:opacity-50 active:scale-[0.97] transition-transform cursor-pointer touch-manipulation"
      >
        {loading ? "Mencari..." : "\uD83D\uDD0D Cari Sekarang"}
      </button>
    </div>
  );
}