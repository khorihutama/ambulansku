import type { NearbyFacility } from "@/types";
import { getGoogleMapsApiKey, getPlacesTimeoutMs } from "@/lib/config";
import { errorKind, isNetworkError } from "@/lib/network";

const PLACES_SEARCH_TEXT_URL =
  "https://places.googleapis.com/v1/places:searchText";

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.shortFormattedAddress",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.currentOpeningHours.openNow",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
].join(",");

const DEFAULT_RADIUS_METERS = 10_000;
const MAX_RADIUS_METERS = 50_000;
const MAX_RESULTS_PER_KEYWORD = 10;
const MAX_FACILITIES = 5;
const MAX_KEYWORDS = 2;

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

function clampRadius(radius: number): number {
  if (Number.isNaN(radius)) return DEFAULT_RADIUS_METERS;
  return Math.min(Math.max(radius, 0), MAX_RADIUS_METERS);
}

function pickNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

let warnedMissingKey = false;

async function fetchPlaces(
  url: string,
  init: RequestInit,
  label: string,
  timeoutMs: number
): Promise<Response | null> {
  const attempt = async () => {
    const startedAt = Date.now();

    try {
      const response = await fetch(
        url,
        timeoutMs > 0
          ? { ...init, signal: AbortSignal.timeout(timeoutMs) }
          : init
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

interface SearchTextPlace {
  id?: unknown;
  displayName?: { text?: unknown };
  shortFormattedAddress?: unknown;
  formattedAddress?: unknown;
  location?: { latitude?: unknown; longitude?: unknown };
  rating?: unknown;
  currentOpeningHours?: { openNow?: unknown };
  nationalPhoneNumber?: unknown;
  internationalPhoneNumber?: unknown;
}

interface LocatedPlace {
  place_id: string;
  name: string;
  vicinity: string;
  location: { lat: number; lng: number };
  rating?: number;
  openNow?: boolean;
  phoneNumber?: string;
}

function asLocatedPlace(raw: unknown): LocatedPlace | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as SearchTextPlace;
  const placeId = value.id;
  const lat = value.location?.latitude;
  const lng = value.location?.longitude;

  if (
    typeof placeId !== "string" ||
    placeId.length === 0 ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    place_id: placeId,
    name:
      typeof value.displayName?.text === "string"
        ? value.displayName.text
        : "",
    vicinity:
      pickNonEmptyString(
        value.shortFormattedAddress,
        value.formattedAddress
      ) ?? "",
    location: { lat, lng },
    rating:
      typeof value.rating === "number" && Number.isFinite(value.rating)
        ? value.rating
        : undefined,
    openNow:
      typeof value.currentOpeningHours?.openNow === "boolean"
        ? value.currentOpeningHours.openNow
        : undefined,
    phoneNumber: pickNonEmptyString(
      value.nationalPhoneNumber,
      value.internationalPhoneNumber
    ),
  };
}

async function searchTextPlaces(
  keyword: string,
  lat: number,
  lng: number,
  radius: number,
  apiKey: string,
  timeoutMs: number
): Promise<LocatedPlace[]> {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: keyword,
      maxResultCount: MAX_RESULTS_PER_KEYWORD,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius,
        },
      },
    }),
  };

  try {
    const res = await fetchPlaces(
      PLACES_SEARCH_TEXT_URL,
      init,
      "searchText",
      timeoutMs
    );
    if (!res) return [];

    if (!res.ok) {
      console.warn(`[places] searchText non-ok status=${res.status}`);
      return [];
    }

    const data = (await res.json().catch(() => null)) as {
      places?: unknown;
    } | null;
    if (!data || typeof data !== "object") {
      console.error("[places] searchText response invalid");
      return [];
    }

    const results = Array.isArray(data.places) ? data.places : [];
    return results
      .map(asLocatedPlace)
      .filter((place): place is LocatedPlace => place !== null);
  } catch {
    console.error("[places] searchText processing failed");
    return [];
  }
}

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  keywords: string[],
  radius = DEFAULT_RADIUS_METERS
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
  const effectiveRadius = clampRadius(radius);

  // Single parallel wave against Places API (New) Text Search;
  // phone numbers arrive inline via field mask so no detail wave is needed.
  const nearby = await Promise.all(
    keywords
      .slice(0, MAX_KEYWORDS)
      .map((keyword) =>
        searchTextPlaces(keyword, lat, lng, effectiveRadius, apiKey, timeoutMs)
      )
  );

  const seen = new Set<string>();
  return nearby
    .flat()
    .filter((place) => {
      if (seen.has(place.place_id)) return false;
      seen.add(place.place_id);
      return true;
    })
    .map(
      (place): NearbyFacility => ({
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        geometry: { location: place.location },
        rating: place.rating,
        opening_hours:
          place.openNow === undefined ? undefined : { open_now: place.openNow },
        formatted_phone_number: place.phoneNumber,
        distance: calculateDistance(
          lat,
          lng,
          place.location.lat,
          place.location.lng
        ),
      })
    )
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, MAX_FACILITIES);
}
