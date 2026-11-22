// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const { back } = vi.hoisted(() => ({ back: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams("situation=nyeri+dada&lat=-6.2&lng=106.8"),
  useRouter: () => ({ back }),
}));

vi.mock("@/components/MapView", () => ({
  default: () => <div>Peta uji</div>,
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

const FACILITIES = [
  {
    place_id: "p1",
    name: "RS Mitra Sehat Jakarta",
    vicinity: "Jl. Kebayoran Lama No. 12, Jakarta Selatan",
    geometry: { location: { lat: -6.2415, lng: 106.7992 } },
    distance: 1.2,
    opening_hours: { open_now: true },
    formatted_phone_number: "021-555-0101",
  },
  {
    place_id: "p2",
    name: "Puskesmas Kebayoran",
    vicinity: "Jl. Kyai Maja No. 8, Jakarta Selatan",
    geometry: { location: { lat: -6.2441, lng: 106.8011 } },
    distance: 2.4,
    opening_hours: { open_now: false },
    formatted_phone_number: "021-555-0102",
  },
];

const EMERGENCY = {
  urgency: "emergency",
  facilityTypes: ["RS"],
  specialNeeds: ["IGD"],
  responseMessage: "Segera hubungi 119.",
  searchKeywords: ["rumah sakit"],
};

const SCHEDULED = {
  urgency: "scheduled",
  facilityTypes: ["RS"],
  specialNeeds: [],
  responseMessage: "Kontrol rutin dapat dijadwalkan.",
  searchKeywords: ["rumah sakit"],
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("/hasil redesigned result", () => {
  it("renders facility details, 119, and a lazy map disclosure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN))
      .mockResolvedValueOnce(
        jsonResponse({ triage: EMERGENCY, facilities: FACILITIES })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(
      await screen.findByText("RS Mitra Sehat Jakarta")
    ).toBeTruthy();
    expect(screen.getByText("2 ditemukan")).toBeTruthy();
    expect(screen.getByText("1,2 km")).toBeTruthy();
    expect(screen.getByText("Buka")).toBeTruthy();
    expect(screen.getByText("Tutup")).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: /Telepon/ })[0].getAttribute("href")
    ).toBe("tel:021-555-0101");
    expect(
      screen.getAllByRole("link", { name: /Rute/ })[0].getAttribute("href")
    ).toContain("maps.google.com");

    expect(screen.queryByText("Peta uji")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Lihat peta fasilitas" })
    );
    expect(await screen.findByText("Peta uji")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Sembunyikan peta" })
    ).toBeTruthy();

    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
  });

  it("renders the scheduled urgency panel", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN))
      .mockResolvedValueOnce(
        jsonResponse({ triage: SCHEDULED, facilities: FACILITIES })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(await screen.findByText("Terjadwal")).toBeTruthy();
    expect(screen.getByText("Bantuan terjadwal")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
  });

  it("retries a failed triage request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(TOKEN))
      .mockResolvedValueOnce(jsonResponse({ error: "Triage gagal" }, 500))
      .mockResolvedValueOnce(jsonResponse({ error: "Triage gagal" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    render(<HasilPage />);

    expect(
      await screen.findByText("Fasilitas belum bisa dimuat")
    ).toBeTruthy();
    expect(screen.getByText("Triage gagal")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(
      screen.getByRole("link", { name: /Hubungi 119/ }).getAttribute("href")
    ).toBe("tel:119");
  });
});