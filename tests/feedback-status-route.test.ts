import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as FEEDBACK_STATUS } from "@/app/api/feedback/status/route";
import { GET as LEGACY_STATUS } from "@/app/api/penilaian/status/route";

function request(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/feedback/status", () => {
  it("reports enabled from FEEDBACK_ENABLED", async () => {
    vi.stubEnv("FEEDBACK_ENABLED", "true");

    const response = await FEEDBACK_STATUS(request("/api/feedback/status"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true });
  });

  it("lets FEEDBACK_ENABLED=false override the legacy flag", async () => {
    vi.stubEnv("FEEDBACK_ENABLED", "false");
    vi.stubEnv("PENILAIAN_ENABLED", "true");

    const response = await FEEDBACK_STATUS(request("/api/feedback/status"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: false });
  });

  it("falls back to PENILAIAN_ENABLED when FEEDBACK_ENABLED is unset", async () => {
    vi.stubEnv("FEEDBACK_ENABLED", "");
    vi.stubEnv("PENILAIAN_ENABLED", "true");

    const response = await FEEDBACK_STATUS(request("/api/feedback/status"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true });
  });
});

describe("legacy /api/penilaian/status", () => {
  it("returns 410 and points to /api/feedback/status", async () => {
    const response = await LEGACY_STATUS(
      request("/api/penilaian/status")
    );

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error:
        "API penilaian/status sudah tidak digunakan. Gunakan /api/feedback/status.",
    });
  });
});