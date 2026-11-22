import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  submitFeedbackMock,
  getFeedbackMock,
  getPenilaianMock,
  getPenilaianStatsMock,
} = vi.hoisted(() => ({
  submitFeedbackMock: vi.fn(),
  getFeedbackMock: vi.fn(),
  getPenilaianMock: vi.fn(),
  getPenilaianStatsMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  submitFeedback: submitFeedbackMock,
  getFeedback: getFeedbackMock,
  getPenilaian: getPenilaianMock,
  getPenilaianStats: getPenilaianStatsMock,
}));

import {
  GET as FEEDBACK_GET,
  POST as FEEDBACK_POST,
} from "@/app/api/feedback/route";
import {
  GET as LEGACY_GET,
  POST as LEGACY_POST,
} from "@/app/api/penilaian/route";
import { resetRateLimits } from "@/lib/rate-limit";

function postRequest(
  path: string,
  body: unknown,
  options: { raw?: string; authorization?: string; ip?: string } = {}
): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.authorization) headers.authorization = options.authorization;
  if (options.ip) headers["x-forwarded-for"] = options.ip;

  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

function getRequest(path: string, authorization?: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: authorization ? { authorization } : undefined,
  });
}

beforeEach(() => {
  resetRateLimits();
  vi.stubEnv("FEEDBACK_ENABLED", "true");
  vi.stubEnv("FEEDBACK_DEV_KEY", "");
  vi.stubEnv("PENILAIAN_DEV_KEY", "");
  submitFeedbackMock.mockResolvedValue({ success: true });
  getFeedbackMock.mockResolvedValue({ ok: true, entries: [] });
  getPenilaianMock.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/feedback", () => {
  it("accepts rating + comment without name or gender", async () => {
    const response = await FEEDBACK_POST(
      postRequest("/api/feedback", {
        rating: 5,
        comment: "cepat",
        name: "Ani",
        gender: "P",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Terima kasih atas feedback Anda!",
    });
    expect(submitFeedbackMock).toHaveBeenCalledWith({
      rating: 5,
      comment: "cepat",
    });
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await FEEDBACK_POST(
      postRequest("/api/feedback", null, { raw: "{oops" })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Body permintaan harus berupa JSON yang valid.",
    });
    expect(submitFeedbackMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or invalid rating", async () => {
    const missing = await FEEDBACK_POST(
      postRequest("/api/feedback", { comment: "x" })
    );

    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({
      error: "rating wajib diisi (1-5)",
    });

    for (const rating of [0, 6]) {
      const response = await FEEDBACK_POST(
        postRequest("/api/feedback", { rating, comment: "x" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "rating harus 1-5" });
    }

    const nonNumber = await FEEDBACK_POST(
      postRequest("/api/feedback", { rating: "5", comment: "x" })
    );
    expect(nonNumber.status).toBe(400);
    expect(await nonNumber.json()).toEqual({
      error: "rating wajib diisi (1-5)",
    });
  });

  it("rejects a comment longer than 1000 characters", async () => {
    const response = await FEEDBACK_POST(
      postRequest("/api/feedback", {
        rating: 5,
        comment: "a".repeat(1001),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "comment maksimal 1000 karakter",
    });
  });

  it("returns 404 when FEEDBACK_ENABLED is false even if the old flag is true", async () => {
    vi.stubEnv("FEEDBACK_ENABLED", "false");
    vi.stubEnv("PENILAIAN_ENABLED", "true");

    const response = await FEEDBACK_POST(
      postRequest("/api/feedback", { rating: 5 })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Feedback tidak tersedia",
    });
  });
});

describe("POST /api/feedback rate limit", () => {
  const start = Date.UTC(2026, 0, 1, 0, 0, 0);
  let now = start;
  let dateSpy: ReturnType<typeof vi.spyOn>;

  function submit(
    options: { ip?: string; raw?: string; body?: unknown } = {}
  ) {
    return FEEDBACK_POST(
      postRequest(
        "/api/feedback",
        options.body ?? { rating: 5, comment: "ok" },
        {
          ip: options.ip ?? "203.0.113.10",
          raw: options.raw,
        }
      )
    );
  }

  beforeEach(() => {
    now = start;
    dateSpy = vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it("returns 429 with Retry-After on the sixth submission in ten minutes", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await submit()).status).toBe(200);
    }

    const blocked = await submit();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("600");
    expect(await blocked.json()).toEqual({
      error: "Batas kiriman feedback tercapai. Coba lagi beberapa saat lagi.",
    });
    expect(submitFeedbackMock).toHaveBeenCalledTimes(5);
  });

  it("limits malformed bodies before parsing", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await submit()).status).toBe(200);
    }

    const blocked = await submit({ raw: "{oops" });

    expect(blocked.status).toBe(429);
    expect(submitFeedbackMock).toHaveBeenCalledTimes(5);
  });

  it("allows submissions again after the ten minute window", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await submit()).status).toBe(200);
    }

    now = start + 10 * 60 * 1000 + 1;

    expect((await submit()).status).toBe(200);
  });

  it("does not apply one IP's limit to another IP", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await submit()).status).toBe(200);
    }
    expect((await submit()).status).toBe(429);

    const otherIp = await submit({ ip: "198.51.100.7" });

    expect(otherIp.status).toBe(200);
  });

  it("limits to 20 submissions per hour across ten minute windows", async () => {
    for (let window = 0; window < 4; window += 1) {
      for (let i = 0; i < 5; i += 1) {
        expect((await submit()).status).toBe(200);
      }
      now += 10 * 60 * 1000 + 1;
    }

    const blocked = await submit();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("1200");
    expect(submitFeedbackMock).toHaveBeenCalledTimes(20);
  });
});

describe("GET /api/feedback", () => {
  it("returns 401 without a dev key", async () => {
    vi.stubEnv("FEEDBACK_DEV_KEY", "");

    const response = await FEEDBACK_GET(getRequest("/api/feedback"));

    expect(response.status).toBe(401);
  });

  it("rejects wrong dev keys of the same and different length", async () => {
    vi.stubEnv("FEEDBACK_DEV_KEY", "new-key");

    for (const key of ["new-kez", "short"]) {
      const response = await FEEDBACK_GET(
        getRequest("/api/feedback", `Bearer ${key}`)
      );

      expect(response.status).toBe(401);
    }

    expect(getFeedbackMock).not.toHaveBeenCalled();
  });

  it("returns entries with FEEDBACK_DEV_KEY", async () => {
    vi.stubEnv("FEEDBACK_DEV_KEY", "new-key");
    getFeedbackMock.mockResolvedValue({
      ok: true,
      entries: [{ rating: 5, comment: "bagus" }],
    });

    const response = await FEEDBACK_GET(
      getRequest("/api/feedback", "Bearer new-key")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { rating: 5, comment: "bagus" },
    ]);
  });

  it("falls back to PENILAIAN_DEV_KEY", async () => {
    vi.stubEnv("FEEDBACK_DEV_KEY", "");
    vi.stubEnv("PENILAIAN_DEV_KEY", "old-key");

    const response = await FEEDBACK_GET(
      getRequest("/api/feedback", "Bearer old-key")
    );

    expect(response.status).toBe(200);
  });

  it("returns 503 when the service read is unavailable", async () => {
    vi.stubEnv("FEEDBACK_DEV_KEY", "key");
    getFeedbackMock.mockResolvedValue({ ok: false, entries: [] });

    const response = await FEEDBACK_GET(
      getRequest("/api/feedback", "Bearer key")
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Pembacaan feedback belum tersedia",
    });
  });
});

describe("legacy penilaian API", () => {
  it("returns 410 for POST and points to /api/feedback", async () => {
    const response = await LEGACY_POST(
      postRequest("/api/penilaian", { rating: 5 })
    );

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: "API penilaian sudah tidak digunakan. Gunakan /api/feedback.",
    });
  });

  it("rejects a wrong key for the legacy export", async () => {
    vi.stubEnv("PENILAIAN_DEV_KEY", "old-key");

    const response = await LEGACY_GET(
      getRequest("/api/penilaian", "Bearer wrong-key")
    );

    expect(response.status).toBe(401);
  });

  it("keeps GET for legacy export behind PENILAIAN_DEV_KEY", async () => {
    vi.stubEnv("PENILAIAN_DEV_KEY", "old-key");

    const unauthorized = await LEGACY_GET(
      getRequest("/api/penilaian")
    );
    expect(unauthorized.status).toBe(401);

    const response = await LEGACY_GET(
      getRequest("/api/penilaian", "Bearer old-key")
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});