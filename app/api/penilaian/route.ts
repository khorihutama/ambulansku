import { NextRequest } from "next/server";
import { getPenilaian, getPenilaianStats } from "@/lib/supabase";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import { getPenilaianDevKey } from "@/lib/config";
import { matchesDevKey } from "@/lib/dev-key";

const GONE_MESSAGE =
  "API penilaian sudah tidak digunakan. Gunakan /api/feedback.";

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse(req);
}

export async function POST(req: NextRequest) {
  return corsJson(req, { error: GONE_MESSAGE }, 410);
}

// Kept temporarily for exporting legacy rows (scope §8.2/§8.3).
export async function GET(req: NextRequest) {
  const devKey = getPenilaianDevKey();
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "");

  if (!matchesDevKey(providedKey, devKey)) {
    return corsJson(req, { error: "Unauthorized" }, 401);
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "list";

  if (format === "stats") {
    const stats = await getPenilaianStats();
    return corsJson(req, stats);
  }

  const entries = await getPenilaian();
  return corsJson(req, entries);
}