import { NextRequest } from "next/server";
import { generateTriage } from "@/lib/ai";
import { getNearbyFacilities } from "@/lib/places";
import { corsOptionsResponse, corsJson } from "@/lib/cors";
import { checkRateLimits } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { bearerToken, verifySessionToken } from "@/lib/session-token";

const SESSION_LIMIT = 10;
const SESSION_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 30;
const IP_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_GLOBAL_LIMIT = 60;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 8 * 1024;
const MAX_SITUATION_CHARS = 2000;

type BodyResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: number; error: string };

function globalTriageLimit(): number {
  const parsed = Number.parseInt(process.env.TRIAGE_GLOBAL_MAX ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_GLOBAL_LIMIT;
}

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

  if (typeof situation !== "string") {
    return corsJson(req, { error: "situation harus berupa teks" }, 400);
  }

  const situationText = situation.trim();
  if (situationText.length === 0) {
    return corsJson(req, { error: "situation tidak boleh kosong" }, 400);
  }
  if (situationText.length > MAX_SITUATION_CHARS) {
    return corsJson(
      req,
      { error: `situation maksimal ${MAX_SITUATION_CHARS} karakter` },
      400
    );
  }

  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    typeof lng !== "number" ||
    !Number.isFinite(lng)
  ) {
    return corsJson(req, { error: "lat dan lng harus berupa angka" }, 400);
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return corsJson(req, { error: "lat atau lng di luar rentang" }, 400);
  }

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
      limit: globalTriageLimit(),
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
    const facilities = await getNearbyFacilities(lat, lng, triage.searchKeywords);

    return corsJson(req, { triage, facilities });
  } catch (error) {
    console.error("Triage error:", error);
    return corsJson(req, { error: "Terjadi kesalahan, silakan coba lagi" }, 500);
  }
}