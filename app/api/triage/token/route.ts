import { NextRequest } from "next/server";
import { corsJson, corsOptionsResponse } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { issueSessionToken } from "@/lib/session-token";

const TOKEN_LIMIT = 30;
const TOKEN_WINDOW_MS = 60 * 60 * 1000;

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse(req);
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(
    `triage-token:${clientIp(req)}`,
    TOKEN_LIMIT,
    TOKEN_WINDOW_MS
  );

  if (!limit.allowed) {
    return corsJson(
      req,
      { error: "Terlalu banyak permintaan sesi. Coba lagi nanti." },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }

  try {
    const { token, expiresIn } = issueSessionToken();
    return corsJson(req, { token, expiresIn });
  } catch {
    console.error("Session token creation failed");
    return corsJson(req, { error: "Layanan sesi belum siap" }, 503);
  }
}