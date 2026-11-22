import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { submitPenilaianMock } = vi.hoisted(() => ({
  submitPenilaianMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  submitPenilaian: submitPenilaianMock,
  getPenilaian: vi.fn(),
  getPenilaianStats: vi.fn(),
}));

import { POST } from "@/app/api/penilaian/route";

function request(body: unknown, raw?: string): NextRequest {
  return new NextRequest("http://localhost/api/penilaian", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

const VALID = {
  name: "Ani",
  gender: "P",
  stars: 5,
  liked: "cepat",
  disliked: "antre",
};

beforeEach(() => {
  vi.stubEnv("PENILAIAN_ENABLED", "true");
  submitPenilaianMock.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/penilaian body validation", () => {
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(request(null, "{oops"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Body permintaan harus berupa JSON yang valid.",
    });
    expect(submitPenilaianMock).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(
      request({ gender: "L", stars: 4, liked: "baik" })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "name, gender, stars, dan liked wajib diisi",
    });
  });

  it("returns 400 for an invalid gender or rating", async () => {
    const gender = await POST(request({ ...VALID, gender: "X" }));
    const stars = await POST(request({ ...VALID, stars: 6 }));

    expect(gender.status).toBe(400);
    expect(await gender.json()).toEqual({
      error: "gender harus L, P, atau O",
    });
    expect(stars.status).toBe(400);
    expect(await stars.json()).toEqual({ error: "stars harus 1-5" });
  });

  it("accepts a valid body and forwards the trimmed values", async () => {
    const response = await POST(
      request({ ...VALID, name: "  Ani  ", liked: "  cepat  " })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Terima kasih atas feedback Anda!",
    });
    expect(submitPenilaianMock).toHaveBeenCalledWith({
      name: "Ani",
      gender: "P",
      stars: 5,
      liked: "cepat",
      disliked: "antre",
    });
  });

  it("keeps the kill switch per request", async () => {
    vi.stubEnv("PENILAIAN_ENABLED", "false");

    const response = await POST(request(VALID));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Feedback tidak tersedia",
    });
  });
});