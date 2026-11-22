import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/penilaian/status/route";

function request(): NextRequest {
  return new NextRequest("http://localhost/api/penilaian/status");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/penilaian/status", () => {
  it("reports enabled when PENILAIAN_ENABLED is true", async () => {
    vi.stubEnv("PENILAIAN_ENABLED", "true");

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true });
  });

  it("reports disabled when PENILAIAN_ENABLED is not true", async () => {
    vi.stubEnv("PENILAIAN_ENABLED", "false");

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: false });
  });
});