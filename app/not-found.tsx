import Link from "next/link";
import EmergencyCallBar from "@/components/EmergencyCallBar";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0D1B2A] flex flex-col pb-28">
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6">
        <div className="text-center">
          <p className="text-[#8899AA] text-sm">404</p>
          <h1 className="text-white font-bold text-lg mt-1">
            Halaman tidak ditemukan
          </h1>
          <p className="text-[#8899AA] text-sm mt-1">
            Alamat yang Anda buka tidak tersedia.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-[#E63946] underline text-sm sm:text-base"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
      <EmergencyCallBar />
    </main>
  );
}