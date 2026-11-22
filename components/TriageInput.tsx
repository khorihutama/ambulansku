"use client";

import { useRef, useState } from "react";

interface TriageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  locationError: "denied" | "unavailable" | null;
  networkError: boolean;
}

export default function TriageInput({
  value,
  onChange,
  onSubmit,
  loading,
  locationError,
  networkError,
}: TriageInputProps) {
  const disabled = loading || networkError;
  const [emptyError, setEmptyError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <section
      aria-labelledby="situation-label"
      aria-busy={loading}
      className="rounded-[24px] border border-hairline bg-surface p-4"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!value.trim()) {
            setEmptyError(true);
            textareaRef.current?.focus();
            return;
          }
          if (!disabled) onSubmit();
        }}
      >
        <label
          id="situation-label"
          htmlFor="situation"
          className="mb-2 block text-sm font-semibold leading-snug text-ink"
        >
          Ceritakan situasinya
        </label>

        <textarea
          ref={textareaRef}
          id="situation"
          value={value}
          onChange={(event) => {
            setEmptyError(false);
            onChange(event.target.value);
          }}
          rows={4}
          maxLength={2000}
          aria-invalid={emptyError || undefined}
          aria-describedby={
            emptyError ? "situation-error location-hint" : "location-hint"
          }
          placeholder="Contoh: Bapak saya pingsan mendadak di rumah dan sulit dibangunkan."
          className="block min-h-[104px] w-full resize-y rounded-[14px] border border-hairline-strong bg-[#0d1b2a] px-3.5 py-3 text-base leading-relaxed text-ink placeholder:text-ink-dim"
        />

        <p
          id="location-hint"
          className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-ink-muted"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-px h-4 w-4 shrink-0"
          >
            <path d="M20 10c0 5.25-8 12-8 12S4 15.25 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          Lokasi dipakai untuk mencari fasilitas terdekat dari posisimu.
        </p>

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-start gap-3 rounded-[14px] border border-hairline-strong bg-[#0d1b2a] p-3"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-ink-muted border-t-transparent"
            />
            <div>
              <strong className="block text-sm font-semibold text-ink">
                Mencari lokasi…
              </strong>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">
                Kami meminta izin lokasi untuk mencari fasilitas terdekat.
                Mohon tunggu.
              </p>
            </div>
          </div>
        )}

        {locationError && (
          <div
            role="alert"
            className="mt-3 rounded-[14px] border border-danger-ink/50 bg-[#241318] p-3"
          >
            <strong className="block text-sm font-bold text-danger-ink">
              {locationError === "denied"
                ? "Izin lokasi tidak aktif"
                : "Lokasi tidak tersedia"}
            </strong>
            <p className="mt-1 text-[13px] leading-snug text-[#E9EDF2]">
              {locationError === "denied"
                ? "Tanpa lokasi, kami tidak bisa mencari fasilitas terdekat. Aktifkan izin lokasi di browser, lalu coba lagi."
                : "Kami tidak bisa membaca lokasi. Aktifkan GPS atau izin lokasi, lalu coba lagi."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onSubmit}
                className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] border border-hairline-strong bg-surface-raised px-3 text-sm font-bold text-ink touch-manipulation"
              >
                Coba lagi
              </button>
              <a
                href="tel:119"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-danger px-3 text-sm font-bold text-white touch-manipulation"
              >
                Telepon 119
              </a>
            </div>
          </div>
        )}

        {!locationError && (
          <button
            type="submit"
            disabled={disabled}
            className="mt-3 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-danger px-4 text-[17px] font-bold text-white transition-colors hover:bg-danger-hover active:translate-y-px disabled:opacity-50 touch-manipulation"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              className="h-[19px] w-[19px]"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            {networkError
              ? "Menunggu koneksi"
              : loading
                ? "Mencari lokasi..."
                : "Cari bantuan"}
          </button>
        )}

        {emptyError && (
          <p
            id="situation-error"
            role="alert"
            className="mt-2 text-[13px] font-medium leading-snug text-danger-ink"
          >
            Tulis dulu apa yang terjadi, lalu coba lagi.
          </p>
        )}
      </form>
    </section>
  );
}