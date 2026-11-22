import { afterEach, describe, expect, it, vi } from "vitest";
import {
  corsHeaders,
  corsJson,
  corsOptionsResponse,
} from "@/lib/cors";

function request(origin?: string): Request {
  const headers: Record<string, string> = {};
  if (origin) headers.origin = origin;

  return new Request("http://localhost/api/triage", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("corsHeaders", () => {
  it("does not grant an origin by default", () => {
    const headers = corsHeaders(request());

    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    expect(headers["Access-Control-Max-Age"]).toBe("600");
    expect(headers.Vary).toBe("Origin");
  });

  it("echoes only origins listed in ALLOWED_ORIGINS", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://app.example, https://admin.example");

    expect(
      corsHeaders(request("https://app.example"))[
        "Access-Control-Allow-Origin"
      ]
    ).toBe("https://app.example");
    expect(
      corsHeaders(request("https://evil.example"))[
        "Access-Control-Allow-Origin"
      ]
    ).toBeUndefined();
  });
});

describe("CORS responses", () => {
  it("returns 204 for OPTIONS with the CORS headers", () => {
    const response = corsOptionsResponse(request("https://app.example"));

    expect(response.status).toBe(204);
    expect(response.headers.get("vary")).toBe("Origin");
  });

  it("adds CORS headers to a JSON response for an allowed origin", async () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://app.example");

    const response = corsJson(
      request("https://app.example"),
      { error: "contoh" },
      400
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "contoh" });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://app.example"
    );
  });
});