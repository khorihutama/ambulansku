import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { NearbyFacility, TriageResult } from "@/types";

const { generateTriageMock, getNearbyFacilitiesMock } = vi.hoisted(() => ({
  generateTriageMock: vi.fn(),
  getNearbyFacilitiesMock: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({ generateTriage: generateTriageMock }));
vi.mock("@/lib/places", () => ({
  getNearbyFacilities: getNearbyFacilitiesMock,
}));

import { POST as TRIAGE_POST } from "@/app/api/triage/route";
import {
  OPTIONS as TOKEN_OPTIONS,
  POST as TOKEN_POST,
} from "@/app/api/triage/token/route";
import { issueSessionToken, verifySessionToken } from "@/lib/session-token";
import { resetRateLimits } from "@/lib/rate-limit";

const TRIAGE: TriageResult = {
  urgency: "emergency",
  facilityTypes: ["RS", "PMI"],
  specialNeeds: ["IGD"],
  responseMessage: "Segera hubungi 119.",
  searchKeywords: ["rumah sakit terdekat", "IGD"],
};

const FACILITIES: NearbyFacility[] = [];

function tokenRequest(ip: string, origin?: string): NextRequest {
  const headers: Record<string, string> = { "x-forwarded-for": ip };
  if (origin) headers.origin = origin;

  return new NextRequest("http://localhost/api/triage/token", {
    method: "POST",
    headers,
  });
}

function triageRequest(
  token: string | null,
  ip = "203.0.113.50",
  origin?: string
): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": ip,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  if (origin) headers.origin = origin;

  return new NextRequest("http://localhost/api/triage", {
    method: "POST",
    headers,
    body: JSON.stringify({ situation: "nyeri dada", lat: -6.2, lng: 106.8 }),
  });
}

beforeEach(() => {
  resetRateLimits();
  generateTriageMock.mockResolvedValue(TRIAGE);
  getNearbyFacilitiesMock.mockResolvedValue(FACILITIES);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("triage session token", () => {
  it("issues a signed token with a 30 minute lifetime", async () => {
    const response = await TOKEN_POST(tokenRequest("203.0.113.1"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.expiresIn).toBe(1800);
    expect(typeof body.token).toBe("string");

    const session = verifySessionToken(body.token);
    expect(session?.sid).toBeTruthy();
  });

  it("rejects tampered and expired tokens", async () => {
    const { token } = issueSessionToken();

    expect(verifySessionToken(`${token}tampered`)).toBeNull();
    expect(
      verifySessionToken(token, Date.now() + 31 * 60 * 1000)
    ).toBeNull();
  });

  it("limits token issuance per IP", async () => {
    for (let i = 0; i < 30; i += 1) {
      const response = await TOKEN_POST(tokenRequest("203.0.113.2"));
      expect(response.status).toBe(200);
    }

    const blocked = await TOKEN_POST(tokenRequest("203.0.113.2"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});

describe("POST /api/triage session enforcement", () => {
  it("returns 401 without a token", async () => {
    const response = await TRIAGE_POST(triageRequest(null));

    expect(response.status).toBe(401);
    expect(generateTriageMock).not.toHaveBeenCalled();
  });

  it("returns 401 for a tampered token", async () => {
    const { token } = issueSessionToken();
    const response = await TRIAGE_POST(triageRequest(`${token}x`));

    expect(response.status).toBe(401);
    expect(generateTriageMock).not.toHaveBeenCalled();
  });

  it("accepts a valid token and keeps the response shape", async () => {
    const { token } = issueSessionToken();
    const response = await TRIAGE_POST(triageRequest(token));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      triage: TRIAGE,
      facilities: FACILITIES,
    });
  });

  it("enforces the per-session quota", async () => {
    const { token } = issueSessionToken();

    for (let i = 0; i < 10; i += 1) {
      const response = await TRIAGE_POST(
        triageRequest(token, `203.0.113.${100 + i}`)
      );
      expect(response.status).toBe(200);
    }

    const blocked = await TRIAGE_POST(triageRequest(token, "203.0.113.200"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(await blocked.json()).toEqual({
      error: "Batas permintaan sesi tercapai. Coba lagi beberapa saat lagi.",
    });
  });
});

describe("CORS allowlist", () => {
  it("does not grant a foreign origin", async () => {
    const response = await TOKEN_OPTIONS(tokenRequest("203.0.113.3", "https://evil.example"));

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("echoes only an origin listed in ALLOWED_ORIGINS", async () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://app.example");

    const allowed = await TOKEN_OPTIONS(
      tokenRequest("203.0.113.4", "https://app.example")
    );
    const denied = await TOKEN_OPTIONS(
      tokenRequest("203.0.113.4", "https://other.example")
    );

    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "https://app.example"
    );
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });
});