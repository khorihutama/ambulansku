import { corsOptionsResponse, corsJson } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
  return corsJson({ enabled: process.env.PENILAIAN_ENABLED === "true" });
}