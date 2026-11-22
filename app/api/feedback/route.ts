import { NextRequest } from "next/server";
import { getFeedback, submitFeedback } from "@/lib/supabase";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import { getFeedbackDevKey, isFeedbackEnabled } from "@/lib/config";
import { feedbackRequestSchema } from "@/lib/schemas";

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse(req);
}

export async function POST(req: NextRequest) {
  if (!isFeedbackEnabled()) {
    return corsJson(req, { error: "Feedback tidak tersedia" }, 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return corsJson(
      req,
      { error: "Body permintaan harus berupa JSON yang valid." },
      400
    );
  }

  const parsed = feedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return corsJson(
      req,
      { error: parsed.error.issues[0]?.message ?? "Body permintaan tidak valid" },
      400
    );
  }

  try {
    const result = await submitFeedback(parsed.data);

    if (!result.success) {
      return corsJson(req, { error: result.error }, 500);
    }

    return corsJson(req, {
      success: true,
      message: "Terima kasih atas feedback Anda!",
    });
  } catch {
    console.error("Feedback POST failed");
    return corsJson(req, { error: "Terjadi kesalahan" }, 500);
  }
}

export async function GET(req: NextRequest) {
  const devKey = getFeedbackDevKey();
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "");

  if (!devKey || providedKey !== devKey) {
    return corsJson(req, { error: "Unauthorized" }, 401);
  }

  const result = await getFeedback();
  if (!result.ok) {
    return corsJson(
      req,
      { error: "Pembacaan feedback belum tersedia" },
      503
    );
  }

  return corsJson(req, result.entries);
}