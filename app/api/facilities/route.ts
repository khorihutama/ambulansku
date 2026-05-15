import { NextRequest } from "next/server";
import { getNearbyFromDB } from "@/lib/supabase";
import { corsOptionsResponse, corsJson } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") ?? "0");
    const lng = parseFloat(searchParams.get("lng") ?? "0");
    const radius = parseInt(searchParams.get("radius") ?? "10000");

    if (!lat || !lng) {
      return corsJson({ error: "lat and lng are required" }, 400);
    }

    const facilities = await getNearbyFromDB(lat, lng, radius);

    return corsJson({ facilities });
  } catch (error) {
    console.error("Facilities error:", error);
    return corsJson({ error: "Gagal memuat fasilitas" }, 500);
  }
}