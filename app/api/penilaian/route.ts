import { NextRequest } from "next/server";
import { submitPenilaian, getPenilaian, getPenilaianStats } from "@/lib/supabase";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import type { Gender } from "@/types";

const PENILAIAN_ENABLED = process.env.PENILAIAN_ENABLED === "true";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: NextRequest) {
  if (!PENILAIAN_ENABLED) {
    return corsJson({ error: "Feedback tidak tersedia" }, 404);
  }

  try {
    const body = await req.json();
    const { name, gender, stars, liked, disliked } = body;

    if (!name || !gender || !stars || !liked) {
      return corsJson(
        { error: "name, gender, stars, dan liked wajib diisi" },
        400
      );
    }

    if (!["L", "P", "O"].includes(gender)) {
      return corsJson({ error: "gender harus L, P, atau O" }, 400);
    }

    if (stars < 1 || stars > 5) {
      return corsJson({ error: "stars harus 1-5" }, 400);
    }

    const result = await submitPenilaian({
      name: String(name).slice(0, 100),
      gender: gender as Gender,
      stars: Number(stars),
      liked: String(liked).slice(0, 1000),
      disliked: String(disliked ?? "").slice(0, 1000),
    });

    if (!result.success) {
      return corsJson({ error: result.error }, 500);
    }

    return corsJson({ success: true, message: "Terima kasih atas feedback Anda!" });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return corsJson({ error: "Terjadi kesalahan" }, 500);
  }
}

export async function GET(req: NextRequest) {
  const devKey = process.env.PENILAIAN_DEV_KEY;
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "");

  if (!devKey || providedKey !== devKey) {
    return corsJson({ error: "Unauthorized" }, 401);
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "list";

  if (format === "stats") {
    const stats = await getPenilaianStats();
    return corsJson(stats);
  }

  const entries = await getPenilaian();
  return corsJson(entries);
}