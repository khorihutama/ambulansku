import { NextRequest } from "next/server";
import { generateTriage } from "@/lib/ai";
import { getNearbyFacilities } from "@/lib/places";
import { corsOptionsResponse, corsJson } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: NextRequest) {
  try {
    const { situation, lat, lng } = await req.json();

    if (!situation || !lat || !lng) {
      return corsJson({ error: "situation, lat, lng are required" }, 400);
    }

    const triage = await generateTriage(situation);
    const facilities = await getNearbyFacilities(lat, lng, triage.searchKeywords);

    return corsJson({ triage, facilities });
  } catch (error) {
    console.error("Triage error:", error);
    return corsJson({ error: "Terjadi kesalahan, silakan coba lagi" }, 500);
  }
}