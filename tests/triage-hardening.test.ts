import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { TriageResult } from "@/types";

const { generateTriageMock, getNearbyFacilitiesMock } = vi.hoisted(() => ({
  generateTriageMock: vi.fn(),
  getNearbyFacilitiesMock: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({ generateTriage: generateTriageMock }));
vi.mock("@/lib/places", () => ({
  getNearbyFacilities: getNearbyFacilitiesMock,
}));

import { POST as TRIAGE_POST } from "@/app/api/triage/route";
import { POST as TOKEN_POST } from "@/app/api/triage/token/route";
import { issueSessionToken } from "@/lib/session-token";
import { resetRateLimits } from "@/lib/rate-limit";

const TRIAGE: TriageResult = {
  urgency: "emergency",
  facilityTypes: ["RS", "PMI"],
  specialNeeds: ["IGD"],
  responseMessage: "Segera hubungi 119.",
  searchKeywords: ["rumah sakit terdekat", "IGD"],
};

const DEFAULT_BODY = {
  situation: "nyeri dada",
  lat: -6.2,
  lng: 106.8,
};

function tokenRequest(trustedIp: string, spoofedLeft = "10.0.0.1"): NextRequest {
  return new NextRequest("http://localhost/api/triage/token", {
    method: "POST",
    headers: {
      "x-forwarded-for": `${spoofedLeft}, ${trustedIp}`,
    },
  });
}

function triageRequest(init: {
  body?: unknown;
  raw?: string;
  ip?: string;
  spoofedLeft?: string;
}): NextRequest {
  const token = issueSessionToken().token;
  const payload = init.raw ?? JSON.stringify(init.body ?? DEFAULT_BODY);

  return new NextRequest("http://localhost/api/triage", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-forwarded-for": `${init.spoofedLeft ?? "10.0.0.1"}, ${
        init.ip ?? "203.0.113.50"
      }`,
    },
    body: payload,
  });
}

beforeEach(() => {
  resetRateLimits();
  generateTriageMock.mockResolvedValue(TRIAGE);
  getNearbyFacilitiesMock.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("trusted proxy IP keying", () => {
  it("does not reset the per-IP token budget when the left header entry rotates", async () => {
    for (let i = 0; i < 30; i += 1) {
      const response = await TOKEN_POST(
        tokenRequest("203.0.113.201", `198.51.100.${i}`)
      );
      expect(response.status).toBe(200);
    }

    const blocked = await TOKEN_POST(
      tokenRequest("203.0.113.201", "198.51.100.250")
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});

describe("global triage budget", () => {
  it("blocks across sessions once TRIAGE_GLOBAL_MAX is reached", async () => {
    vi.stubEnv("TRIAGE_GLOBAL_MAX", "2");

    const first = await TRIAGE_POST(
      triageRequest({ ip: "203.0.113.31" })
    );
    const second = await TRIAGE_POST(
      triageRequest({ ip: "203.0.113.32" })
    );
    const blocked = await TRIAGE_POST(
      triageRequest({ ip: "203.0.113.33" })
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(await blocked.json()).toEqual({
      error: "Batas triage global tercapai. Coba lagi nanti.",
    });
    expect(generateTriageMock).toHaveBeenCalledTimes(2);
  });
});

describe("triage input limits", () => {
  it("rejects a body larger than 8 KB with 413", async () => {
    const response = await TRIAGE_POST(
      triageRequest({
        body: { situation: "a".repeat(9000), lat: -6.2, lng: 106.8 },
      })
    );

    expect(response.status).toBe(413);
    expect(generateTriageMock).not.toHaveBeenCalled();
  });

  it("rejects a situation longer than 2000 characters with 400", async () => {
    const response = await TRIAGE_POST(
      triageRequest({
        body: { situation: "a".repeat(2001), lat: -6.2, lng: 106.8 },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "situation maksimal 2000 karakter",
    });
  });

  it("rejects a non-string situation", async () => {
    const response = await TRIAGE_POST(
      triageRequest({ body: { situation: 123, lat: -6.2, lng: 106.8 } })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "situation harus berupa teks",
    });
  });

  it("returns 400 for malformed JSON, not 500", async () => {
    const response = await TRIAGE_POST(triageRequest({ raw: "{oops" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Body permintaan harus berupa JSON yang valid.",
    });
  });

  it("accepts lat and lng equal to 0", async () => {
    const response = await TRIAGE_POST(
      triageRequest({ body: { situation: "nyeri dada", lat: 0, lng: 0 } })
    );

    expect(response.status).toBe(200);
    expect(getNearbyFacilitiesMock).toHaveBeenCalledWith(
      0,
      0,
      TRIAGE.searchKeywords
    );
  });

  it("rejects a string latitude", async () => {
    const response = await TRIAGE_POST(
      triageRequest({
        body: { situation: "nyeri dada", lat: "-6.2", lng: 106.8 },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "lat dan lng harus berupa angka",
    });
  });
});