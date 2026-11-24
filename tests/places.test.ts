import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type PlacesModule = typeof import("@/lib/places");

const EXPECTED_URL = "https://places.googleapis.com/v1/places:searchText";
const EXPECTED_FIELD_MASK =
  "places.id,places.displayName,places.shortFormattedAddress,places.formattedAddress,places.location,places.rating,places.currentOpeningHours.openNow,places.nationalPhoneNumber,places.internationalPhoneNumber";

interface SearchTextBody {
  textQuery: string;
  maxResultCount: number;
  locationBias: {
    circle: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as unknown as Response;
}

function place(
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id,
    displayName: { text: name },
    shortFormattedAddress: `${name} vicinity`,
    formattedAddress: `${name} full address`,
    location: { latitude, longitude },
    rating: 4.5,
    currentOpeningHours: { openNow: true },
    ...extra,
  };
}

function parseBody(init?: RequestInit): SearchTextBody {
  return JSON.parse(String(init?.body ?? "{}")) as SearchTextBody;
}

function getHeaders(init?: RequestInit): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

const defaultFetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);

  if (url === EXPECTED_URL && init?.method === "POST") {
    const body = parseBody(init);

    if (body.textQuery === "rumah sakit") {
      return jsonResponse({
        places: [
          place("p1", "RS Satu", -6.19, 106.8, {
            nationalPhoneNumber: "021-555-0119",
            internationalPhoneNumber: "+62 21 555-0119",
          }),
          place("p2", "RS Dua", -6.18, 106.8, {
            shortFormattedAddress: undefined,
            formattedAddress: "Jl. RS Dua Lengkap",
            internationalPhoneNumber: "+62 21 555-0222",
            currentOpeningHours: { openNow: false },
          }),
        ],
      });
    }

    if (body.textQuery === "igd") {
      return jsonResponse({
        places: [
          place("p1", "RS Satu duplikat", -6.19, 106.8),
          place("p4", "Klinik Dekat", -6.195, 106.8, {
            currentOpeningHours: undefined,
          }),
          place("p5", "RS Tiga", -6.17, 106.8),
          place("p6", "RS Empat", -6.16, 106.8),
          place("p7", "RS Lima", -6.15, 106.8),
        ],
      });
    }

    return jsonResponse({ places: [] });
  }

  throw new Error(`Unexpected fetch: ${init?.method ?? "GET"} ${url}`);
};

const fetchMock = vi.fn(defaultFetchImpl);

let getNearbyFacilities: PlacesModule["getNearbyFacilities"];

beforeAll(async () => {
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  vi.stubGlobal("fetch", fetchMock);
  ({ getNearbyFacilities } = await import("@/lib/places"));
});

afterEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(defaultFetchImpl);
});

afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_MAPS_API_KEY;
});

describe("getNearbyFacilities Places API (New)", () => {
  it("sends POST searchText with required headers, body, two-keyword cap, dedup, sort, and five-facility cap", async () => {
    const result = await getNearbyFacilities(-6.2, 106.8, [
      "rumah sakit",
      "igd",
      "klinik",
    ]);

    // Single parallel wave: max 2 keywords, no legacy details calls.
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const queries: string[] = [];
    for (const [input, init] of fetchMock.mock.calls) {
      const url = String(input);
      expect(url).toBe(EXPECTED_URL);
      expect(url).not.toContain("test-key");
      expect(init?.method).toBe("POST");

      const headers = getHeaders(init);
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["X-Goog-Api-Key"]).toBe("test-key");
      expect(headers["X-Goog-FieldMask"]).toBe(EXPECTED_FIELD_MASK);

      const body = parseBody(init);
      queries.push(body.textQuery);
      expect(body.maxResultCount).toBe(10);
      expect(body.locationBias).toEqual({
        circle: {
          center: { latitude: -6.2, longitude: 106.8 },
          radius: 10000,
        },
      });
    }

    expect(queries).toEqual(["rumah sakit", "igd"]);
    expect(queries).not.toContain("klinik");

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
    expect(duplicate[0].vicinity).toBe("RS Satu vicinity");
    expect(duplicate[0].opening_hours).toEqual({ open_now: true });
    expect(duplicate[0].formatted_phone_number).toBe("021-555-0119");

    const fallback = result.find((f) => f.place_id === "p2");
    expect(fallback?.vicinity).toBe("Jl. RS Dua Lengkap");
    expect(fallback?.formatted_phone_number).toBe("+62 21 555-0222");
    expect(fallback?.opening_hours).toEqual({ open_now: false });

    const noHoursOrPhone = result.find((f) => f.place_id === "p4");
    expect(noHoursOrPhone?.opening_hours).toBeUndefined();
    expect(noHoursOrPhone?.formatted_phone_number).toBeUndefined();

    expect(result[0].distance).toBeCloseTo(0.556, 1);
    expect(
      result.every(
        (facility, index) =>
          index === 0 ||
          (result[index - 1].distance ?? 0) <= (facility.distance ?? 0)
      )
    ).toBe(true);
  });

  it("passes custom radius and clamps out-of-range radii to 0..50000", async () => {
    await getNearbyFacilities(-6.2, 106.8, ["rumah sakit", "igd"], 2500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.every(
        ([, init]) => parseBody(init).locationBias.circle.radius === 2500
      )
    ).toBe(true);

    fetchMock.mockClear();
    await getNearbyFacilities(-6.2, 106.8, ["rumah sakit"], -500);
    expect(
      parseBody(fetchMock.mock.calls[0][1]).locationBias.circle.radius
    ).toBe(0);

    fetchMock.mockClear();
    await getNearbyFacilities(-6.2, 106.8, ["rumah sakit"], 75000);
    expect(
      parseBody(fetchMock.mock.calls[0][1]).locationBias.circle.radius
    ).toBe(50000);
  });

  it("returns an empty list without throwing on non-2xx responses", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "API_KEY_INVALID" } }, 403)
    );

    const result = await getNearbyFacilities(-6.2, 106.8, ["rumah sakit"]);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls.flat().join(" ")).toContain("status=403");
    warn.mockRestore();
  });

  it("returns at most five results sorted by ascending distance", async () => {
    const result = await getNearbyFacilities(-6.2, 106.8, [
      "rumah sakit",
      "igd",
    ]);

    expect(result).toHaveLength(5);
    expect(
      result.every((facility) => typeof facility.distance === "number")
    ).toBe(true);
    expect(
      result.every(
        (facility, index) =>
          index === 0 ||
          (result[index - 1].distance ?? 0) <= (facility.distance ?? 0)
      )
    ).toBe(true);
  });
});
