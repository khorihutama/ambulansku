import { NextRequest } from "next/server";
import { generateTriage } from "@/lib/ai";
import { getNearbyFacilities } from "@/lib/places";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import { checkRateLimits } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { getTriageGlobalMax } from "@/lib/config";
import { triageRequestSchema } from "@/lib/schemas";
import { bearerToken, verifySessionToken } from "@/lib/session-token";

const SESSION_LIMIT = 10;
const SESSION_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 30;
const IP_WINDOW_MS = 10 * 60 * 1000;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 8 * 1024;

type BodyResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: number; error: string };

async function readJsonBody(req: NextRequest): Promise<BodyResult> {
  const contentLength = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "Body permintaan terlalu besar (maksimal 8 KB).",
    };
  }

  let raw = "";
  try {
    const reader = req.body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let total = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        total += value.byteLength;
        if (total > MAX_BODY_BYTES) {
          await reader.cancel().catch(() => undefined);
          return {
            ok: false,
            status: 413,
            error: "Body permintaan terlalu besar (maksimal 8 KB).",
          };
        }

        chunks.push(value);
      }

      raw = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString(
        "utf8"
      );
    }
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Body permintaan tidak dapat dibaca.",
    };
  }

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "Body permintaan terlalu besar (maksimal 8 KB).",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Body permintaan harus berupa JSON yang valid.",
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      status: 400,
      error: "Body permintaan harus berupa objek JSON.",
    };
  }

  return { ok: true, payload: parsed as Record<string, unknown> };
}

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

  const body = await readJsonBody(req);
  if (!body.ok) {
    return corsJson(req, { error: body.error }, body.status);
  }

  const { situation, lat, lng } = body.payload;

  if (situation === undefined || lat === undefined || lng === undefined) {
    return corsJson(req, { error: "situation, lat, lng are required" }, 400);
  }

  const parsed = triageRequestSchema.safeParse(body.payload);
  if (!parsed.success) {
    return corsJson(
      req,
      { error: parsed.error.issues[0]?.message ?? "Body permintaan tidak valid" },
      400
    );
  }

  const { situation: situationText, lat: latValue, lng: lngValue } =
    parsed.data;

  const limit = checkRateLimits([
    {
      key: `triage-session:${session.sid}`,
      limit: SESSION_LIMIT,
      windowMs: SESSION_WINDOW_MS,
    },
    {
      key: `triage-ip:${clientIp(req)}`,
      limit: IP_LIMIT,
      windowMs: IP_WINDOW_MS,
    },
    {
      key: "triage-global",
      limit: getTriageGlobalMax(),
      windowMs: GLOBAL_WINDOW_MS,
    },
  ]);

  if (!limit.allowed) {
    const isGlobal = limit.key === "triage-global";
    const isSession = limit.key?.startsWith("triage-session:");
    return corsJson(
      req,
      {
        error: isGlobal
          ? "Batas triage global tercapai. Coba lagi nanti."
          : isSession
            ? "Batas permintaan sesi tercapai. Coba lagi beberapa saat lagi."
            : "Batas permintaan tercapai. Coba lagi beberapa saat lagi.",
      },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }

  try {
    const triage = await generateTriage(situationText);
    const facilities = await getNearbyFacilities(
      latValue,
      lngValue,
      triage.searchKeywords
    );

    return corsJson(req, { triage, facilities });
  } catch {
    console.error("Triage request failed");
    return corsJson(req, { error: "Terjadi kesalahan, silakan coba lagi" }, 500);
  }
}