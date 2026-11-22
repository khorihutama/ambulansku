import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { NearbyFacility, TriageResult } from "@/types";
import { issueSessionToken } from "@/lib/session-token";
import { resetRateLimits } from "@/lib/rate-limit";

const { generateTriageMock, getNearbyFacilitiesMock } = vi.hoisted(() => ({
  generateTriageMock: vi.fn(),
  getNearbyFacilitiesMock: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({ generateTriage: generateTriageMock }));
vi.mock("@/lib/places", () => ({
  getNearbyFacilities: getNearbyFacilitiesMock,
}));

import { POST } from "@/app/api/triage/route";

const TRIAGE: TriageResult = {
  urgency: "emergency",
  facilityTypes: ["RS", "PMI"],
  specialNeeds: ["IGD"],
  responseMessage: "Segera hubungi 119.",
  searchKeywords: ["rumah sakit terdekat", "IGD"],
};

const FACILITIES: NearbyFacility[] = [
  {
    place_id: "p1",
    name: "RS Uji",
    vicinity: "Jl. Uji",
    geometry: { location: { lat: -6.2, lng: 106.8 } },
    distance: 1.2,
  },
];

let sessionToken = "";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/triage", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${sessionToken}`,
      "x-forwarded-for": "198.51.100.10",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRateLimits();
  sessionToken = issueSessionToken().token;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/triage contract", () => {
  it("returns 400 when situation is missing", async () => {
    const response = await POST(request({ lat: -6.2, lng: 106.8 }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "situation, lat, lng are required",
    });
    expect(generateTriageMock).not.toHaveBeenCalled();
    expect(getNearbyFacilitiesMock).not.toHaveBeenCalled();
  });

  it("returns 400 when lat is 0", async () => {
    // Known bug kept as-is: `!lat` treats 0 as missing (scope §2.1, §10).
    const response = await POST(
      request({ situation: "nyeri dada", lat: 0, lng: 106.8 })
    );

    expect(response.status).toBe(400);
    expect(generateTriageMock).not.toHaveBeenCalled();
  });

  it("returns 200 with the triage and facilities contract", async () => {
    generateTriageMock.mockResolvedValue(TRIAGE);
    getNearbyFacilitiesMock.mockResolvedValue(FACILITIES);

    const response = await POST(
      request({ situation: "nyeri dada", lat: -6.2, lng: 106.8 })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();

    const json = await response.json();
    expect(json).toEqual({ triage: TRIAGE, facilities: FACILITIES });
    expect(Object.keys(json.triage).sort()).toEqual([
      "facilityTypes",
      "responseMessage",
      "searchKeywords",
      "specialNeeds",
      "urgency",
    ]);
    expect(generateTriageMock).toHaveBeenCalledWith("nyeri dada");
    expect(getNearbyFacilitiesMock).toHaveBeenCalledWith(
      -6.2,
      106.8,
      TRIAGE.searchKeywords
    );
  });
});