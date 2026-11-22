import { NextRequest } from "next/server";
import { corsOptionsResponse, corsJson } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse(req);
}

export async function GET(req: NextRequest) {
  return corsJson(
    req,
    {
      error:
        "API penilaian/status sudah tidak digunakan. Gunakan /api/feedback/status.",
    },
    410
  );
}