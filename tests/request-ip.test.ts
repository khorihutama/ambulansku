import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp } from "@/lib/request-ip";

function request(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/triage", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("clientIp", () => {
  it("uses the hop appended by the trusted proxy, not the leftmost entry", () => {
    const ip = clientIp(
      request({
        "x-forwarded-for": "198.51.100.99, 203.0.113.7",
      })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("ignores a rotating client-supplied left entry", () => {
    const first = clientIp(
      request({ "x-forwarded-for": "10.0.0.1, 203.0.113.7" })
    );
    const second = clientIp(
      request({ "x-forwarded-for": "10.0.0.2, 203.0.113.7" })
    );

    expect(first).toBe(second);
  });

  it("supports multiple trusted proxy hops", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");

    const ip = clientIp(
      request({
        "x-forwarded-for": "1.1.1.1, 203.0.113.7, 10.0.0.9",
      })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip and then unknown", () => {
    expect(clientIp(request({ "x-real-ip": "203.0.113.8" }))).toBe(
      "203.0.113.8"
    );
    expect(clientIp(request({}))).toBe("unknown");
  });
});