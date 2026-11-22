"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STAR_LABELS = ["", "Buruk", "Kurang", "Cukup", "Bagus", "Luar biasa"];
const MAX_COMMENT = 1000;

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/feedback/status")
      .then((response) => response.json())
      .then((data) => {
        if (active) setEnabled(data.enabled === true);
      })
      .catch(() => {
        if (active) setEnabled(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayRating = hoverRating || rating;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
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

  if (enabled === null) {
    return (
      <main className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-4xl animate-pulse">🚑</div>
      </main>
    );
  }

  if (!enabled) {
    return (
      <main className="min-h-screen bg-[#0D1B2A] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">⚠️</div>
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
          Feedback
        </h1>
        <p className="text-[#8899AA] text-sm mt-1">
          Berikan masukan Anda untuk AmbulansKu. Tanpa nama, gender, atau
          kontak.
        </p>
      </header>

      <section className="px-4 sm:px-6 flex-1 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
          <div>
            <span className="text-white text-sm font-medium mb-2 block">
              Rating <span className="text-[#E63946]">*</span>
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} bintang`}
                  aria-pressed={rating === star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl cursor-pointer touch-manipulation transition-transform active:scale-90"
                >
                  {star <= displayRating ? "★" : "☆"}
                </button>
              ))}
              {displayRating > 0 && (
                <span className="text-[#8899AA] text-sm ml-2">
                  {STAR_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback-comment"
              className="text-white text-sm font-medium mb-2 block"
            >
              Komentar{" "}
              <span className="text-[#8899AA] text-xs">(opsional)</span>
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Contoh: Loading agak lama di koneksi lambat..."
              rows={4}
              maxLength={MAX_COMMENT}
              className="w-full bg-[#1B2A3B] text-white placeholder-[#8899AA] px-4 py-3 rounded-xl outline-none border border-[#2A3A4B] focus:border-[#E63946] transition-colors resize-none text-base touch-manipulation"
            />
            <p className="text-[#8899AA] text-xs text-right mt-1">
              {comment.length}/{MAX_COMMENT}
            </p>
          </div>

          {error && (
            <p className="text-[#E63946] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={rating < 1 || submitting}
            className="w-full bg-[#E63946] text-white py-3.5 rounded-xl font-semibold text-base disabled:opacity-50 active:scale-[0.97] transition-transform touch-manipulation cursor-pointer"
          >
            {submitting ? "Mengirim..." : "Kirim Feedback"}
          </button>
        </form>
      </section>
    </main>
  );
}