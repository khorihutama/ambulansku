"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Gender } from "@/types";

const emptySubscribe = () => () => {};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
  { value: "O", label: "Tidak ingin menyebutkan" },
];

const STAR_LABELS = ["", "Buruk", "Kurang", "Cukup", "Bagus", "Luar biasa"];

export default function PenilaianPage() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    fetch("/api/penilaian/status")
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const displayStars = hoverStars || stars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gender || !stars || !liked) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gender, stars, liked, disliked }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Gagal mengirim. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || enabled === null) {
    return (
      <main className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-4xl animate-pulse">🚑</div>
      </main>
    );
  }

  if (enabled === false) {
    return (
      <main className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-white text-xl font-bold font-display mb-2">
            Feedback Tidak Tersedia
          </h2>
          <p className="text-[#8899AA] text-sm mb-6">
            Fitur feedback sedang tidak aktif.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1B2A3B] text-white px-6 py-3 rounded-xl font-semibold border border-[#2A3A4B] touch-manipulation"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-white text-xl font-bold font-display mb-2">
            Terima Kasih!
          </h2>
          <p className="text-[#8899AA] text-sm mb-6">
            Feedback Anda sangat berarti bagi kami.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#E63946] text-white px-6 py-3 rounded-xl font-semibold active:scale-[0.97] transition-transform touch-manipulation"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] flex flex-col safe-top safe-bottom">
      <header className="px-4 sm:px-6 pt-6 pb-4 sm:pt-12 sm:pb-6">
        <Link
          href="/"
          className="text-[#8899AA] text-sm hover:text-white transition-colors"
        >
          ← Kembali
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-2">
          💬 Feedback
        </h1>
        <p className="text-[#8899AA] text-sm mt-1">
          Berikan feedback Anda untuk AmbulansKu
        </p>
      </header>

      <section className="px-4 sm:px-6 flex-1 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Nama / Inisial <span className="text-[#E63946]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Andi atau AR"
              maxLength={100}
              required
              className="w-full bg-[#1B2A3B] text-white placeholder-[#8899AA] px-4 py-3 rounded-xl outline-none border border-[#2A3A4B] focus:border-[#E63946] transition-colors text-base touch-manipulation"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Gender <span className="text-[#E63946]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors touch-manipulation cursor-pointer ${
                    gender === g.value
                      ? "bg-[#E63946] text-white"
                      : "bg-[#1B2A3B] text-[#8899AA] border border-[#2A3A4B]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Rating <span className="text-[#E63946]">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="text-3xl cursor-pointer touch-manipulation transition-transform active:scale-90"
                >
                  {star <= displayStars ? "⭐" : "☆"}
                </button>
              ))}
              {displayStars > 0 && (
                <span className="text-[#8899AA] text-sm ml-2">
                  {STAR_LABELS[displayStars]}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Apa yang Anda suka? <span className="text-[#E63946]">*</span>
            </label>
            <textarea
              value={liked}
              onChange={(e) => setLiked(e.target.value)}
              placeholder="Contoh: UI-nya bersih dan mudah dipakai saat panik..."
              rows={3}
              maxLength={1000}
              required
              className="w-full bg-[#1B2A3B] text-white placeholder-[#8899AA] px-4 py-3 rounded-xl outline-none border border-[#2A3A4B] focus:border-[#E63946] transition-colors resize-none text-base touch-manipulation"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Apa yang perlu diperbaiki?{" "}
              <span className="text-[#8899AA] text-xs">(opsional)</span>
            </label>
            <textarea
              value={disliked}
              onChange={(e) => setDisliked(e.target.value)}
              placeholder="Contoh: Loading agak lama di koneksi lambat..."
              rows={3}
              maxLength={1000}
              className="w-full bg-[#1B2A3B] text-white placeholder-[#8899AA] px-4 py-3 rounded-xl outline-none border border-[#2A3A4B] focus:border-[#E63946] transition-colors resize-none text-base touch-manipulation"
            />
          </div>

          {error && (
            <p className="text-[#E63946] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name || !gender || !stars || !liked || submitting}
            className="w-full bg-[#E63946] text-white py-3.5 rounded-xl font-semibold text-base disabled:opacity-50 active:scale-[0.97] transition-transform touch-manipulation cursor-pointer"
          >
            {submitting ? "Mengirim..." : "Kirim Feedback"}
          </button>
        </form>
      </section>
    </main>
  );
}