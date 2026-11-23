import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as PENILAIAN_GET } from "@/app/api/penilaian/route";

function getRequest(authorization: string): NextRequest {
  return new NextRequest("http://localhost/api/penilaian", {
    headers: { authorization },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/penilaian without a service role", () => {
  it("returns 503 when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    vi.stubEnv("PENILAIAN_DEV_KEY", "dev-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const response = await PENILAIAN_GET(getRequest("Bearer dev-key"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Ekspor penilaian belum tersedia",
    });
  });
});