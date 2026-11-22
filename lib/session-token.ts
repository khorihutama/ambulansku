import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 30 * 60;
const DEV_SECRET = "ambulansku-dev-only-triage-secret-not-for-production";

export interface TriageSession {
  sid: string;
  iat: number;
  exp: number;
}

function signingSecret(): string {
  const secret = process.env.TRIAGE_SESSION_SECRET;

  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("TRIAGE_SESSION_SECRET must be at least 32 characters");
  }

  return DEV_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret())
    .update(payload)
    .digest("base64url");
}

export function issueSessionToken(now = Date.now()): {
  token: string;
  expiresIn: number;
} {
  const issuedAt = Math.floor(now / 1000);
  const session: TriageSession = {
    sid: randomUUID(),
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");

  return {
    token: `${body}.${sign(body)}`,
    expiresIn: TOKEN_TTL_SECONDS,
  };
}

export function verifySessionToken(
  token: string | null | undefined,
  now = Date.now()
): TriageSession | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  if (!body || !signature) return null;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }

  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (
    provided.length !== computed.length ||
    !timingSafeEqual(provided, computed)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as Partial<TriageSession>;

    if (typeof parsed.sid !== "string" || parsed.sid.length < 16) return null;
    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") {
      return null;
    }

    const nowSeconds = Math.floor(now / 1000);
    if (parsed.exp <= nowSeconds) return null;
    if (parsed.iat > nowSeconds + 60) return null;

    return { sid: parsed.sid, iat: parsed.iat, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}