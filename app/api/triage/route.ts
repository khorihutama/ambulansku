import { NextRequest } from "next/server";
import { generateTriage } from "@/lib/ai";
import { getNearbyFacilities } from "@/lib/places";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { bearerToken, verifySessionToken } from "@/lib/session-token";

const SESSION_LIMIT = 10;
const SESSION_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 30;
const IP_WINDOW_MS = 10 * 60 * 1000;

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse(req);
}

export async function POST(req: NextRequest) {
  const session = verifySessionToken(bearerToken(req));
  if (!session) {
    return corsJson(
      req,
      { error: "Sesi tidak valid. Muat ulang halaman lalu coba lagi." },
      401
    );
  }

  try {
    const { situation, lat, lng } = await req.json();

    if (!situation || !lat || !lng) {
      return corsJson(req, { error: "situation, lat, lng are required" }, 400);
    }

    const sessionLimit = checkRateLimit(
      `triage-session:${session.sid}`,
      SESSION_LIMIT,
      SESSION_WINDOW_MS
    );
    if (!sessionLimit.allowed) {
      return corsJson(
        req,
        { error: "Batas permintaan sesi tercapai. Coba lagi beberapa saat lagi." },
        429,
        { "Retry-After": String(sessionLimit.retryAfterSeconds) }
      );
    }

    const ipLimit = checkRateLimit(
      `triage-ip:${clientIp(req)}`,
      IP_LIMIT,
      IP_WINDOW_MS
    );
    if (!ipLimit.allowed) {
      return corsJson(
        req,
        { error: "Batas permintaan tercapai. Coba lagi beberapa saat lagi." },
        429,
        { "Retry-After": String(ipLimit.retryAfterSeconds) }
      );
    }

    const triage = await generateTriage(situation);
    const facilities = await getNearbyFacilities(lat, lng, triage.searchKeywords);

    return corsJson(req, { triage, facilities });
  } catch (error) {
    console.error("Triage error:", error);
    return corsJson(req, { error: "Terjadi kesalahan, silakan coba lagi" }, 500);
  }
}