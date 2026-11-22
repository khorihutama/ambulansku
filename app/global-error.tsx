"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AmbulansKu</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#0D1B2A",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            paddingBottom: 96,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
              <h1 style={{ fontSize: 18, margin: 0 }}>Terjadi kesalahan</h1>
              <p style={{ color: "#8899AA", fontSize: 14, marginTop: 6 }}>
                Muat ulang halaman atau coba lagi.
              </p>
              <button
                onClick={reset}
                style={{
                  marginTop: 16,
                  background: "none",
                  border: 0,
                  color: "#E63946",
                  fontSize: 14,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Coba lagi
              </button>
            </div>
          </div>

          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
              borderTop: "1px solid #2A3A4B",
              background: "#0D1B2A",
            }}
          >
            <a
              href="tel:119"
              style={{
                display: "flex",
                minHeight: 56,
                maxWidth: 576,
                margin: "0 auto",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderRadius: 12,
                background: "#E63946",
                color: "#FFFFFF",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 20 }}>
                📞
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 16 }}>Hubungi 119</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  SPGDT Nasional
                </span>
              </span>
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}