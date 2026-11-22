// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { back } = vi.hoisted(() => ({ back: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams("situation=nyeri+dada&lat=-6.2&lng=106.8"),
  useRouter: () => ({ back }),
}));

import HasilPage from "@/app/hasil/page";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const TOKEN = { token: "test-token", expiresIn: 1800 };

const SCHEDULED_EMPTY = {
  triage: {
    urgency: "scheduled",
    facilityTypes: ["RS"],
    specialNeeds: [],
    responseMessage: "Kontrol rutin dapat dijadwalkan.",
    searchKeywords: ["rumah sakit"],
  },
  facilities: [],
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/hasil emergency call access", () => {
  it("shows 119 while loading", () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(screen.getByText("Mencari fasilitas terdekat...")).toBeTruthy();

    const call = screen.getByRole("link", { name: /Hubungi 119/ });
    expect(call.getAttribute("href")).toBe("tel:119");
  });

  it("shows 119 when the session token is rejected", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { error: "Sesi tidak valid. Muat ulang halaman lalu coba lagi." },
          401
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(await screen.findByText(/Sesi tidak valid/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows 119 when the quota is exhausted", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN))
      .mockResolvedValueOnce(
        jsonResponse(
          { error: "Batas permintaan sesi tercapai. Coba lagi beberapa saat lagi." },
          429
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(await screen.findByText(/Batas permintaan sesi/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
  });

  it("shows 119 on a scheduled result with no facilities and no feedback FAB", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN))
      .mockResolvedValueOnce(jsonResponse(SCHEDULED_EMPTY));
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(
      await screen.findByText(/Tidak ada fasilitas ditemukan/)
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
    expect(screen.queryByLabelText("Feedback")).toBeNull();
  });
});