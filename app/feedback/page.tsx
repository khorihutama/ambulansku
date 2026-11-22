"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeedbackTopBar from "@/components/FeedbackTopBar";

const STAR_LABELS = [
  "",
  "Tidak membantu",
  "Kurang membantu",
  "Cukup membantu",
  "Bagus",
  "Sangat membantu",
];
const MAX_COMMENT = 1000;

function scrollToTop() {
  if (typeof window !== "undefined" && window.scrollY > 0) {
    window.scrollTo({ top: 0 });
  }
}

function DisclaimerFooter() {
  return (
    <p className="mt-6 text-[13px] leading-relaxed text-ink-muted">
      Masukan dipakai untuk memperbaiki layanan. Tidak ada balasan personal.
      Untuk darurat, telepon{" "}
      <a
        href="tel:119"
        className="font-bold text-danger-ink underline underline-offset-4"
      >
        119
      </a>
      .
    </p>
  );
}

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [ratingError, setRatingError] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (rating < 1) {
      setRatingError(true);
      document.getElementById("rating-1")?.focus();
      return;
    }

    setSubmitting(true);
    setError("");
    setRatingError(false);

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
      scrollToTop();
    } catch {
      setError("Gagal mengirim. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment("");
    setError("");
    setRatingError(false);
    setSubmitted(false);
    scrollToTop();
  };

  const frame = (children: React.ReactNode) => (
    <main className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col bg-[#0d1b2a] text-ink min-[520px]:border-x min-[520px]:border-hairline">
      <FeedbackTopBar />
      <div className="flex flex-1 flex-col px-4 py-5 min-[360px]:px-5">
        {children}
      </div>
    </main>
  );

  if (enabled === null) {
    return frame(
      <div
        className="flex flex-1 items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 block h-9 w-9 animate-spin rounded-full border-[3px] border-ink-muted border-t-transparent"
          />
          <p className="text-base font-semibold text-ink">
            Memuat formulir...
          </p>
        </div>
      </div>
    );
  }

  if (!enabled) {
    return frame(
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-hairline-strong text-ink-muted">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1 className="font-display text-[24px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
          Masukan sedang tidak tersedia
        </h1>
        <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-ink-muted">
          Fitur masukan dinonaktifkan sementara. Kamu tetap bisa mencari
          fasilitas atau menghubungi 119.
        </p>
        <div className="mt-6 grid w-full max-w-sm gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[56px] items-center justify-center rounded-[14px] border border-white/15 bg-danger px-4 text-base font-bold text-white touch-manipulation"
          >
            Kembali ke beranda
          </Link>
          <a
            href="tel:119"
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[14px] border border-hairline-strong px-4 text-base font-bold text-ink touch-manipulation"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
            >
              <path
                fill="currentColor"
                d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"
              />
            </svg>
            Telepon 119
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return frame(
      <>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-green/50 text-green">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </div>
          <h1 className="font-display text-[26px] font-extrabold tracking-[-0.03em] text-ink">
            Terima kasih
          </h1>
          <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-ink-muted">
            Masukanmu membantu kami membuat alur darurat lebih cepat dan lebih
            jelas.
          </p>
          <div className="mt-6 grid w-full max-w-sm gap-2">
            <Link
              href="/"
              className="inline-flex min-h-[56px] items-center justify-center rounded-[14px] border border-white/15 bg-danger px-4 text-base font-bold text-white touch-manipulation"
            >
              Kembali ke beranda
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-[56px] items-center justify-center rounded-[14px] border border-hairline-strong px-4 text-base font-bold text-ink touch-manipulation"
            >
              Kirim masukan lain
            </button>
          </div>
          <div className="w-full">
            <DisclaimerFooter />
          </div>
        </div>
      </>
    );
  }

  return frame(
    <>
      <header>
        <h1 className="font-display text-[clamp(26px,7vw,30px)] font-extrabold leading-[1.15] tracking-[-0.035em] text-ink">
          Beri masukan
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
          Tanpa nama, gender, atau akun.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 rounded-[24px] border border-hairline bg-surface p-4 min-[360px]:p-[18px]"
      >
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="p-0 text-[15px] font-semibold leading-snug text-ink">
            Seberapa membantu AmbulansKu?
          </legend>
          <div
            role="group"
            aria-label="Rating 1 sampai 5"
            className="mt-3 flex gap-1"
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const selected = star <= rating;
              return (
                <button
                  key={star}
                  id={`rating-${star}`}
                  type="button"
                  aria-label={`${star} bintang, ${STAR_LABELS[star]}`}
                  aria-pressed={rating === star}
                  onClick={() => {
                    setRating(star);
                    setRatingError(false);
                  }}
                  disabled={submitting}
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50 touch-manipulation ${
                    selected
                      ? "border-amber bg-[#2a2118] text-amber"
                      : "border-hairline-strong bg-[#0d1b2a] text-ink-dim"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill={selected ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.77l-5.2 2.74.99-5.79-4.21-4.1 5.82-.85L12 3.5Z" />
                  </svg>
                </button>
              );
            })}
          </div>
          <p
            aria-live="polite"
            className={`mt-2.5 min-h-[22px] text-sm font-semibold ${
              rating > 0 ? "text-amber" : "font-normal text-ink-muted"
            }`}
          >
            {rating > 0
              ? `${STAR_LABELS[rating]} — ${rating} dari 5`
              : "Pilih 1–5 bintang."}
          </p>
        </fieldset>

        <div className="my-5 h-px bg-hairline" />

        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <label
              htmlFor="feedback-comment"
              className="text-sm font-semibold text-ink"
            >
              Apa yang bisa kami perbaiki?
            </label>
            <span className="text-[13px] tabular-nums text-ink-muted">
              {comment.length}/{MAX_COMMENT}
            </span>
          </div>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={MAX_COMMENT}
            placeholder="Contoh: tombol telepon sulit ditemukan saat buru-buru."
            className="block min-h-[120px] w-full resize-y rounded-[14px] border border-hairline-strong bg-[#0d1b2a] px-3.5 py-3 text-base leading-relaxed text-ink placeholder:text-ink-dim"
          />
          <p className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-ink-muted">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-px h-4 w-4 shrink-0"
            >
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Opsional. Jangan tulis nama, nomor telepon, atau data pribadi orang
            lain.
          </p>
        </div>

        {(ratingError || error) && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-[14px] border border-[#4a2028] bg-[#241318] px-3.5 py-3 text-sm leading-snug text-danger-ink"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 h-[18px] w-[18px] shrink-0"
            >
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 9v5M12 17.2v.1" />
            </svg>
            {ratingError
              ? "Pilih rating dulu sebelum mengirim."
              : error}
          </p>
        )}

        <div className="mt-5">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-danger px-4 text-[17px] font-bold text-white transition-colors hover:bg-danger-hover disabled:opacity-50 touch-manipulation"
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Mengirim...
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[18px] w-[18px]"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
                Kirim masukan
              </>
            )}
          </button>
        </div>
      </form>

      <DisclaimerFooter />
    </>
  );
}