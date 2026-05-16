import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D1B2A",
};

export const metadata: Metadata = {
  title: "AmbulansKu — Temukan Ambulans & Fasilitas Medis Terdekat",
  description:
    "AI-powered ambulance & medical transport finder untuk Indonesia. Temukan ambulans dan fasilitas medis terdekat dengan satu ketukan.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AmbulansKu",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "AmbulansKu",
    description: "Temukan ambulans & fasilitas medis terdekat",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="icon"
          href="/icons/favicon.ico"
          sizes="any"
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col font-body bg-[#0D1B2A] text-white overscroll-none">
        {children}
      </body>
    </html>
  );
}