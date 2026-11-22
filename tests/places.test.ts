import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type PlacesModule = typeof import("@/lib/places");

function jsonResponse(data: unknown): Response {
  return { json: async () => data } as unknown as Response;
}

function place(
  place_id: string,
  name: string,
  lat: number,
  lng: number
): Record<string, unknown> {
  return {
    place_id,
    name,
    vicinity: `${name} vicinity`,
    geometry: { location: { lat, lng } },
    rating: 4.5,
    opening_hours: { open_now: true },
  };
}

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);

  if (url.includes("/place/nearbysearch/json")) {
    if (url.includes("keyword=rumah%20sakit")) {
      return jsonResponse({
        results: [
          place("p1", "RS Satu", -6.19, 106.8),
          place("p2", "RS Dua", -6.18, 106.8),
        ],
      });
    }

    if (url.includes("keyword=igd")) {
      return jsonResponse({
        results: [
          place("p1", "RS Satu duplikat", -6.19, 106.8),
          place("p4", "Klinik Dekat", -6.195, 106.8),
          place("p5", "RS Tiga", -6.17, 106.8),
          place("p6", "RS Empat", -6.16, 106.8),
          place("p7", "RS Lima", -6.15, 106.8),
        ],
      });
    }

    return jsonResponse({ results: [] });
  }

  if (url.includes("/place/details/json")) {
    if (url.includes("place_id=p1")) {
      return jsonResponse({
        result: { formatted_phone_number: "021-555-0119" },
      });
    }
    return jsonResponse({ result: {} });
  }

  throw new Error(`Unexpected fetch: ${url}`);
});

let getNearbyFacilities: PlacesModule["getNearbyFacilities"];

beforeAll(async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  vi.stubGlobal("fetch", fetchMock);
  ({ getNearbyFacilities } = await import("@/lib/places"));
});

afterEach(() => {
  fetchMock.mockClear();
});

afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_MAPS_API_KEY;
});

describe("getNearbyFacilities dedup and distance", () => {
  it("uses two keywords, dedups by place_id, sorts by km distance and caps at five", async () => {
    const result = await getNearbyFacilities(-6.2, 106.8, [
      "rumah sakit",
      "igd",
      "klinik",
    ]);

    const nearbyCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/place/nearbysearch/json")
    );

    expect(nearbyCalls).toHaveLength(2);
    expect(nearbyCalls.every(([input]) => String(input).includes("radius=10000"))).toBe(
      true
    );
    expect(
      nearbyCalls.some(([input]) => String(input).includes("keyword=klinik"))
    ).toBe(false);

    expect(result).toHaveLength(5);
    expect(result.map((f) => f.place_id)).toEqual([
      "p4",
      "p1",
      "p2",
      "p5",
      "p6",
    ]);

    const duplicate = result.filter((f) => f.place_id === "p1");
    expect(duplicate).toHaveLength(1);
    expect(duplicate[0].name).toBe("RS Satu");
    expect(duplicate[0].formatted_phone_number).toBe("021-555-0119");

    expect(result[0].distance).toBeCloseTo(0.556, 1);
    expect(
      result.every(
        (facility, index) =>
          index === 0 ||
          (result[index - 1].distance ?? 0) <= (facility.distance ?? 0)
      )
    ).toBe(true);
  });
});