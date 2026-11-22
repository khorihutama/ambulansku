import type { NearbyFacility } from "@/types";
import { getGoogleMapsApiKey, getPlacesTimeoutMs } from "@/lib/config";
import { errorKind, isNetworkError } from "@/lib/network";

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let warnedMissingKey = false;

async function fetchPlaces(
  url: string,
  label: string,
  timeoutMs: number
): Promise<Response | null> {
  const attempt = async () => {
    const startedAt = Date.now();

    try {
      const response = await fetch(
        url,
        timeoutMs > 0
          ? { signal: AbortSignal.timeout(timeoutMs) }
          : undefined
      );
      console.info(
        `[places] ${label} duration=${Date.now() - startedAt}ms status=${
          response.status
        }`
      );
      return response;
    } catch (error) {
      console.warn(
        `[places] ${label} duration=${Date.now() - startedAt}ms failed kind=${errorKind(
          error
        )}`
      );
      throw error;
    }
  };

  try {
    return await attempt();
  } catch (error) {
    if (!isNetworkError(error)) return null;

    console.warn(`[places] ${label} retrying once after network error`);
    try {
      return await attempt();
    } catch {
      return null;
    }
  }
}

const MAX_FACILITIES = 5;
const MAX_KEYWORDS = 2;

interface PlacesResult {
  place_id?: unknown;
  name?: unknown;
  vicinity?: unknown;
  geometry?: { location?: { lat?: unknown; lng?: unknown } };
  rating?: unknown;
  opening_hours?: { open_now?: unknown };
}

interface LocatedPlace {
  place_id: string;
  name: string;
  vicinity: string;
  location: { lat: number; lng: number };
  rating?: number;
  openNow?: boolean;
}

function asLocatedPlace(value: PlacesResult): LocatedPlace | null {
  const placeId = value.place_id;
  const lat = value.geometry?.location?.lat;
  const lng = value.geometry?.location?.lng;

  if (
    typeof placeId !== "string" ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    place_id: placeId,
    name: typeof value.name === "string" ? value.name : "",
    vicinity: typeof value.vicinity === "string" ? value.vicinity : "",
    location: { lat, lng },
    rating: typeof value.rating === "number" ? value.rating : undefined,
    openNow:
      typeof value.opening_hours?.open_now === "boolean"
        ? value.opening_hours.open_now
        : undefined,
  };
}

async function fetchNearbyResults(
  url: string,
  timeoutMs: number
): Promise<LocatedPlace[]> {
  try {
    const res = await fetchPlaces(url, "nearbysearch", timeoutMs);
    if (!res) return [];

    const data = (await res.json().catch(() => null)) as {
      results?: PlacesResult[];
    } | null;
    if (!data) {
      console.error("[places] nearbysearch response invalid");
      return [];
    }

    const results = Array.isArray(data.results) ? data.results : [];
    return results
      .map(asLocatedPlace)
      .filter((place): place is LocatedPlace => place !== null);
  } catch {
    console.error("[places] nearbysearch processing failed");
    return [];
  }
}

async function fetchPhone(
  placeId: string,
  apiKey: string,
  timeoutMs: number
): Promise<string | undefined> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=formatted_phone_number&key=${apiKey}`;

  try {
    const res = await fetchPlaces(url, "details", timeoutMs);
    if (!res) return undefined;

    const data = (await res.json().catch(() => null)) as {
      result?: { formatted_phone_number?: unknown };
    } | null;
    const phone = data?.result?.formatted_phone_number;
    return typeof phone === "string" ? phone : undefined;
  } catch {
    return undefined;
  }
}

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  keywords: string[],
  radius = 10000
): Promise<NearbyFacility[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn(
        "[places] GOOGLE_MAPS_API_KEY is empty; skipping Places lookup"
      );
      warnedMissingKey = true;
    }
    return [];
  }

  const timeoutMs = getPlacesTimeoutMs();

  // One parallel wave for nearby search, then one parallel wave for details.
  // Worst case is bounded by two timeout windows instead of one per result.
  const nearby = await Promise.all(
    keywords.slice(0, MAX_KEYWORDS).map((keyword) => {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(
        keyword
      )}&key=${apiKey}`;
      return fetchNearbyResults(url, timeoutMs);
    })
  );

  const seen = new Set<string>();
  const ranked = nearby
    .flat()
    .filter((place) => {
      if (seen.has(place.place_id)) return false;
      seen.add(place.place_id);
      return true;
    })
    .map((place) => ({
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      geometry: { location: place.location },
      rating: place.rating,
      opening_hours:
        place.openNow === undefined ? undefined : { open_now: place.openNow },
      distance: calculateDistance(
        lat,
        lng,
        place.location.lat,
        place.location.lng
      ),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, MAX_FACILITIES);

  return Promise.all(
    ranked.map(async (facility) => ({
      ...facility,
      formatted_phone_number: await fetchPhone(
        facility.place_id,
        apiKey,
        timeoutMs
      ),
    }))
  );
}